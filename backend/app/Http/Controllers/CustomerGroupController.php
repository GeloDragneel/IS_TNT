<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;
use App\Models\Customer_group;
use Illuminate\Http\Request;
use App\Events\CustomerGroupEvent;

use SendinBlue\Client\Api\EmailCampaignsApi;
use SendinBlue\Client\Api\ContactsApi;
use SendinBlue\Client\Model\RemoveContactFromList;
use SendinBlue\Client\Model\AddContactToList;
use SendinBlue\Client\Model\UpdateContact;
use SendinBlue\Client\Configuration;
use GuzzleHttp\Client;

class CustomerGroupController extends Controller{

    public function getCustomerGroupList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Customer_group::with(['groupList.customer'])->orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_group_en', 'like', "%{$search}%")
                    ->orWhere('currency', 'like', "%{$search}%")
                    ->orWhereHas('groupList.customer', function ($q) use ($search) {
                        $q->where('customer_code', 'like', "%{$search}%")
                        ->orWhere('email_address', 'like', "%{$search}%")
                        ->orWhere('account_name_en', 'like', "%{$search}%")
                        ->orWhere('account_name_en', 'like', "%{$search}%");
                    });
            });
        }
        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            $details = $list->groupList->map(function ($groupList) {
                $customer = $groupList->customer;
                return [
                    'id' => $customer->id,
                    'customer_code' => $customer->customer_code,
                    'status' => ($customer->status === 1 ? 'Active' : 'In-Active'),
                    'status_id' => $customer->status,
                    'account_name_en' => $customer->account_name_en,
                    'account_name_cn' => $customer->account_name_cn,
                    'email_address' => $customer->email_address,
                    'updated_at' => $customer->updated_at ? $customer->updated_at->format('M d, Y g:i A') : null,
                    'created_at' => $customer->created_at ? $customer->created_at->format('M d, Y g:i A') : null,
                    'sales_person' => optional($customer->salesPerson)->fullname,
                ];
            });
            return [
                'id' => $list->id,
                'customer_group_en' => $list->customer_group_en,
                'customer_group_cn' => $list->customer_group_cn,
                'currency' => $list->currency,
                'brevo_list_id' => $list->brevo_list_id,
                'updated_at' => $list->updated_at ? $list->updated_at->format('M d, Y g:i A') : null,
                'created_at' => $list->created_at ? $list->created_at->format('M d, Y g:i A') : null,
                'customer_count' => $details->count(), // ✅ Added count here
                'details' => $details,
            ];
        };

        // Apply transformation
        if ($perPage === -1) {
            $data = $result->map($transform);
            $response = [
                'current_page' => 1,
                'data' => $data,
                'last_page' => 1,
                'per_page' => $data->count(),
                'total' => $data->count(),
            ];
        } else {
            $data = $result->getCollection()->map($transform);
            $result->setCollection($data);
            $response = $result;
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $response,
        ]);
    }
    public function deleteCustomerGroup(Request $request){
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No IDs provided']);
        }

        // Start the transaction
        DB::beginTransaction();

        try {
            foreach ($ids as $id) {
                $group = Customer_group::find($id);

                // If GRN is not found, continue with the next ID
                if (!$group) continue;

                // Log the deletion action
                $globalController = new GlobalController();
                $globalController->logAction(
                    'Customer Group', 'm_customer_group',
                    'delete',
                    'Customer Group Name: ' . $group->customer_group_en
                );

                $group->delete();

                $this->deleteBrevoList($group->brevo_list_id);
            }
            event(new CustomerGroupEvent('delete'));
            // Commit the transaction
            DB::commit();
            // Return success response
            return response()->json([
                'token'     => 'Success',
                'message'   => 'Record has been Deleted'
            ]);
            
        } catch (\Exception $e) {
            // Rollback the transaction if something goes wrong
            DB::rollBack();

            // Return error response with exception message
            return response()->json([
                'token'     => 'Error',
                'message'   => $e->getMessage()
            ]);
        }
    }
    public function updateCustomerGroup(Request $request){
        $lastId = $request->id;
        $Action = ($lastId === 0 ? 'insert' : 'update');
        DB::beginTransaction();
        
        try {

            $name = $request->customer_group_en;
            $listId = $request->brevo_list_id;
            $createOrUpdate = ['status' => 'ok']; // ✅ Initialize to prevent undefined error

            if ((int) $lastId === 0) {
                $inserMaster = [
                    'customer_group_en' => $request->customer_group_en,
                    'customer_group_cn' => $request->customer_group_cn,
                    'currency'          => $request->currency,
                ];
                $master = Customer_group::create($inserMaster);
                $lastId = $master->id;

                $createOrUpdate = $this->createOrUpdateList($name,$listId,$lastId);
            }
            else{
                $master = Customer_group::find($request['id']);
                if ($master) {
                    $oldName = $master->customer_group_en;

                    $master->customer_group_en = $request->customer_group_en;
                    $master->customer_group_cn = $request->customer_group_cn;
                    $master->currency = $request->currency;
                    $master->save();
                    // Compare using the old value
                    if ($request->customer_group_en !== $oldName) {
                        $createOrUpdate = $this->createOrUpdateList($name, $listId, $lastId);
                    }
                }
            }

            if($createOrUpdate['status'] === 'error'){
                return response()->json([
                    'token'     => 'Error',
                    'message'   => $createOrUpdate['message'],
                    'action'    => $Action
                ]);
            }

            $globalController = new GlobalController();
            $globalController->logAction(
                'Customer Group', 'm_customer_group',
                $Action,
                'Customer Group Name : ' . $request->customer_group_en
            );

            DB::commit(); // 👍 Success
            return response()->json([
                'token'     => 'Success',
                'message'   => 'Record Successfully Saved',
                'id'        => $lastId,
                'action'    => $Action
            ]);
        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'token'     => 'Error',
                'message'   => $e->getMessage(),
                'id'        => 0,
                'action'    => $Action
            ]);
        }
    }
    public function createOrUpdateList($listName,$brevoListId,$lastId){
        $apiKey = env('SEND_IN_BLUE_API_KEY');

        $config = \SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', $apiKey);
        $apiInstance = new \SendinBlue\Client\Api\ContactsApi(
            new \GuzzleHttp\Client(),
            $config
        );

        try {
            // Get all lists (paginated, up to 50)
            $lists = $apiInstance->getLists(50, 0);

            $listId = null;
            foreach ($lists->getLists() as $list) {
                if ($list['id'] === (int) $brevoListId) {
                    $listId = $list['id'];
                    break;
                }
            }

            if ($listId) {
                // Update existing list
                $updateList = new \SendinBlue\Client\Model\UpdateList();
                $updateList->setName($listName);
                $apiInstance->updateList($listId, $updateList);

                return [
                    'status' => 'updated',
                    'listId' => $listId,
                    'message' => 'List updated successfully.'
                ];

            } else {
                // Create new list
                $createList = new \SendinBlue\Client\Model\CreateList();
                $createList->setName($listName);
                $createList->setFolderId(5);

                $result = $apiInstance->createList($createList);

                $group = Customer_group::find($lastId);
                if ($group) {
                    $group->brevo_list_id = $result->getId();
                    $group->save();
                }

                return [
                    'status' => 'created',
                    'listId' => $result->getId(),
                    'message' => 'List created successfully.'
                ];
            }

        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    public function deleteBrevoList($brevoListId){
        $apiKey = env('SEND_IN_BLUE_API_KEY');

        $config = \SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', $apiKey);
        $apiInstance = new \SendinBlue\Client\Api\ContactsApi(
            new \GuzzleHttp\Client(),
            $config
        );

        try {
            $apiInstance->deleteList($brevoListId);

            return [
                'status' => 'success',
                'message' => "List ID $brevoListId deleted successfully."
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
}
