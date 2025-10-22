<?php

namespace App\Services;

use SendinBlue\Client\Configuration;
use SendinBlue\Client\Api\ContactsApi;
use SendinBlue\Client\Model\CreateContact;
use SendinBlue\Client\Model\UpdateContact;
use GuzzleHttp\Client as GuzzleClient;
use App\Models\Customer_group_list;
use App\Models\Customer_group;
use App\Models\Customer_email;
use App\Models\Customer;
use Illuminate\Support\Facades\Log;
use Exception;

class BrevoService
{
    protected $apiInstance;

    public function __construct(){

        // Get API key from the .env file
        $apiKey = env('SEND_IN_BLUE_API_KEY');
        
        if (!$apiKey) {
            Log::error("SendInBlue API key not set in .env file");
            return;
        }

        // Initialize API configuration
        $config = Configuration::getDefaultConfiguration()->setApiKey('api-key', $apiKey);

        // Initialize ContactsApi with Guzzle client and disable SSL verification
        $this->apiInstance = new ContactsApi(new GuzzleClient([
            'verify' => false // Disables SSL verification
        ]), $config);
    }
    public function addOrUpdateContact($customerId){

        try {
            // Get customer by ID
            $customer = Customer::find($customerId);
            if (!$customer) {
                Log::error("Customer not found", ['customer_id' => $customerId]);
                return false;
            }
            // Get all emails for the customer
            $emails = Customer_email::where('customer_id', $customerId)->get();

            if ($emails->isEmpty()) {
                Log::error("No emails found for customer", ['customer_id' => $customerId]);
                return false;
            }
            // Get list IDs associated with the customer's groups
            $groupIds = Customer_group_list::where('customer_id', $customerId)->pluck('customer_group_id');
            $brevoListIds = Customer_group::whereIn('id', $groupIds)
                ->whereNotNull('brevo_list_id')
                ->pluck('brevo_list_id')
                ->toArray();

            if (empty($brevoListIds)) {
                Log::error("No Brevo list IDs found for customer's groups", ['customer_id' => $customerId]);
                return false;
            }

            // Process each email for the customer
            foreach ($emails as $emailObj) {
                $email = $emailObj->email_address;
                $encodedEmail = $email;

                // Check if the contact already exists
                $existingContact = $this->checkContactExists($encodedEmail);

                if ($existingContact) {
                    // Contact exists, update with new list IDs
                    $this->updateContact($encodedEmail, $email, $brevoListIds, $customerId);
                    Log::info("Updated contact", ['email' => $email, 'list_ids' => $brevoListIds]);
                } else {
                    // Contact doesn't exist, create new contact
                    $this->createContact($email, $brevoListIds);
                    Log::info("Created new contact", ['email' => $email, 'list_ids' => $brevoListIds]);
                }
            }

            return true;

        } catch (Exception $e) {
            Log::error("Error processing customer", [
                'customer_id' => $customerId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
    private function checkContactExists($email){
        try {
            // Directly use the plain email address, no URL encoding needed
            return $this->apiInstance->getContactInfo($email);
        } catch (Exception $e) {
            // If the contact does not exist, return null
            if ($e->getCode() == 404) {
                return null;
            }
            throw $e; // Re-throw exception if error is other than 404
        }
    }
    private function updateContact($encodedEmail, $email, $newListIds,$customerId){
        try {
            // Fetch the existing contact info (this gets the current listIds the contact is part of)
            $existingContact = $this->apiInstance->getContactInfo($encodedEmail);
            
            // Get the old listIds the contact is currently part of
            $oldListIds = $existingContact['listIds'];

            // Check if the customer is unsubscribed (is_subscribe = 0)
            if (Customer::where('id', $customerId)->value('is_subscribe') == 0 || Customer::where('id', $customerId)->value('status') == 0) {
                // If unsubscribed, unlink everything except 27 (unsubscribed list)

                // Fetch the existing contact info (this gets the current listIds the contact is part of)
                $existingContact = $this->apiInstance->getContactInfo($encodedEmail);

                // Get the old listIds the contact is currently part of
                $oldListIds = $existingContact['listIds'] ?? []; // Ensure it defaults to an empty array if no listIds

                // Remove everything except list 27 (unsubscribed list)
                $listIdsToRemove = array_diff($oldListIds, [27]); // Remove all except 27

                // Ensure listIdsToRemove is a simple indexed array (in case it's associative)
                $listIdsToRemove = array_values($listIdsToRemove);

                Log::info("listIdsToRemove for unsubscribed contact: $email", [
                    'listIdsToRemove' => $listIdsToRemove,
                ]);

                // Prepare the update contact object
                $updateContact = new UpdateContact();
                $updateContact['email'] = $email;

                // Ensure unlinkListIds is always an array, even if it's empty
                $updateContact['unlinkListIds'] = !empty($listIdsToRemove) ? $listIdsToRemove : []; // If nothing to remove, send an empty array

                // Ensure that list 27 is added (since it's the only list the contact should remain in)
                $updateContact['listIds'] = [27];  // Only keep list 27 for unsubscribed contacts

                // Update the contact with list 27 (and unlink any old lists if necessary)
                $this->apiInstance->updateContact($encodedEmail, $updateContact);



                return; // Exit early after unsubscribing the contact
            }

            // Otherwise, if the customer is not unsubscribed, continue with normal list update logic
            // Fetch the existing contact info (this gets the current listIds the contact is part of)
            $existingContact = $this->apiInstance->getContactInfo($encodedEmail);
            
            // Get the old listIds the contact is currently part of
            $oldListIds = $existingContact['listIds'];

            // Find the list IDs that are no longer needed (those that exist in the old list but not in the new list)
            $listIdsToRemove = array_diff($oldListIds, $newListIds);

            Log::info("Updated contact to unsubscribed list 27 and unlinked from old lists", [
                'email' => $email,
                'listIdsToRemove' => $listIdsToRemove,
            ]);

            // Ensure unlinkListIds is always an array, even if it's empty
            $unlinkListIds = !empty($listIdsToRemove) ? array_values($listIdsToRemove) : []; // If there are no lists to remove, set it as an empty array

            // Prepare the updateContact object
            $updateContact = new UpdateContact();
            $updateContact['email'] = $email;

            // If there are lists to remove, unlink them
            if (!empty($unlinkListIds)) {
                $updateContact['unlinkListIds'] = $unlinkListIds;
            } else {
                $updateContact['unlinkListIds'] = [];  // Ensure it's an empty array if no lists to unlink
            }

            // Update the contact's list IDs (whether unsubscribed or subscribed)
            $updateContact['listIds'] = $newListIds;  // Keep the new list IDs (including list 27 if required)

            // Update the contact in the API
            $this->apiInstance->updateContact($encodedEmail, $updateContact);

        } catch (Exception $e) {
            Log::error("Error updating contact for email: $email", [
                'error' => $e->getMessage(),
            ]);
        }
    }
    public function unlinkContactFromList($email, $listId){
        try {
            // Fetch the existing contact info (this gets the current listIds the contact is part of)
            $existingContact = $this->apiInstance->getContactInfo($email);

            // Get the old listIds the contact is currently part of
            $oldListIds = $existingContact['listIds'] ?? [];

            // Check if the contact is currently in the given listId
            if (in_array($listId, $oldListIds)) {
                // If the contact is in the list, unlink the contact from the list
                $updateContact = new UpdateContact();
                $updateContact['email'] = $email;
                $updateContact['unlinkListIds'] = [$listId];  // Specify the list to unlink from

                // Perform the API call to update the contact and unlink from the list
                $this->apiInstance->updateContact($email, $updateContact);

                Log::info("Unlinked contact from list $listId", [
                    'email' => $email,
                    'listId' => $listId
                ]);
            } else {
                Log::info("Contact is not part of list $listId", [
                    'email' => $email,
                    'listId' => $listId
                ]);
            }
        } catch (Exception $e) {
            Log::error("Error unlinking contact from list $listId for email: $email", [
                'error' => $e->getMessage(),
            ]);
        }
    }
    public function removeContact($email){
        try {
            // Call the API to delete the contact
            $this->apiInstance->deleteContact($email);

            // Log the successful deletion
            Log::info("Successfully deleted contact", [
                'email' => $email
            ]);
        } catch (Exception $e) {
            Log::error("Error deleting contact for email: $email", [
                'error' => $e->getMessage(),
            ]);
        }
    }
    private function createContact($email, $listIds){
        $createContact = new CreateContact();
        $createContact['email'] = $email;
        $createContact['listIds'] = $listIds;

        $this->apiInstance->createContact($createContact);
    }
}
