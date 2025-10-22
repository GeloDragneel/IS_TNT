<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;

use App\Models\Mass_mailer;
use App\Models\Email_settings;
use App\Models\Tag_emails;
use App\Models\Mass_mailer_template;
use App\Models\Mass_mailer_customer;
use App\Models\Mass_mailer_customer_group;
use App\Models\Customer;
use App\Models\Customer_group_list;
use App\Models\Product_images;
use App\Models\Products;
use App\Events\MassMailerEvent;

use Carbon\Carbon;
use SendinBlue\Client\Api\EmailCampaignsApi;
use SendinBlue\Client\Api\ContactsApi;
use SendinBlue\Client\Model\RemoveContactFromList;
use SendinBlue\Client\Model\AddContactToList;
use SendinBlue\Client\Model\UpdateContact;
use SendinBlue\Client\Configuration;
use GuzzleHttp\Client;

class MassMailerController extends Controller{

    public function getMassMailerList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $page = (int) $request->input('page', 1);
        $search = $request->input('search', '');

        // Base query with eager loading
        $query = Mass_mailer::with([
            'mailerCustomer.customer:id,customer_code,account_name_en,account_name_cn',
            'mailerCustomer.customer.emails:id,customer_id,email_address,set_as_default',
            'mailerCustomer.customer.customer_group:id,customer_group_en,customer_group_cn',
            'mailerGroup.customerGroup:id,customer_group_en,customer_group_cn'
        ])->orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('campaign_id', 'like', "%{$search}%")
                    ->orWhereHas('mailerCustomer.customer', function ($q) use ($search) {
                        $q->where('customer_code', 'like', "%{$search}%")
                        ->orWhere('account_name_en', 'like', "%{$search}%")
                        ->orWhere('account_name_cn', 'like', "%{$search}%");
                    })
                    ->orWhereHas('mailerGroup.customerGroup', function ($q) use ($search) {
                        $q->where('customer_group_en', 'like', "%{$search}%")
                        ->orWhere('customer_group_cn', 'like', "%{$search}%");
                    });
            });
        }

        // Pagination
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform paginated data (master + details data)
        $paginatedData = $perPage === -1
            ? $result->map(fn($item) => $this->transformOrderData($item))
            : tap($result)->getCollection()->transform(fn($item) => $this->transformOrderData($item));

        if ($perPage === -1) {
            // No pagination — return all
            $result = $query->get();
            $paginatedData = $result->map(fn($item) => $this->transformOrderData($item));

            $data = $paginatedData->map(function($order) {
                return array_merge(
                    $this->getOrderMasterData($order),
                    ['details' => $this->getOrderDetailsData($order)],
                );
            });

            $response = [
                'current_page' => 1,
                'data' => $data,
                'last_page' => 1,
                'per_page' => $data->count(),
                'total' => $data->count(),
            ];
        } else {
            // Paginated
            $result = $query->paginate($perPage);

            $paginatedData = tap($result)->getCollection()->transform(fn($item) => $this->transformOrderData($item));

            $data = $paginatedData->map(function($order) {
                return array_merge(
                    $this->getOrderMasterData($order),
                    ['details' => $this->getOrderDetailsData($order)],
                );
            });

            $response = [
                'current_page' => $result->currentPage(),
                'data' => $data,
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ];
        }
        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $response,
        ]);
    }
    private function transformOrderData($list){
        $list->campaign_id = $list->campaign_id;
        $list->template_id = $list->template_id;
        $list->campaign_name = $list->campaign_name;
        $list->date = $list->date;
        return $list;
    }
    private function getOrderMasterData($list){
        $emailCount = $list->mailerCustomer->sum(function($mc) {
            return optional($mc->customer)->emails->count() ?? 0;
        });
        return [
            'id' => $list->id,
            'campaign_id' => $list->campaign_id,
            'template_id' => $list->template_id,
            'campaign_name' => $list->campaign_name,
            'date' => $list->date,
            'email_count' => $emailCount, // 👈 total number of emails
        ];
    }
    private function getOrderDetailsData($list) {
        // Collect group IDs assigned to this mailer for quick lookup
        $mailerGroupIds = $list->mailerGroup->pluck('customer_group_id')->toArray();

        $detailsCopy = $list->mailerCustomer->flatMap(function ($detail) use ($mailerGroupIds, $list) {
            $customer = optional($detail->customer);
            $emails = $customer->emails ?? collect();

            // Filter customer groups to only those present in mailerGroup
            $filteredGroups = $customer->customer_group
                ->filter(fn($group) => in_array($group->id, $mailerGroupIds))
                ->values();

            // Format as "Group 1 (Name), Group 2 (Name)"
            $groupNames = $filteredGroups->map(function($group, $index) {
                return $group->customer_group_en;
            })->implode(', ');

            return $emails->map(function ($email) use ($detail, $customer, $groupNames) {
                return [
                    'id'                => $detail->id,
                    'customer_id'       => $customer->id,
                    'customer_code'     => $customer->customer_code,
                    'account_name_en'   => $customer->account_name_en,
                    'account_name_cn'   => $customer->account_name_cn ?: $customer->account_name_en,
                    'email_address'     => $email->email_address,
                    'set_as_default'    => $email->set_as_default,
                    'customer_groups'   => $groupNames, // filtered & formatted string
                ];
            });
        });

        return $detailsCopy->values();
    }
    public function getEmailSettings(Request $request){

        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Email_settings::orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('sender_name', 'like', "%{$search}%")
                ->orWhere('sender_email', 'like', "%{$search}%")
                ->orWhere('reply_to', 'like', "%{$search}%");
            });
        }
        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'sender_name' => $list->sender_name,
                'sender_email' => $list->sender_email,
                'reply_to' => $list->reply_to,
                'set_as_default' => $list->set_as_default,
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
    public function getTagEmails(Request $request){

        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Tag_emails::orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('email_address', 'like', "%{$search}%");
            });
        }
        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'email_address' => $list->email_address,
                'created_at' => $list->created_at ? $list->created_at->format('M d, Y g:i A') : null,
                'updated_at' => $list->updated_at ? $list->updated_at->format('M d, Y g:i A') : null,
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
    public function getTemplates(Request $request){

        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Mass_mailer_template::orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('template_name', 'like', "%{$search}%");
            });
        }
        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'template_name' => $list->template_name,
                'api_template_id' => $list->api_template_id,
                'created_at' => $list->created_at ? $list->created_at->format('M d, Y g:i A') : null,
                'updated_at' => $list->updated_at ? $list->updated_at->format('M d, Y g:i A') : null,
                'status' => $list->status,
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
    public function getCustomerByGroups(Request $request){
        $groupIds = $request->query('ids', []);

        $customers = Customer::with('emails')
            ->where('status', 1)
            ->where('is_view_new_order', 1)
            ->where('is_subscribe', 1)
            ->whereNotNull('customer_code')       // ✅ exclude null
            ->where('customer_code', '!=', '')    // ✅ exclude empty string
            ->whereHas('emails', function ($q) {
                $q->whereNotNull('email_address')
                ->where('email_address', '!=', '');
            })
            ->whereHas('customer_group', function ($q) use ($groupIds) {
                $q->whereIn('customer_group_id', $groupIds);
            })
            ->orderBy('id', 'desc')
            ->get();

        // Flatten the emails into rows
        $flattened = [];
        foreach ($customers as $customer) {
            if (!empty($customer->customer_code)) { // ✅ double-check
                foreach ($customer->emails as $email) {
                    if (!empty($email->email_address)) {
                        $flattened[] = [
                            'id'              => $email->id,
                            'customer_id'     => $customer->id,
                            'customer_code'   => $customer->customer_code,
                            'account_name_en' => $customer->account_name_en,
                            'account_name_cn' => $customer->account_name_cn ?: $customer->account_name_en,
                            'email_address'   => $email->email_address,
                        ];
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list'    => $flattened,
        ]);
    }
    public function getAllTemplates($status) {
        $list = Mass_mailer_template::where('status',$status)
            ->select('id', 'template_name','created_at','updated_at')
            ->orderBy('id', 'desc')
            ->get();

        $mappedTypes = $list->map(function ($list) {
            return [
                'value' => $list->id,
                'value2' => $list->id,
                'en' => $list->template_name,
                'cn' => $list->template_name,
                'created_at' => $list->created_at ? $list->created_at->format('M d, Y g:i A') : null,
                'updated_at' => $list->updated_at ? $list->updated_at->format('M d, Y g:i A') : null,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getProductImages($search){
        $product = Products::where('product_code', 'like', "%{$search}%")
            ->with('images') // eager load images
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ]);
        }

        $images = $product->images->map(function ($img) {
            return [
                'url' => asset('storage/' . $img->path),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $images,
        ]);
    }
    public function saveMassMailerTemplate(Request $request,$id,$saveType){
        $data = $request->all();

        DB::beginTransaction();

        try {
            $subject = $request->input('subject');
            $last_id = 0;

            if((int) $id === 0){
                $inserMaster = [
                    'status' => ($saveType === 'template' ? 2 : 0),
                    'template_name' => $subject,
                ];
                $master = Mass_mailer_template::create($inserMaster);
                $last_id = $master->id;
            }
            else{
                $master = Mass_mailer_template::find($request['id']);
                if ($master) {
                    $master->template_name = $subject;
                    $master->save();
                    $last_id = $master->id;
                }
            }

            $fileName = $last_id . '.json';
            $filePath = "products/templates/json/{$fileName}";

            $data = $request->all();
            $jsonContent = json_encode($data, JSON_PRETTY_PRINT);
            Storage::disk('public')->put($filePath, $jsonContent);
            $this->renderHTML($data,$last_id);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Template saved successfully',
                'file' => $fileName,
                'subject' => $subject,
                'last_id' => $last_id,
                'path' => "storage/products/templates/json/{$fileName}"
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage()
            ]);
        }
    }
    public function renderHTML($jsonContent,$last_id){
        $jsonData = $jsonContent['blocks'];
        $title = $jsonContent['subject'];
        $baseUrl = env('APP_URL');
        $html = '';
        $html .= '<!doctype html>
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta http-equiv="Pragma" content="no-cache">
                <meta http-equiv="Expires" content="-1">
                <meta http-equiv="CACHE-CONTROL" content="NO-CACHE">
                <title>'.$title.'</title>
                <style type="text/css">
                    p {
                        margin: 10px 0;
                        padding: 0;
                    }
                    .ql-editor p{
                        color : #fff;
                    }
                    table {
                        border-collapse: collapse;
                    }
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        display: block;
                        margin: 0;
                        padding: 0;
                    }

                    img,
                    a img {
                        border: 0;
                        height: auto;
                        outline: none;
                        text-decoration: none;
                    }

                    body,
                    #bodyTable,
                    #bodyCell {
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        font-family: "Nunito", sans-serif;
                    }

                    .mcnPreviewText {
                        display: none !important;
                    }

                    #outlook a {
                        padding: 0;
                    }

                    img {
                        -ms-interpolation-mode: bicubic;
                    }

                    table {
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                    }

                    .ReadMsgBody {
                        width: 100%;
                    }

                    .ExternalClass {
                        width: 100%;
                    }

                    p,
                    a,
                    li,
                    td,
                    blockquote {
                        mso-line-height-rule: exactly;
                    }

                    a[href^=tel],
                    a[href^=sms] {
                        color: inherit;
                        cursor: default;
                        text-decoration: none;
                    }

                    p,
                    a,
                    li,
                    td,
                    body,
                    table,
                    blockquote {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }

                    .ExternalClass,
                    .ExternalClass p,
                    .ExternalClass td,
                    .ExternalClass div,
                    .ExternalClass span,
                    .ExternalClass font {
                        line-height: 100%;
                    }

                    a[x-apple-data-detectors] {
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: "Nunito", sans-serif;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }

                    a.mcnButton {
                        display: block;
                    }

                    .mcnImage,
                    .mcnRetinaImage {
                        vertical-align: bottom;
                    }

                    .mcnTextContent {
                        word-break: break-word;
                    }

                    .mcnTextContent img {
                        height: auto !important;
                    }

                    .mcnDividerBlock {
                        table-layout: fixed !important;
                    }
                    body,
                    #bodyTable {
                        background-color: #000000;
                    }
                    #bodyCell {
                        border-top: 1px none;
                    }
                    #templateContainer {
                        border: 0;
                    }
                    h1 {
                        color: #ff0000 !important;
                        font-family: "Nunito", sans-serif;
                        font-size: 50px;
                        font-style: normal;
                        font-weight: normal;
                        line-height: 125%;
                        letter-spacing: -1px;
                        text-align: center;
                    }
                    h2 {
                        color: #404040 !important;
                        font-family: "Nunito", sans-serif;
                        font-size: 20px;
                        font-style: normal;
                        font-weight: normal;
                        line-height: 125%;
                        letter-spacing: -.75px;
                        text-align: left;
                    }
                    h3 {
                        color: #000000 !important;
                        font-family: "Nunito", sans-serif;
                        font-size: 18px;
                        font-style: normal;
                        font-weight: normal;
                        line-height: 125%;
                        letter-spacing: -.5px;
                        text-align: center;
                    }
                    h4 {
                        color: #808080 !important;
                        font-family: "Nunito", sans-serif;
                        font-size: 16px;
                        font-style: normal;
                        font-weight: normal;
                        line-height: 125%;
                        letter-spacing: normal;
                        text-align: left;
                    }
                    #templatePreheader {
                        background-color: #000000;
                        border-top: 0;
                        border-bottom: 0;
                    }
                    .preheaderContainer .mcnTextContent,
                    .preheaderContainer .mcnTextContent p {
                        color: #ffffffbf;
                        font-family: "Nunito", sans-serif;
                        font-size: 12px;
                        line-height: 125%;
                        text-align: left;
                    }
                    .preheaderContainer .mcnTextContent a {
                        color: #838383;
                        font-weight: normal;
                        text-decoration: underline;
                    }
                    #templateHeader {
                        background-color: #101010;
                        border-top: 0;
                        border-bottom: 0;
                    }
                    .headerContainer .mcnTextContent,
                    .headerContainer .mcnTextContent p {
                        color: #ffffffbf;
                        font-family: "Nunito", sans-serif;
                        font-size: 14px;
                        line-height: 150%;
                        text-align: left;
                    }
                    .headerContainer .mcnTextContent a {
                        color: #ffffffbf;
                        font-weight: normal;
                        text-decoration: underline;
                    }
                    #templateBody {
                        background-color: #101010;
                        border-top: 0;
                        border-bottom: 0;
                    }
                    .bodyContainer .mcnTextContent,
                    .bodyContainer .mcnTextContent p {
                        color: #ffffffbf;
                        font-family: "Nunito", sans-serif;
                        font-size: 14px;
                        line-height: 150%;
                        text-align: left;
                    }
                    .bodyContainer .mcnTextContent a {
                        color: #ffffffbf;
                        font-weight: normal;
                        text-decoration: underline;
                    }
                    #templateColumns {
                        background-color: #101010;
                        border-top: 0;
                        border-bottom: 0;
                    }
                    .leftColumnContainer .mcnTextContent,
                    .leftColumnContainer .mcnTextContent p {
                        color: #ffffffbf;
                        font-family: "Nunito", sans-serif;
                        font-size: 14px;
                        line-height: 150%;
                        text-align: left;
                    }
                    .leftColumnContainer .mcnTextContent a {
                        color: #ffffffbf;
                        font-weight: normal;
                        text-decoration: underline;
                    }
                    .centerColumnContainer .mcnTextContent,
                    .centerColumnContainer .mcnTextContent p {
                        color: #ffffffbf;
                        font-family: "Nunito", sans-serif;
                        font-size: 14px;
                        line-height: 150%;
                        text-align: left;
                    }
                    .centerColumnContainer .mcnTextContent a {
                        color: #ffffffbf;
                        font-weight: normal;
                        text-decoration: underline;
                    }
                    .rightColumnContainer .mcnTextContent,
                    .rightColumnContainer .mcnTextContent p {
                        color: #ffffffbf;
                        font-family: "Nunito", sans-serif;
                        font-size: 14px;
                        line-height: 150%;
                        text-align: left;
                    }
                    .rightColumnContainer .mcnTextContent a {
                        color: #ffffffbf;
                        font-weight: normal;
                        text-decoration: underline;
                    }
                    #templateFooter {
                        background-color: #101010;
                        border-top: 0;
                        border-bottom: 0;
                    }
                    .footerContainer .mcnTextContent,
                    .footerContainer .mcnTextContent p {
                        color: #ffffff;
                        font-family: "Helvetica Neue", Helvetica, Arial, Verdana, sans-serif;
                        font-size: 12px;
                        line-height: 125%;
                        text-align: left;
                    }
                    .footerContainer .mcnTextContent a {
                        color: #ffffff;
                        font-weight: normal;
                        text-decoration: underline;
                    }
                    @media only screen and (max-width: 480px) {
                        body,
                        table,
                        td,
                        p,
                        a,
                        li,
                        blockquote {
                            -webkit-text-size-adjust: none !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        body {
                            width: 100% !important;
                            min-width: 100% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {

                        #templateContainer,
                        #templatePreheader,
                        #templateHeader,
                        #templateColumns,
                        #templateBody,
                        #templateFooter {
                            max-width: 600px !important;
                            width: 100% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .columnsContainer {
                            display: block !important;
                            max-width: 600px !important;
                            padding-bottom: 18px !important;
                            padding-left: 0 !important;
                            width: 100% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .mcnRetinaImage {
                            max-width: 100% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .mcnImage {
                            height: auto !important;
                            width: 100% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {

                        .mcnCartContainer,
                        .mcnCaptionTopContent,
                        .mcnRecContentContainer,
                        .mcnCaptionBottomContent,
                        .mcnTextContentContainer,
                        .mcnBoxedTextContentContainer,
                        .mcnImageGroupContentContainer,
                        .mcnCaptionLeftTextContentContainer,
                        .mcnCaptionRightTextContentContainer,
                        .mcnCaptionLeftImageContentContainer,
                        .mcnCaptionRightImageContentContainer,
                        .mcnImageCardLeftTextContentContainer,
                        .mcnImageCardRightTextContentContainer,
                        .mcnImageCardLeftImageContentContainer,
                        .mcnImageCardRightImageContentContainer {
                            max-width: 100% !important;
                            width: 100% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .mcnBoxedTextContentContainer {
                            min-width: 100% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .mcnImageGroupContent {
                            padding: 9px !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {

                        .mcnCaptionLeftContentOuter .mcnTextContent,
                        .mcnCaptionRightContentOuter .mcnTextContent {
                            padding-top: 9px !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {

                        .mcnImageCardTopImageContent,
                        .mcnCaptionBottomContent:last-child .mcnCaptionBottomImageContent,
                        .mcnCaptionBlockInner .mcnCaptionTopContent:last-child .mcnTextContent {
                            padding-top: 18px !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .mcnImageCardBottomImageContent {
                            padding-bottom: 9px !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .mcnImageGroupBlockInner {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .mcnImageGroupBlockOuter {
                            padding-top: 9px !important;
                            padding-bottom: 9px !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {

                        .mcnTextContent,
                        .mcnBoxedTextContentColumn {
                            padding-right: 18px !important;
                            padding-left: 18px !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {

                        .mcnImageCardLeftImageContent,
                        .mcnImageCardRightImageContent {
                            padding-right: 18px !important;
                            padding-bottom: 0 !important;
                            padding-left: 18px !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .mcpreview-image-uploader {
                            display: none !important;
                            width: 100% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        h1 {
                            font-size: 24px !important;
                            line-height: 125% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        h2 {
                            font-size: 20px !important;
                            line-height: 125% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        h3 {
                            font-size: 18px !important;
                            line-height: 125% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        h4 {
                            font-size: 16px !important;
                            line-height: 125% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .mcnBoxedTextContentContainer .mcnTextContent,
                        .mcnBoxedTextContentContainer .mcnTextContent p {
                            font-size: 18px !important;
                            line-height: 125% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        #templatePreheader {
                            display: block !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .preheaderContainer .mcnTextContent,
                        .preheaderContainer .mcnTextContent p {
                            font-size: 14px !important;
                            line-height: 115% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .headerContainer .mcnTextContent,
                        .headerContainer .mcnTextContent p {
                            font-size: 18px !important;
                            line-height: 125% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .bodyContainer .mcnTextContent,
                        .bodyContainer .mcnTextContent p {
                            font-size: 18px !important;
                            line-height: 125% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .leftColumnContainer .mcnTextContent,
                        .leftColumnContainer .mcnTextContent p {
                            font-size: 18px !important;
                            line-height: 125% !important;
                        }
                    }
                    @media only screen and (max-width: 480px) {
                        .centerColumnContainer .mcnTextContent,
                        .centerColumnContainer .mcnTextContent p {
                            font-size: 18px !important;
                            line-height: 125% !important;
                        }
                    }
                    @media only screen and (max-width: 480px) {
                        .rightColumnContainer .mcnTextContent,
                        .rightColumnContainer .mcnTextContent p {
                            font-size: 18px !important;
                            line-height: 125% !important;
                        }
                    }

                    @media only screen and (max-width: 480px) {
                        .footerContainer .mcnTextContent,
                        .footerContainer .mcnTextContent p {
                            font-size: 14px !important;
                            line-height: 115% !important;
                        }
                    }
                </style>
            </head>
            <body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="margin-bottom: 60px;">
                <span class="mcnPreviewText" style="display:none; font-size:0px; line-height:0px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; visibility:hidden; mso-hide:all;"></span>
                <center>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
                        <tr>
                            <td align="center" valign="top" id="bodyCell">
                                <table border="0" cellpadding="0" cellspacing="0" width="600" id="templateContainer">
                                    <tr>
                                        <td align="center" valign="top">
                                            <table border="0" cellpadding="0" cellspacing="0" width="600" id="templateBody">
                                                <tr>
                                                    <td valign="top" class="bodyContainer blocks-group">';
                                                    foreach($jsonData as $item){
                                                        $content = $item['content'];
                                                        $id = $item['id'];
                                                        $styles = $item['styles'];
                                                        $type = $item['type'];
                                                        switch($type){
                                                            case 'image':
                                                                $max_width = 564;
                                                                $percentage = (int) str_replace('%', '', $content['width']);
                                                                $last_width = ($percentage / 100) * $max_width;
                                                                $link = "";
                                                                $target = "";
                                                                if(isset($content['link'])){
                                                                    $link = $content['link'];
                                                                    $target = "_blank";
                                                                }
                                                                $html .= '
                                                                <table datasource="image_'.$id.'" data_id="cblock_'.$id.'" border="0" cellpadding="0" cellspacing="0" width="100%" class="tableBlock2 table_block mcnImageBlock cblock_'.$id.'" style="min-width:100%;">
                                                                    <tbody class="mcnImageBlockOuter">
                                                                        <tr>
                                                                            <td valign="top" style="padding:9px" class="mcnImageBlockInner">
                                                                                <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" class="mcnImageContentContainer" style="min-width:100%;">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="mcnImageContent" valign="top" style="padding-right: 9px; padding-left: 9px; padding-top: 0; padding-bottom: 0; text-align:center;">';
                                                                                            if (!empty($content['link'])) {
                                                                                                $html .= '<a datasource="image_'.$id.'" target="'.$target.'" href="'.$link.'" class="Image_Link">';
                                                                                            }
                                                                                            $html .= '
                                                                                            <img data_id="cblock_'.$id.'" datasource="image_'.$id.'" align="center" alt="" src="'.$content['src'].'" width="'.$last_width.'" style="max-width:'.$last_width.'px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage img_template_src">';

                                                                                            if (!empty($content['link'])) {
                                                                                                $html .= '</a>';
                                                                                            }
                                                                                            $html .= '
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>';
                                                            break;
                                                            case 'image-text':
                                                                $html .= '<table datasource="cblock_'.$id.'" data_id="cblock_'.$id.'" border="0" cellpadding="0" cellspacing="0" width="100%" class="tableBlock5 table_block mcnCaptionBlock cblock_'.$id.'">
                                                                    <tbody class="mcnCaptionBlockOuter">
                                                                        <tr>
                                                                            <td class="mcnCaptionBlockInner" valign="top" style="padding:9px;">
                                                                                <table align="left" border="0" cellpadding="0" cellspacing="0" class="mcnCaptionBottomContent">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="mcnCaptionBottomImageContent" align="center" valign="top" style="padding:0 9px 9px 9px;">
                                                                                                <a datasource="cblock_'.$id.'" class="ImageText_Link"><img data_id="cblock_'.$id.'" datasource="cblock_'.$id.'" src="'.$content['image']['src'].'" width="564" style="max-width:1500px;" class="mcnImage img_template_src"></a>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="mcnTextContent" valign="top" style="padding:0 9px 0 9px;" width="564">'.$content['text'].'</td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>';
                                                            break;
                                                            case 'image-group':
                                                                $html .= '<table datasource="cblock_'.$id.'" data_id="cblock_'.$id.'" border="0" cellpadding="0" cellspacing="0" width="100%" class="tableBlock3 table_block mcnImageGroupBlock cblock_'.$id.'" id="mcnImageGroupBlock">
                                                                    <tbody class="mcnImageGroupBlockOuter">
                                                                        <tr>
                                                                            <td valign="top" style="padding:9px" class="mcnImageGroupBlockInner">';
                                                                                foreach($content['images'] as $row){
                                                                                    $html .= '
                                                                                    <table align="left" width="49%" border="0" cellpadding="0" cellspacing="0" class="mcnImageGroupContentContainer0">
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td class="mcnImageGroupContent" valign="top" style="padding-left: 9px; padding-top: 0; padding-bottom: 0;">
                                                                                                    <a datasource="cblock_'.$id.'_mcnImageGroupBlock_0" class="ImageGroup_Link">
                                                                                                        <img data_id="cblock_'.$id.'" datasource="cblock_'.$id.'_mcnImageGroupBlock_0" src="'.$row['src'].'" style="max-width:1500px; padding-bottom: 0;width:100%" class="mcnImage img_template_src">
                                                                                                    </a>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>';
                                                                                }
                                                                            $html .= '
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>';
                                                            break;
                                                            case 'boxed-text':
                                                                $html .= '
                                                                <table datasource="cblock_'.$id.'" data_id="cblock_'.$id.'" align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;" class="tableBlock0 table_block mcnBoxedTextContentContainer cblock_'.$id.'">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td style="padding-top:9px; padding-left:18px; padding-bottom:9px; padding-right:18px;">
                                                                                <table border="0" cellspacing="0" class="mcnTextContentContainer0" width="100%" style="min-width: 100% !important;background-color: #404040;">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td valign="top" class="mcnTextContent" style="padding: 18px;color: #F2F2F2;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: center;">
                                                                                                '.$content['text'].'
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>';
                                                            break;
                                                            case 'divider':
                                                                $html .= '
                                                                <table datasource="cblock_'.$id.'" data_id="cblock_'.$id.'" border="0" cellpadding="0" cellspacing="0" width="100%" class="tableBlock1 table_block mcnDividerBlock cblock_'.$id.'" style="min-width:100%;">
                                                                    <tbody class="mcnDividerBlockOuter">
                                                                        <tr>
                                                                            <td class="mcnDividerBlockInner" style="min-width:100%; padding:18px;">
                                                                                <table class="mcnDividerContent" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;border-top: 2px dashed #EAEAEA;">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td>
                                                                                                <span></span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>';
                                                            break;
                                                            case 'image-card':
                                                                $html .= '<table datasource="cblock_'.$id.'" data_id="cblock_'.$id.'" border="0" cellpadding="0" cellspacing="0" width="100%" class="tableBlock4 table_block mcnImageCardBlock cblock_'.$id.'">
                                                                    <tbody class="mcnImageCardBlockOuter">
                                                                        <tr>
                                                                            <td class="mcnImageCardBlockInner" valign="top" style="padding-top:9px; padding-right:18px; padding-bottom:9px; padding-left:18px;">
                                                                                <table align="right" border="0" cellpadding="0" cellspacing="0" class="mcnImageCardBottomContent" width="100%" style="background-color: #404040;">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="mcnImageCardBottomImageContent" align="left" valign="top" style="padding-top:0px; padding-right:0px; padding-bottom:0; padding-left:0px;">
                                                                                                <a datasource="cblock_'.$id.'" class="ImageCard_Link"><img data_id="cblock_'.$id.'" datasource="cblock_'.$id.'" src="'.$content['image']['src'].'" width="564" style="max-width:1500px;" class="mcnImage img_template_src"></a>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td class="mcnTextContent" valign="top" style="padding: 9px 18px;color: #F2F2F2;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: center;" width="546">
                                                                                                '.$content['description'].'
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>';
                                                            break;
                                                            case 'footer':
                                                                $html .= '<table datasource="cblock_'.$id.'" data_id="cblock_'.$id.'" align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%; min-width:100%;" width="100%" class="tableBlock7 table_block mcnTextContentContainer cblock_'.$id.'">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td valign="top" class="mcnTextContent" style="padding-top:0; padding-right:18px; padding-bottom:9px; padding-left:18px;">
                                                                                <p style="text-align:center">'.$content['companyName'].'</p>
                                                                                <p style="text-align:center">'.$content['address'].'</p>
                                                                                <p style="text-align:center">'.$content['unsubscribeText'].'</p>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>';
                                                            break;
                                                            case 'social':
                                                                $html .= '
                                                                <table datasource="cblock_'.$id.'" data_id="cblock_'.$id.'" border="0" cellpadding="0" cellspacing="0" width="100%" class="tableBlock6 table_block mcnFollowBlock cblock_'.$id.'" style="min-width:100%;">
                                                                    <tbody class="mcnFollowBlockOuter">
                                                                        <tr>
                                                                            <td align="center" valign="top" style="padding:9px" class="mcnFollowBlockInner">
                                                                                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnFollowContentContainer" style="min-width:100%;">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td align="center" style="padding-left:9px;padding-right:9px;">
                                                                                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;" class="mcnFollowContent">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td align="center" valign="top" style="padding-top:9px; padding-right:9px; padding-left:9px;">
                                                                                                                <table align="center" border="0" cellpadding="0" cellspacing="0">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td align="center" valign="top">';
                                                                                                                                foreach($content['platforms'] as $social){
                                                                                                                                    $name = $social['name'];
                                                                                                                                    $url = $social['url'];
                                                                                                                                    $html .= '
                                                                                                                                    <table align="left" border="0" cellpadding="0" cellspacing="0" style="display:inline;">
                                                                                                                                        <tbody>
                                                                                                                                            <tr>
                                                                                                                                                <td valign="top" style="padding-right:10px; padding-bottom:9px;" class="mcnFollowContentItemContainer">
                                                                                                                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnFollowContentItem">
                                                                                                                                                        <tbody>
                                                                                                                                                            <tr>
                                                                                                                                                                <td align="left" valign="middle" style="padding-top:5px; padding-right:10px; padding-bottom:5px; padding-left:9px;">
                                                                                                                                                                    <table align="left" border="0" cellpadding="0" cellspacing="0" width="">
                                                                                                                                                                        <tbody>
                                                                                                                                                                            <tr>
                                                                                                                                                                                <td align="center" valign="middle" width="24" class="mcnFollowIconContent">
                                                                                                                                                                                    <a class="follow_Link" datasource="cblock_'.$id.'_Social0" href="'.$url.'" target="_blank">
                                                                                                                                                                                        <img data_id="cblock_'.$id.'" src="'.$baseUrl.'/storage/products/'.$name.'.png" alt="Facebook" style="display:block;" height="24" width="24" class="">
                                                                                                                                                                                    </a>
                                                                                                                                                                                </td>
                                                                                                                                                                            </tr>
                                                                                                                                                                        </tbody>
                                                                                                                                                                    </table>
                                                                                                                                                                </td>
                                                                                                                                                            </tr>
                                                                                                                                                        </tbody>
                                                                                                                                                    </table>
                                                                                                                                                </td>
                                                                                                                                            </tr>
                                                                                                                                        </tbody>
                                                                                                                                    </table>';  
                                                                                                                                }
                                                                                                                            $html .= '
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>';
                                                            break;
                                                            case 'video':
                                                                $html .= '
                                                                <table datasource="cblock_'.$id.'" data_id="cblock_'.$id.'" border="0" cellpadding="0" cellspacing="0" width="100%" class="tableBlock8 table_block mcnVideoBlock cblock_'.$id.'" style="min-width:100%;">
                                                                    <tbody class="mcnImageBlockOuter">
                                                                        <tr>
                                                                            <td valign="top" style="padding:9px" class="mcnImageBlockInner">
                                                                                <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" class="mcnImageContentContainer" style="min-width:100%;">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td class="mcnImageContent" valign="top" style="padding-right: 9px; padding-left: 9px; padding-top: 0; padding-bottom: 0; text-align:center;">
                                                                                                <a datasource="cblock_'.$id.'" class="video_Link" href="'.$content['videoUrl'].'" target="_blank"><img data_id="cblock_'.$id.'" datasource="cblock_'.$id.'" align="center" alt="" src="'.$content['thumbnail'].'" width="564" style="max-width:1200px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="vid_image_display"></a>
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>';
                                                            break;
                                                        }
                                                    }
                                                    $html .='</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" valign="top">
                                            <!-- BEGIN COLUMNS // -->
                                            <table border="0" cellpadding="0" cellspacing="0" width="600" id="templateColumns">
                                                <tr>
                                                    <td align="left" valign="top" class="columnsContainer" width="33%">
                                                        <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" class="templateColumn">
                                                            <tr>
                                                                <td valign="top" class="leftColumnContainer"></td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                    <td align="left" valign="top" class="columnsContainer" width="33%">
                                                        <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" class="templateColumn">
                                                            <tr>
                                                                <td valign="top" class="centerColumnContainer"></td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                    <td align="left" valign="top" class="columnsContainer" width="33%">
                                                        <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" class="templateColumn">
                                                            <tr>
                                                                <td valign="top" class="rightColumnContainer"></td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!-- // END COLUMNS -->
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </center>
            </body>
        </html>';
        $htmlFileName = "{$last_id}.html";
        Storage::disk('public')->put("products/templates/layout/{$htmlFileName}", $html);
    }
    public function getMassMailerTemplate($templateId){
        $path = "products/templates/json/{$templateId}.json";

        if (!Storage::disk('public')->exists($path)) {
            $path = "products/templates/json/0.json";
        }

        $jsonContent = Storage::disk('public')->get($path);
        $data = json_decode($jsonContent, true); // decode to array

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
    private function normalizeArrayInput($input){
        $result = [];

        if (!is_array($input)) {
            return $result;
        }

        foreach ($input as $item) {
            if (is_string($item)) {
                $decoded = json_decode($item, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    // Only add decoded value if it's not empty
                    if (!empty($decoded)) {
                        $result = array_merge($result, (array) $decoded);
                    }
                } else {
                    $result[] = $item;
                }
            } else {
                $result[] = $item;
            }
        }

        return $result;
    }
    public function sendMassMailer(Request $request){
        $campaign_id = $request->campaign_id;
        $date = $request->date;
        $group = $request->group;

        $tag = $request->tag;
        $tag_norm = $this->normalizeArrayInput($tag);
        $tag_cnt = count($tag_norm);

        $email = $request->email;
        $email_norm = $this->normalizeArrayInput($email);
        $email_cnt = count($email_norm);

        $group = $request->group;
        $group_norm = $this->normalizeArrayInput($group);
        $group_cnt = count($group_norm);

        $sender = $request->sender;
        $sender_norm = $this->normalizeArrayInput($sender);
        $sender_cnt = count($sender_norm);

        $emails = $request->emails;
        $emails_norm = $this->normalizeArrayInput($emails);
        $emails_cnt = count($emails_norm);

        $groupIds = array_map(function ($item) {
            return $item['value2'] ?? null;
        }, $group_norm);

        $groupIds_Old = array_map(function ($item) {
            return $item['value'] ?? null;
        }, $group_norm);

        $emailIds = array_map(function ($item) {
            return $item['customer_id'] ?? null;
        }, $emails_norm);
        $emailIds_unique = array_filter(array_unique($emailIds));

        $singleEmailIds = array_map(function ($item) {
            return $item['id'] ?? null;
        }, $email_norm);
        $singleEmailIds_unique = array_filter(array_unique($singleEmailIds));

        DB::beginTransaction();
        try {

            if($tag_cnt > 0){
                $emailAddresses = array_map(function ($item) {
                    return $item['email_address'] ?? null;
                }, $tag_norm);
                $this->clearAndResetList($emailAddresses,28);
                if (!in_array(28, $groupIds)) {
                    $groupIds[] = 28;
                }
            }
            if($email_cnt > 0){
                $emailAddresses = array_map(function ($item) {
                    return $item['email_address'] ?? null;
                }, $email_norm);
                $this->clearAndResetList($emailAddresses,39);
                if (!in_array(39, $groupIds)) {
                    $groupIds[] = 39;
                }
            }

            $campaign = Mass_mailer_template::where('id',$campaign_id)->first();
            $campaignName = $campaign->template_name;
            $senderName = $sender_norm[0]['sender_name'];
            $senderEmail = $sender_norm[0]['sender_email'];
            $replyTo = $sender_norm[0]['reply_to'];

            $createCampaign = $this->createEmailCampaign($groupIds,$campaign_id,$campaignName,$senderName,$senderEmail,$replyTo);
            $BrevoCampaignId = $createCampaign->original['campaignId'];
            $BrevoStatus = $createCampaign->original['status'];
            
            if($BrevoStatus === 'error'){
                return response()->json([
                    'token' => 'Error',
                    'message' => $createCampaign->original['message']
                ]);
            }

            $inserMaster = [
                'date' => $date,
                'campaign_id' => $BrevoCampaignId,
                'template_id' => $campaign_id,
                'campaign_name' => $campaignName,
            ];
            $master = Mass_mailer::create($inserMaster);
            $mass_master_id = $master->id;

            if($group_cnt > 0){
                foreach($groupIds_Old as $groupId){
                    $insertGroup = [
                        'mass_mailer_id' => $mass_master_id,
                        'customer_group_id' => $groupId,
                    ];
                    Mass_mailer_customer_group::create($insertGroup);
                }
                foreach($emailIds_unique as $emailId){
                    $insertEmail = [
                        'mass_mailer_id' => $mass_master_id,
                        'customer_id' => $emailId,
                    ];
                    Mass_mailer_customer::create($insertEmail);
                }

                foreach($singleEmailIds_unique as $custId){
                    $insertEmail = [
                        'mass_mailer_id' => $mass_master_id,
                        'customer_id' => $custId,
                    ];
                    Mass_mailer_customer::create($insertEmail);

                    $customer_group = Customer_group_list::where('customer_id',$custId)->get();

                    foreach($customer_group as $group){
                        $insertEmail = [
                            'mass_mailer_id' => $mass_master_id,
                            'customer_group_id' => $group->id,
                        ];
                        Mass_mailer_customer_group::create($insertEmail);
                    }
                }

            }
            else{
                foreach($singleEmailIds_unique as $custId){
                    $insertEmail = [
                        'mass_mailer_id' => $mass_master_id,
                        'customer_id' => $custId,
                    ];
                    Mass_mailer_customer::create($insertEmail);

                    $customer_group = Customer_group_list::where('customer_id',$custId)->get();

                    foreach($customer_group as $group){
                        $insertEmail = [
                            'mass_mailer_id' => $mass_master_id,
                            'customer_group_id' => $group->id,
                        ];
                        Mass_mailer_customer_group::create($insertEmail);
                    }
                }
            }

            $campaign->status = 1;
            $campaign->save();

            event(new MassMailerEvent('send'));

            DB::commit(); // 👍 Success

            return response()->json([
                'token' => 'Success',
                'message' => 'Mail Successfully Send',
                'action' => 'insert',
            ]);
        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'token'     => 'Error',
                'message'   => $e->getMessage(),
                'action'    => 'insert'
            ]);
        }
    }
    public function createEmailCampaign($listIds,$campaignId,$campaignName,$senderName,$senderEmail,$replyTo){
        $apiKey = env('SEND_IN_BLUE_API_KEY');
        // Setup config and API client
        $config = Configuration::getDefaultConfiguration()->setApiKey('api-key', $apiKey);
        $apiInstance = new EmailCampaignsApi(new Client(), $config);

        $htmlPath = 'products/templates/layout/' . $campaignId . '.html';
        if (!\Storage::disk('public')->exists($htmlPath)) {
            return response()->json([
                'status' => 'error',
                'message' => 'HTML file not found.',
            ]);
        }
        $htmlContent = \Storage::disk('public')->get($htmlPath);
        $campaign = new \SendinBlue\Client\Model\CreateEmailCampaign();
        $campaign->setName($campaignName);
        $campaign->setSubject($campaignName);
        $campaign->setSender([
            "name" => $senderName,
            "email" => $senderEmail
        ]);
        $campaign->setReplyTo($replyTo);
        $campaign->setHtmlContent($htmlContent);
        $campaign->setRecipients(["listIds" => $listIds]);
        try {
            $result = $apiInstance->createEmailCampaign($campaign);
            $campaignId = $result->getId();

            // ✅ Send the campaign now
            $apiInstance->sendEmailCampaignNow($campaignId);

            return response()->json([
                'status' => 'success',
                'campaignId' => $campaignId,
                'message' => 'Campaign created and sent!'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
    }
    public function clearAndResetList(array $emailsToKeep,$listId): bool{
        // 1. Get all emails currently in list
        $currentEmails = $this->getAllEmailsFromList($listId);

        // 2. Remove all those emails from list (remove association only)
        if (!$this->removeEmailsFromList($listId, $currentEmails)) {
            return false;
        }
        // 3. Add your chosen emails back to list
        if (!$this->addEmailsToList($listId, $emailsToKeep)) {
            return false;
        }
        return true;
    }
    public function getAllEmailsFromList(int $listId): array{
        $config = Configuration::getDefaultConfiguration()->setApiKey(
            'api-key',
            config('services.brevo.api_key')
        );
        $client = new Client();
        $contactsApi = new ContactsApi($client, $config);

        $emails = [];
        $offset = 0;
        $limit = 50;

        do {
            $response = $contactsApi->getContactsFromList(
                $listId, 
                null,      // modifiedSince
                $limit,    // limit
                $offset,   // offset
                'desc'     // sort
            );
            
            foreach ($response->getContacts() as $contact) {
                // Access as array instead of object method
                $emails[] = $contact['email'];
            }
            
            $offset += $limit;
        } while ($offset < $response->getCount());

        return $emails;
    }
    public function removeEmailsFromList(int $listId, array $emails): bool{
        if (empty($emails)) {
            return true;
        }

        $config = Configuration::getDefaultConfiguration()->setApiKey(
            'api-key',
            config('services.brevo.api_key')
        );
        $client = new Client();
        $contactsApi = new ContactsApi($client, $config);

        $removeRequest = new RemoveContactFromList(['emails' => $emails]);

        try {
            $contactsApi->removeContactFromList($listId, $removeRequest);
            return true;
        } catch (\Exception $e) {
            \Log::error('Error removing emails from list: ' . $e->getMessage());
            return false;
        }
    }
    public function addEmailsToList(int $listId, array $emails): bool{
        if (empty($emails)) {
            return true;
        }

        $config = Configuration::getDefaultConfiguration()->setApiKey(
            'api-key',
            config('services.brevo.api_key')
        );
        $client = new Client();
        $contactsApi = new ContactsApi($client, $config);

        $addRequest = new AddContactToList(['emails' => $emails]);

        try {
            $contactsApi->addContactToList($listId, $addRequest);
            return true;
        } catch (\Exception $e) {
            \Log::error('Error adding emails to list: ' . $e->getMessage());
            return false;
        }
    }
    public function updateMassSettings(Request $request){
        $OrigID = $request->id;
        $Action = ($OrigID === 0 ? 'insert' : 'update');

        DB::beginTransaction();

        try {

            if ((int) $OrigID === 0) {
                $inserMaster = [
                    'sender_name' => $request->sender_name,
                    'sender_email' => $request->sender_email,
                    'reply_to' => $request->reply_to,
                ];
                $master = Email_settings::create($inserMaster);
                $OrigID = $master->id;
            }
            else{
                $master = Email_settings::find($request['id']);
                if ($master) {
                    $master->sender_name = $request->sender_name;
                    $master->sender_email = $request->sender_email;
                    $master->reply_to = $request->reply_to;
                    $master->save();
                }
            }
            
            $this->addOrEditEmailAddress(28,$request->sender_email);
            $this->addOrEditEmailAddress(28,$request->reply_to);

            $globalController = new GlobalController();
            $globalController->logAction(
                'Email Settings', 'm_email_settings',
                $Action,
                'Email : ' . $request->sender_email
            );

            event(new MassMailerEvent('settings'));

            DB::commit(); // 👍 Success
            return response()->json([
                'token'     => 'Success',
                'message'   => 'Settings Successfully Saved',
                'id'        => $OrigID,
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
    public function addOrEditEmailAddress($newListId,$email){
        $config = Configuration::getDefaultConfiguration()->setApiKey(
            'api-key',
            config('services.brevo.api_key')
        );
        $client = new Client();
        $contactsApi = new ContactsApi($client, $config);

        $checkEmailExists = $this->checkEmailExists($email);

        if ($checkEmailExists === 'Exists') {
            $contact = $contactsApi->getContactInfo($email);
            $currentListIds = $contact->getListIds();

            if (is_array($currentListIds) && !in_array($newListId, $currentListIds)) {
                $updatedListIds = array_merge($currentListIds, [$newListId]);

                $updateContact = new UpdateContact([
                    'listIds' => $updatedListIds,
                ]);

                $contactsApi->updateContact($email, $updateContact);
            }
        } else {
            // ✅ Safely create the contact and assign the list ID
            $createContact = new \SendinBlue\Client\Model\CreateContact([
                'email' => $email,
                'listIds' => [$newListId],
            ]);

            $contactsApi->createContact($createContact);
        }
    }
    public function delMassSettings(Request $request){
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No IDs provided']);
        }

        // Start the transaction
        DB::beginTransaction();

        try {
            foreach ($ids as $id) {
                $settings = Email_settings::find($id);

                // If GRN is not found, continue with the next ID
                if (!$settings) continue;

                // Log the deletion action
                $globalController = new GlobalController();
                $globalController->logAction(
                    'Email Settings', 'm_email_settings',
                    'delete',
                    'Email : ' . $settings->sender_email
                );

                // Delete the GRN
                $settings->delete();
            }

            $this->removeEmailsFromList(28,[$settings->sender_email]);

            event(new MassMailerEvent('settings'));
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
    public function updateMasstags(Request $request){
        $OrigID = $request->id;
        $Action = ($OrigID === 0 ? 'insert' : 'update');

        DB::beginTransaction();

        try {

            if ((int) $OrigID === 0) {
                $inserMaster = [
                    'email_address' => $request->email_address,
                ];
                $master = Tag_emails::create($inserMaster);
                $OrigID = $master->id;
            }
            else{
                $master = Tag_emails::find($request['id']);
                if ($master) {
                    $master->email_address = $request->email_address;
                    $master->save();
                }
            }

            $this->addOrEditEmailAddress(28,$request->email_address);

            $globalController = new GlobalController();
            $globalController->logAction(
                'Email Tag', 'm_email_settings',
                $Action,
                'Email : ' . $request->email_address
            );
            event(new MassMailerEvent('tags'));
            DB::commit(); // 👍 Success
            return response()->json([
                'token'     => 'Success',
                'message'   => 'Tags Successfully Saved',
                'id'        => $OrigID,
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
    public function delMassTags(Request $request){
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No IDs provided']);
        }

        // Start the transaction
        DB::beginTransaction();

        try {
            foreach ($ids as $id) {
                $tags = Tag_emails::find($id);

                // If GRN is not found, continue with the next ID
                if (!$tags) continue;

                // Log the deletion action
                $globalController = new GlobalController();
                $globalController->logAction(
                    'Email Tags', 'm_tag_emails',
                    'delete',
                    'Email : ' . $tags->email_address
                );

                // Delete the GRN
                $tags->delete();

                $this->removeEmailsFromList(28,[$tags->email_address]);
            }
            
            event(new MassMailerEvent('tags'));
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
    public function deleteTemplates(Request $request){
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No IDs provided']);
        }

        // Start the transaction
        DB::beginTransaction();

        try {
            foreach ($ids as $id) {
                $template = Mass_mailer_template::find($id);

                // If GRN is not found, continue with the next ID
                if (!$template) continue;

                // Log the deletion action
                $globalController = new GlobalController();
                $globalController->logAction(
                    'Email Templates', 't_mass_mailer_template',
                    'delete',
                    'Email : ' . $template->template_name
                );

                $template->delete();
            }
            event(new MassMailerEvent('templates'));
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
    public function deleteMassMailer(Request $request){
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No IDs provided']);
        }

        // Start the transaction
        DB::beginTransaction();

        try {
            foreach ($ids as $id) {
                $mass_mailer = Mass_mailer::find($id);

                // If GRN is not found, continue with the next ID
                if (!$mass_mailer) continue;

                // Log the deletion action
                $globalController = new GlobalController();
                $globalController->logAction(
                    'Mass Mailer', 't_mass_mailer',
                    'delete',
                    'Email : ' . $mass_mailer->campaign_name
                );

                $mass_mailer->delete();
            }
            event(new MassMailerEvent('mass_mailer'));
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
    public function getAllEmailCampaigns(){
        $apiKey = env('SEND_IN_BLUE_API_KEY');

        $config = Configuration::getDefaultConfiguration()->setApiKey('api-key', $apiKey);
        $apiInstance = new EmailCampaignsApi(new Client(), $config);

        try {
            $campaigns = $apiInstance->getEmailCampaigns(
                limit: 10,
                offset: 0,
                sort: 'desc'
            );
            
            // Use the correct methods for SendinBlue/Brevo API
            $campaignsList = $campaigns->getCampaigns(); // This should contain the actual campaigns

            $totalCount = $campaigns->getCount(); // Total number of campaigns
            $newCampaignArray = array();
            
            foreach($campaignsList as $campaign){

                $statistics = $campaign['statistics'];
                $campaignStats = $statistics->campaignStats;

                $recipients = 0;
                foreach ($campaignStats as $stat) {
                    $recipients += $stat->sent;
                }

                $opens = 0;
                foreach ($campaignStats as $stat) {
                    $opens += $stat->uniqueViews;
                }

                $clicks = 0;
                foreach ($campaignStats as $stat) {
                    $clicks += $stat->uniqueClicks;
                }

                $unsubscribed = 0;
                foreach ($campaignStats as $stat) {
                    $unsubscribed += $stat->unsubscriptions;
                }

                $openRate = $recipients > 0 ? ($opens / $recipients) * 100 : 0;
                $clickRate = $clicks > 0 ? ($clicks / $recipients) * 100 : 0;
                $unsubRate = $unsubscribed > 0 ? ($unsubscribed / $recipients) * 100 : 0;

                $sentDateRaw = $campaign['sentDate'] ?? null;
                if ($sentDateRaw) {
                    $formattedDate = Carbon::parse($sentDateRaw)->format('M j, Y g:i A');
                } else {
                    $formattedDate = null; // or a fallback string like 'No date'
                }
                $newCampaignArray[] = [
                    'id' => $campaign['id'],
                    'title' => $campaign['name'],
                    'status' => $campaign['status'],
                    'sentDate' => $formattedDate,
                    'opens' => $opens,
                    'openRate' => number_format($openRate,2).'%',
                    'recipients' => $recipients,
                    'clicks' => $clicks,
                    'clickRate' => number_format($clickRate,2).'%',
                    'unsubscribed' => $unsubscribed,
                    'unsubRate' => number_format($unsubRate,2).'%',
                ];
            }
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'campaigns' => $newCampaignArray,
                    'count' => $totalCount
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'data' => [
                    'campaigns' => [],
                    'count' => 0
                ],
                'message' => $e->getMessage()
            ]);
        }
    }
    public function getAllContacts(Request $request){
        $config = Configuration::getDefaultConfiguration()->setApiKey(
            'api-key',
            config('services.brevo.api_key')
        );
        $client = new Client();
        $contactsApi = new ContactsApi($client, $config);

        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 15);
        
        $contacts = [];
        $offset = 0;
        $limit = 50;
        $hasMore = true;

        // Fetch all contacts from Brevo
        do {
            try {
                $response = $contactsApi->getContacts(
                    $limit,
                    $offset,
                    null,
                    null,
                    'desc'
                );
                
                foreach ($response->getContacts() as $contact) {
                    // Parse dates if they are strings
                    $createdAt = isset($contact['createdAt']) 
                        ? (is_string($contact['createdAt']) 
                            ? \Carbon\Carbon::parse($contact['createdAt'])->format('M d, Y g:i A')
                            : $contact['createdAt']->format('M d, Y g:i A'))
                        : null;
                    
                    $modifiedAt = isset($contact['modifiedAt']) 
                        ? (is_string($contact['modifiedAt']) 
                            ? \Carbon\Carbon::parse($contact['modifiedAt'])->format('M d, Y g:i A')
                            : $contact['modifiedAt']->format('M d, Y g:i A'))
                        : null;
                    
                    $contacts[] = [
                        'id' => $contact['id'] ?? null,
                        'email_address' => $contact['email'] ?? null,
                        'emailBlacklisted' => $contact['emailBlacklisted'] ?? false,
                        'smsBlacklisted' => $contact['smsBlacklisted'] ?? false,
                        'created_at' => $createdAt,
                        'updated_at' => $modifiedAt,
                        'attributes' => $contact['attributes'] ?? [],
                        'listIds' => $contact['listIds'] ?? [],
                    ];
                }
                
                $offset += $limit;
                $hasMore = $offset < $response->getCount();
                
            } catch (\Exception $e) {
                \Log::error('Error fetching contacts from Brevo: ' . $e->getMessage());
                break;
            }
            
        } while ($hasMore);

        // Apply search filter
        if (!empty($search)) {
            $contacts = array_filter($contacts, function ($contact) use ($search) {
                return stripos($contact['email'], $search) !== false;
            });
            $contacts = array_values($contacts); // Re-index array
        }

        // Apply pagination
        $total = count($contacts);
        $lastPage = ceil($total / $perPage);
        $offset = ($page - 1) * $perPage;
        $paginatedContacts = array_slice($contacts, $offset, $perPage);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => [
                'current_page' => (int) $page,
                'data' => $paginatedContacts,
                'last_page' => (int) $lastPage,
                'per_page' => (int) $perPage,
                'total' => $total,
            ]
        ]);
    }
    public function checkEmailExists(string $email){
        $config = Configuration::getDefaultConfiguration()->setApiKey(
            'api-key',
            config('services.brevo.api_key')
        );
        $client = new Client();
        $contactsApi = new ContactsApi($client, $config);

        try {
            $contact = $contactsApi->getContactInfo($email);
            return 'Exists'; // Email exists
        } catch (\Exception $e) {
            if (strpos($e->getMessage(), '404') !== false) {
                return 'NotExists'; // Email doesn't exist
            }
            return 'NotExists';
        }
    }
}
