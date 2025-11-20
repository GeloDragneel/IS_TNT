<?php

namespace App\Http\Controllers;
use Google\Service\ShoppingContent\Resource\Customers;
use Illuminate\Http\Request;
use App\Models\Countries;
use App\Models\Courier;
use App\Models\Employee_Info;
use App\Models\Shipping_terms;
use App\Models\Operator;
use App\Models\Forex;
use App\Models\Product_type;
use App\Models\Manufacturer;
use App\Models\Series;
use App\Models\Brands;
use App\Models\Genre;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Currencies;
use App\Models\Customer_group;
use App\Models\Access_rights;
use App\Models\Logs;
use App\Models\States;
use App\Models\Source;
use App\Models\Tax_group;
use App\Models\Payment_terms;
use App\Models\Customer_type;
use App\Models\Charts_of_account;
use App\Models\Customer;
use App\Models\Products;
use App\Models\POStatus;
use App\Models\Grn_status;
use App\Models\Store_location;
use App\Models\Login;
use App\Models\Invoice_type;
use App\Models\Shipping_stat;
use App\Models\Invoice_status;
use App\Models\Payment_type;
use App\Models\Serial_no;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Hash;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Http;
class GlobalController extends Controller
{
    public static function getCurrentDateExRate(string $currency, string $baseCurrency): float{
        if ($currency === $baseCurrency || empty($currency)) {
            return 1;
        }

        $today = Carbon::now('Asia/Singapore')->format('m/d/Y');

        $rate = Forex::where('from_currency', $baseCurrency)
            ->where('to_currency', $currency)
            ->where('date_enter', $today)
            ->value('ex_rate');

        return $rate ?? 0;
    }
    public static function getOperator(string $conversionKey): string{
        return Operator::where('convertion', $conversionKey)->value('operator') ?? '';
    }
    public function getAllProductTypes() {
        $types = Product_type::select('id', 'product_type_en','product_type_cn')
        ->where('is_deleted', 0)
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->product_type_en,
                'cn' => $type->product_type_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllManufacturers() {
        $types = Manufacturer::select('id', 'manufacturer_en','manufacturer_cn')
        ->where('is_deleted', 0)
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->manufacturer_en,
                'cn' => $type->manufacturer_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllSeries() {
        $types = Series::select('id', 'series_en','series_cn', 'manufacturer_id')
        ->where('is_deleted', 0)
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => $type->manufacturer_id,
                'en' => $type->series_en,
                'cn' => $type->series_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllSalesPerson() {
        $types = Employee_Info::select('id', 'firstname','middlename', 'lastname')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => $type->id,
                'en' => $type->firstname.' '.$type->middlename.' '.$type->lastname,
                'cn' => $type->firstname.' '.$type->middlename.' '.$type->lastname,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllBrands() {
        $types = Brands::select('id', 'brands_en','brands_cn')
        ->where('is_deleted', 0)
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->brands_en,
                'cn' => $type->brands_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllGenre() {
        $types = Genre::select('id', 'genre_en','genre_cn')
        ->where('is_deleted', 0)
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->genre_en,
                'cn' => $type->genre_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllCourier() {
        $types = Courier::select('id', 'courier_en','courier_cn')
        ->where('is_deleted', 0)
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->courier_en,
                'cn' => $type->courier_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllTaxGroup() {
        $types = Tax_group::select('id', 'tax_value','tax')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->tax_value,
                'value2' => null,
                'en' => $type->tax,
                'cn' => $type->tax,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllShippingTerms() {
        $types = Shipping_terms::select('id', 'shipping_terms_en','shipping_terms_cn')
        ->where('is_deleted', 0)
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->shipping_terms_en,
                'cn' => $type->shipping_terms_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllInvoiceType() {
        $types = Invoice_type::select('id', 'invoice_type_en','invoice_type_cn')->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->invoice_type_en,
                'cn' => $type->invoice_type_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllShippingStat() {
        $types = Shipping_stat::select('id', 'shipping_stat_en','shipping_stat_cn')->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->shipping_stat_en,
                'cn' => $type->shipping_stat_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllPaymentTerms() {
        $types = Payment_terms::select('id', 'payment_terms_en','payment_terms_cn')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->payment_terms_en,
                'cn' => $type->payment_terms_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllPaymentType() {
        $types = Payment_type::select('id', 'payment_type_en','payment_type_cn')
            ->whereIn('id',[1,2,3,5])
            ->get();
        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => $type->id,
                'en' => $type->payment_type_en,
                'cn' => $type->payment_type_cn,
            ];
        });
        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllExpenses() {
        $accounts = Charts_of_account::where('account_code', 'like', '6%')
            ->where('root_name', '>', 0)
            ->orderBy('account_name_en', 'asc')
            ->get();

        $mappedTypes = $accounts->map(function ($account) {
            return [
                'value' => $account->account_code,
                'value2' => null,
                'en' => $account->account_name_en,
                'cn' => $account->account_name_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllCustomer() {
        $types = Customer::select('id','customer_code')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->customer_code,
                'cn' => $type->customer_code,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllProduct() {
        $types = Products::select('id','product_code')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->product_code,
                'cn' => $type->product_code,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllCountries() {
        $types = Countries::select('id', 'country_en','country_cn')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->country_en,
                'cn' => $type->country_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllStates() {
        $types = States::select('id', 'statename_en','statename_cn')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->statename_en,
                'cn' => $type->statename_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllSource() {
        $types = Source::select('id', 'description_en','description_cn')->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->description_en,
                'cn' => $type->description_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getInvoiceStatus() {
        $types = Invoice_status::select('id', 'status_value_en','status_value_cn')->get();
        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->status_value_en,
                'cn' => $type->status_value_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllSuppliers(Request $request){
        $types = Supplier::select('id', 'suppliername_en','suppliername_cn','supplier_code')
        ->where('is_deleted', 0)
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'code' => $type->supplier_code,
                'en' => $type->suppliername_en,
                'cn' => $type->suppliername_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllWarehouse(Request $request){
        $types = Warehouse::select('id', 'warehouse_en','warehouse_cn','wh_code')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->wh_code,
                'value2' => null,
                'en' => $type->warehouse_en,
                'cn' => $type->warehouse_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllCustomerType(Request $request){
        $types = Customer_type::select('id', 'description_en','description_cn','code')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->code,
                'value2' => null,
                'en' => $type->description_en,
                'cn' => $type->description_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllCurrencies(Request $request){
        $types = Currencies::select('id', 'currency_title','code')
            ->where('is_deleted', 0)
            ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->code,
                'value2' => null,
                'en' => $type->code,
                'cn' => $type->code,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllPOStatus(Request $request){
        $types = POStatus::select('id', 'postatus_en','postatus_cn')->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->postatus_en,
                'cn' => $type->postatus_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllGRNStatus(Request $request){
        $types = Grn_status::select('id', 'grn_status_en','grn_status_cn')->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->grn_status_en,
                'cn' => $type->grn_status_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllBanks() {
        $types = Charts_of_account::select('account_code', 'account_name_en','account_name_cn')
        ->where('root_name', 12100)
        ->orderBy('account_name_en', 'asc')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->account_code,
                'value2' => null,
                'en' => $type->account_name_en,
                'cn' => $type->account_name_cn == '' ? $type->account_name_en : $type->account_name_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllStoreLocation() {
        $types = Store_location::select('id', 'store_name_en','store_name_cn')
        ->orderBy('store_name_en', 'asc')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => null,
                'en' => $type->store_name_en,
                'cn' => $type->store_name_cn == '' ? $type->store_name_en : $type->store_name_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getExchangeRate($from, $to, $date){
        $formattedDate = date('Y-m-d', strtotime($date));

        $rate = Forex::where('from_currency', $from)
            ->where('to_currency', $to)
            ->where('date_enter', $formattedDate)
            ->orderBy('date_enter', 'desc')
            ->value('ex_rate');

        return response()->json([
            'success' => true,
            'rate' => $rate ?? 1, // Default to 1 if no rate is found
        ]);
    }
    public function getAllCustomerGroup(Request $request){
        $types = Customer_group::select('id', 'brevo_list_id', 'customer_group_en','customer_group_cn')
        ->get();

        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => $type->brevo_list_id,
                'en' => $type->customer_group_en,
                'cn' => $type->customer_group_cn,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getUserMenu($loginId){ 
        // Get all menus for the user
        $userMenus = Access_rights::with('menu')
            ->where('login_id', $loginId)
            ->get()
            ->pluck('menu') // Pluck the menu relationships
            ->flatten() // Flatten to make sure it's a single-level collection of menus
            ->sortBy('ranking') // Sort by ranking in ascending order
            ->filter(); // Apply the filter

        // Separate parents and children
        $parents = $userMenus->where('root_name', 'root');
        $children = $userMenus->where('root_name', '!=', 'root');
        
        // Group children by their parent menu_id (root_name)
        $groupedChildren = $children->groupBy('root_name');
        
        // Build the menu structure
        $accessRights = $parents->map(function ($parent) use ($groupedChildren) {
            $parentId = $parent->id;
            $childMenus = $groupedChildren->get($parentId, collect([]));
            
            return [
                'id' => strtolower(str_replace(' ', '-', $parent->label_en)),
                'label' => $parent->label_en,
                'icon' => $parent->icon_name,
                'items' => $childMenus->map(function ($item) {
                    return [
                        'id' => strtolower(str_replace(' ', '-', $item->label_en)),
                        'labelKey' => $item->label_en,
                        'label' => $item->label_en,
                        'icon' => $item->icon_name,
                        'component' => $item->component,
                        'componentName' => $item->component_name,
                        'iconName' => $item->icon_name,
                    ];
                })->values(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'list' => $accessRights
        ]);
    }
    public function logAction($module,$table,$action,$description){
        // Assuming you have variables for the log data, e.g., module, table, action, description, added_by
        // $addedBy = auth()->user() ? auth()->user()->user_id : null;
        $addedBy = session('user_id') ?? 69;
        $logData = [
            'module' => $module,
            'table' => $table,
            'action' => $action,
            'description' => $description,
            'added_by' => $addedBy, // Assuming you're tracking the user who performed the action
        ];

        // Insert log into the t_logs table
        Logs::create($logData);
    }
    public function getAllDropdownData($tableName, $id){
        // Define your model mappings
        $modelMapping = [
            'courier' => Courier::class,
            'shipping_terms' => Shipping_terms::class,
            'warehouse' => Warehouse::class,
            'countries' => Countries::class,
            'states' => States::class,
            'sales_person' => Employee_Info::class,
            'customer_type' => Customer_type::class,
            'tax_group' => Tax_group::class
        ];

        // Check if the provided tableName is valid
        if (!array_key_exists($tableName, $modelMapping)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid table name.',
            ], 400);
        }

        // Get the model class based on the table name
        $modelClass = $modelMapping[$tableName];

        // Define your column mappings for each table
        $columnMapping = [
            'courier' => ['id', 'courier_en', 'courier_cn'],
            'shipping_terms' => ['id', 'shipping_terms_en', 'shipping_terms_cn'],
            'warehouse' => ['id', 'wh_code', 'warehouse_en', 'warehouse_cn'],
            'countries' => ['id', 'country_en', 'country_cn'],
            'states' => ['id', 'statename_en', 'statename_cn'],
            'sales_person' => ['id', 'firstname', 'middlename', 'lastname'],
            'customer_type' => ['id', 'description_en', 'description_cn', 'code'],
            'tax_group' => ['id', 'tax_value', 'tax']
        ];

        // Define the dynamic `where` column mapping
        $whereColumnMapping = [
            'courier' => 'id',  // For Courier, it's 'id'
            'shipping_terms' => 'id',  // For Shipping Terms, it's 'id'
            'warehouse' => 'wh_code',  // For Warehouse, it's 'wh_code'
            'countries' => 'id',  // For Countries, it's 'id'
            'states' => 'id',  // For States, it's 'id'
            'sales_person' => 'id',  // For Sales Person, it's 'id'
            'customer_type' => 'code',  // For Customer Type, it's 'code'
            'tax_group' => 'tax_value',  // For Tax Group, it's 'tax_value'
        ];


        // Check if the provided tableName is valid
        if (!array_key_exists($tableName, $modelMapping)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid table name.',
            ], 400);
        }

        // Get the model class based on the table name
        $modelClass = $modelMapping[$tableName];

        // Get the columns to select dynamically from the column map
        $columns = $columnMapping[$tableName];

        $whereColumn = $whereColumnMapping[$tableName];

        // Dynamically get the data using the id as a filter
        $types = $modelClass::select($columns)
            ->where('is_deleted', 0) // Optional: if applicable
            ->where($whereColumn, $id)
            ->get();

        // Dynamically map the data based on the structure you need
        $mappedTypes = $types->map(function ($type) use ($tableName) {
            switch ($tableName) {
                case 'courier':
                    return [
                        'value' => $type->id,
                        'value2' => null,
                        'en' => $type->courier_en,
                        'cn' => $type->courier_cn,
                    ];
                case 'shipping_terms':
                    return [
                        'value' => $type->id,
                        'value2' => null,
                        'en' => $type->shipping_terms_en,
                        'cn' => $type->shipping_terms_cn,
                    ];
                case 'warehouse':
                    return [
                        'value' => $type->wh_code,
                        'value2' => null,
                        'en' => $type->warehouse_en,
                        'cn' => $type->warehouse_cn,
                    ];
                case 'countries':
                    return [
                        'value' => $type->id,
                        'value2' => null,
                        'en' => $type->country_en,
                        'cn' => $type->country_cn,
                    ];
                case 'states':
                    return [
                        'value' => $type->id,
                        'value2' => null,
                        'en' => $type->statename_en,
                        'cn' => $type->statename_cn,
                    ];
                case 'sales_person':
                    return [
                        'value' => $type->id,
                        'value2' => $type->id,
                        'en' => $type->firstname.' '.$type->middlename.' '.$type->lastname,
                        'cn' => $type->firstname.' '.$type->middlename.' '.$type->lastname,
                    ];
                case 'customer_type':
                    return [
                        'value' => $type->code,
                        'value2' => null,
                        'en' => $type->description_en,
                        'cn' => $type->description_cn,
                    ];
                case 'tax_group':
                    return [
                        'value' => $type->tax_value,
                        'value2' => null,
                        'en' => $type->tax,
                        'cn' => $type->tax,
                    ];
                default:
                    return []; // In case of no match
            }
        });

        // Return the response
        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllDropdownDataList(){
        // Define your model mappings
        $modelMapping = [
            'courier' => Courier::class,
            'shipping_terms' => Shipping_terms::class,
            'warehouse' => Warehouse::class,
            'countries' => Countries::class,
            'states' => States::class,
            'sales_person' => Employee_Info::class,
            'customer_type' => Customer_type::class,
            'tax_group' => Tax_group::class
        ];

        // Define your column mappings for each table
        $columnMapping = [
            'courier' => ['id', 'courier_en', 'courier_cn'],
            'shipping_terms' => ['id', 'shipping_terms_en', 'shipping_terms_cn'],
            'warehouse' => ['id', 'wh_code', 'warehouse_en', 'warehouse_cn'],
            'countries' => ['id', 'country_en', 'country_cn'],
            'states' => ['id', 'statename_en', 'statename_cn'],
            'sales_person' => ['id', 'firstname', 'middlename', 'lastname'],
            'customer_type' => ['id', 'description_en', 'description_cn', 'code'],
            'tax_group' => ['id', 'tax_value', 'tax']
        ];

        $data = [];

        // Loop through each table and fetch data
        foreach ($modelMapping as $table => $modelClass) {
            // Get the columns to select dynamically from the column map
            $columns = $columnMapping[$table];

            // Fetch all records from the table
            $records = $modelClass::select($columns)
                ->where('is_deleted', 0) // Optional: if applicable
                ->get();

            // Map the records based on the switch structure you provided
            $mappedRecords = $records->map(function ($record) use ($table) {
                switch ($table) {
                    case 'courier':
                        return [
                            'value' => $record->id,
                            'value2' => null,
                            'en' => $record->courier_en,
                            'cn' => $record->courier_cn,
                        ];
                    case 'shipping_terms':
                        return [
                            'value' => $record->id,
                            'value2' => null,
                            'en' => $record->shipping_terms_en,
                            'cn' => $record->shipping_terms_cn,
                        ];
                    case 'warehouse':
                        return [
                            'value' => $record->wh_code,
                            'value2' => null,
                            'en' => $record->warehouse_en,
                            'cn' => $record->warehouse_cn,
                        ];
                    case 'countries':
                        return [
                            'value' => $record->id,
                            'value2' => null,
                            'en' => $record->country_en,
                            'cn' => $record->country_cn,
                        ];
                    case 'states':
                        return [
                            'value' => $record->id,
                            'value2' => null,
                            'en' => $record->statename_en,
                            'cn' => $record->statename_cn,
                        ];
                    case 'sales_person':
                        return [
                            'value' => $record->id,
                            'value2' => $record->id,
                            'en' => $record->firstname . ' ' . $record->middlename . ' ' . $record->lastname,
                            'cn' => $record->firstname . ' ' . $record->middlename . ' ' . $record->lastname,
                        ];
                    case 'customer_type':
                        return [
                            'value' => $record->code,
                            'value2' => null,
                            'en' => $record->description_en,
                            'cn' => $record->description_cn,
                        ];
                    case 'tax_group':
                        return [
                            'value' => $record->tax_value,
                            'value2' => null,
                            'en' => $record->tax,
                            'cn' => $record->tax,
                        ];
                    default:
                        return []; // In case of no match
                }
            });

            // Add the table name as the key and the mapped data as the value
            $data[$table] = $mappedRecords;
        }

        // Return the response
        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $data,
        ]);
    }
    public function getCurrentExRate(Request $request){
        $currency = $request->query('currency');
        $basecurrency = $request->query('basecurrency');
        $currentDate = now()->format('m/d/Y');

        if ($currency === $basecurrency || empty($currency)) {
            return response()->json(['ex_rate' => 1]);
        }

        $rate = DB::table('m_forex')
            ->where('from_currency', $basecurrency)
            ->where('to_currency', $currency)
            ->where('date_enter', $currentDate)
            ->value('ex_rate');

        return response()->json(['ex_rate' => $rate ?? 0]);
    }
    public function getLogs(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Logs::with('user')->orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('module', 'like', "%{$search}%")
                    ->orWhere('table', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            $created_at = Carbon::parse($list->created_at)->format('M d Y - h:i:s A');
            return [
                'id' => $list->id,
                'module' => $list->module,
                'table' => $list->table,
                'action' => $list->action,
                'description' => $list->description,
                'username' => $list->user->username,
                'added_by' => $list->added_by,
                'created_at' => $created_at,
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
    public function getBackups(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $page = (int) $request->input('page', 1);
        $search = $request->input('search', '');

        // 1️⃣ Get all files from the 'dbbackup' disk
        $allFiles = collect(Storage::disk('dbbackup')->files());

        // 2️⃣ Sort files by last modified timestamp descending
        $files = $allFiles->sortByDesc(function ($file) {
            return Storage::disk('dbbackup')->lastModified($file);
        })->values();

        // 3️⃣ Apply search filter if provided
        if (!empty($search)) {
            $files = $files->filter(function ($file) use ($search) {
                return str_contains(basename($file), $search);
            })->values();
        }

        // 4️⃣ Handle pagination manually
        if ($perPage === -1) {
            $paginated = $files;
            $lastPage = 1;
        } else {
            $paginated = $files->forPage($page, $perPage);
            $lastPage = (int) ceil($files->count() / $perPage);
        }

        // 5️⃣ Transform each file into structured output
        $data = $paginated->values()->map(function ($file, $index) {
            $size = Storage::disk('dbbackup')->size($file);
            return [
                'id'            => $index + 1, // Add a unique ID for each file
                'filename'      => basename($file),
                'size'          => $size,                       // bytes
                'size_human'    => $this->formatSize($size),   // human-readable
                'last_modified' => Carbon::createFromTimestamp(
                    Storage::disk('dbbackup')->lastModified($file)
                )
                ->setTimezone('Asia/Singapore') // Singapore timezone
                ->format('M d Y - h:i:s A'),
            ];
        });

        // 6️⃣ Build final paginated response
        $response = [
            'current_page' => $page,
            'data'         => $data,
            'last_page'    => $lastPage,
            'per_page'     => $perPage === -1 ? $data->count() : $perPage,
            'total'        => $files->count(),
        ];

        // 7️⃣ Return JSON
        return response()->json([
            'success' => true,
            'message' => 'success',
            'list'    => $response,
        ]);
    }
    private function formatSize($bytes){
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
    public function restoreDatabase(Request $request){
        $dbENV = env('APP_ENV');

        if($dbENV === 'local'){
            $database = $request->input('database');
            $username = $request->input('username');
            $password = $request->input('password');

            $user = Login::where('username', $username)->first();

            if (!$user || !Hash::check($password, $user->password)) {
                return response()->json([
                    'token'   => 'Error',
                    'message' => 'Invalid Username or Password',
                    'action'  => 'select'
                ]);
            }

            $dbName = env('DB_DATABASE');
            $dbUser = env('DB_USERNAME');
            $dbPass = env('DB_PASSWORD');
            $dbHost = env('DB_HOST');

            $sqlFile = base_path('dbBackup/' . $database);

            if (!file_exists($sqlFile)) {
                return response()->json([
                    'token'   => 'Error',
                    'message' => 'Backup file not found',
                    'action'  => 'select'
                ]);
            }

            $command = "mysql --skip-ssl -h {$dbHost} -u {$dbUser} -p{$dbPass} {$dbName} < {$sqlFile}";

            $process = Process::fromShellCommandline($command);
            $process->setTimeout(1000);

            try {
                $process->mustRun();
                return response()->json([
                    'token'   => 'Success',
                    'message' => 'Database Successfully Restored',
                    'action'  => 'reload'
                ]);
            } catch (ProcessFailedException $e) {
                return response()->json([
                    'token'   => 'Error',
                    'message' => 'Database restore failed: ' . $e->getMessage(),
                    'action'  => 'select'
                ]);
            }
        }
        else{
            $database = $request->input('database');
            $username = $request->input('username');
            $password = $request->input('password');

            $user = Login::where('username', $username)->first();

            if (!$user || !Hash::check($password, $user->password)) {
                return response()->json([
                    'token'   => 'Error',
                    'message' => 'Invalid Username or Password',
                    'action'  => 'select'
                ]);
            }

            // Security validations
            if (strpos($database, '..') !== false || strpos($database, '/') !== false || strpos($database, '\\') !== false) {
                return response()->json([
                    'token'   => 'Error',
                    'message' => 'Invalid backup file name',
                    'action'  => 'select'
                ]);
            }

            if (!str_ends_with($database, '.sql')) {
                return response()->json([
                    'token'   => 'Error',
                    'message' => 'Invalid file type. Only .sql files allowed',
                    'action'  => 'select'
                ]);
            }

            $dbName = env('DB_DATABASE');
            $dbUser = env('DB_USERNAME');
            $dbPass = env('DB_PASSWORD');
            $dbPort = env('DB_PORT', 3306);

            $sqlFile = base_path('dbBackup/' . $database);

            if (!file_exists($sqlFile)) {
                return response()->json([
                    'token'   => 'Error',
                    'message' => 'Backup file not found',
                    'action'  => 'select'
                ]);
            }

            $mysql = 'C:\\xampp\\mysql\\bin\\mysql.exe';
            
            // ✅ Use exec() instead of Symfony Process
            $command = sprintf(
                '"%s" -u%s -p%s -h127.0.0.1 -P%d %s < "%s" 2>&1',
                $mysql,
                $dbUser,
                $dbPass,
                $dbPort,
                $dbName,
                $sqlFile
            );

            exec($command, $output, $returnCode);

            if ($returnCode === 0) {
                return response()->json([
                    'token'   => 'Success',
                    'message' => 'Database Successfully Restored',
                    'action'  => 'reload'
                ]);
            }

            return response()->json([
                'token'   => 'Error',
                'message' => 'Database restore failed',
                'details' => implode("\n", $output),
                'exit_code' => $returnCode,
                'action'  => 'select'
            ], 500);
        }
    }
    public function backupDatabase() {
        $dbENV = env('APP_ENV');

        if($dbENV === 'local'){
            $dbHost = env('DB_HOST');
            $dbUser = env('DB_USERNAME');
            $dbPass = env('DB_PASSWORD');
            $dbName = env('DB_DATABASE');

            $backupFolder = env('DB_BACKUP_PATH', base_path('dbBackup'));
            if (!file_exists($backupFolder)) {
                mkdir($backupFolder, 0755, true); // Create backup folder if not exists
            }

            $filename = 'backup_' . date('Y_m_d_His') . '.sql';
            $backupFile = $backupFolder . DIRECTORY_SEPARATOR . $filename;

            $mysqldump = app()->environment('local') ? 'mysqldump' : 'C:\\xampp\\mysql\\bin\\mysqldump.exe';

            $command = [
                $mysqldump,
                '--quick',
                '--skip-ssl',
                '-h', $dbHost,
                '-u', $dbUser,
                '-p' . $dbPass,
                $dbName,
                '--result-file=' . $backupFile,
            ];
            // ✅ Use Process constructor instead of fromShellCommandline
            $process = new Process($command);

            // ✅ Increase timeout to, say, 5 minutes (300 seconds)
            $process->setTimeout(300); // 5 minutes

            try {
                $process->mustRun();

                return response()->json([
                    'token' => 'Success',
                    'APP_ENV' => env('APP_ENV'),
                    'message' => 'Backup created: ' . $filename,
                ]);
            } catch (ProcessFailedException $e) {
                return response()->json([
                    'token' => 'Error',
                    'message' => 'Backup failed: ' . $e->getMessage(),
                    'command' => $command,
                    'APP_ENV' => env('APP_ENV'),
                ]);
            }
        }
        else{
            $dbUser = env('DB_USERNAME');
            $dbPass = env('DB_PASSWORD');
            $dbName = env('DB_DATABASE');
            $dbPort = env('DB_PORT', 3306);

            $backupFolder = env('DB_BACKUP_PATH', base_path('dbBackup'));
            if (!file_exists($backupFolder)) {
                mkdir($backupFolder, 0755, true);
            }

            $filename = 'backup_' . date('Y_m_d_His') . '.sql';
            $backupFile = $backupFolder . DIRECTORY_SEPARATOR . $filename;

            $mysqldump = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';

            // ✅ Use shell command with output redirection
            $command = sprintf(
                '"%s" -u %s -p%s -h 127.0.0.1 -P %d --single-transaction --routines --triggers %s > "%s" 2>&1',
                $mysqldump,
                $dbUser,
                $dbPass,
                $dbPort,
                $dbName,
                $backupFile
            );

            exec($command, $output, $returnCode);

            if ($returnCode === 0 && file_exists($backupFile) && filesize($backupFile) > 0) {
                return response()->json([
                    'token' => 'Success',
                    'message' => 'Backup created: ' . $filename,
                    'size' => number_format(filesize($backupFile) / 1024, 2) . ' KB',
                ]);
            }

            return response()->json([
                'token' => 'Error',
                'message' => 'Backup failed',
                'details' => implode("\n", $output),
                'exit_code' => $returnCode,
            ], 500);
        }
    }
    public function deleteDatabase(Request $request){
        // Get the list of filenames from the request
        $filenames = $request->input('filenames');

        // Validate if the filenames are provided and are in an array format
        if (!is_array($filenames)) {
            return response()->json([
                'token' => 'Error',
                'message' => 'No filenames provided or invalid format'
            ]);
        }

        $deletedFiles = [];

        // Loop through each filename and try to delete it
        foreach ($filenames as $filename) {
            // Build the full file path (update the path based on your folder structure)
            $filePath = base_path('dbBackup/' . $filename);
            // base_path('dbBackup');

            // Check if the file exists before deleting
            if (File::exists($filePath)) {
                File::delete($filePath);  // Delete the file
                $deletedFiles[] = $filename;  // Track the deleted files
            } else {
                // If the file does not exist, add a message to the response
                $deletedFiles[] = "File not found: $filename";
            }
        }

        // Return the list of deleted files or files that could not be found
        return response()->json([
            'token' => 'Success',
            'message' => count($deletedFiles) . ' file(s) deleted.',
            'deleted_files' => $deletedFiles,
        ]);
    }
    public function getSerialNo(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Serial_no::orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('serial_no', 'like', "%{$search}%")
                ->orWhere('batch_no', 'like', "%{$search}%");
            });
        }
        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'serial_no' => $list->serial_no,
                'batch_no' => $list->batch_no,
                'no_of_time_verified' => $list->no_of_time_verified,
                'updated_at' => Carbon::parse($list->updated_at)->format('M d Y - h:i:s A'),
                'created_at' => Carbon::parse($list->created_at)->format('M d Y - h:i:s A'),
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
    public function downloadBackup(Request $request) {
        $filename = $request->input('filename');
        
        // Security validations
        if (strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false) {
            return response()->json([
                'token' => 'Error',
                'message' => 'Invalid filename'
            ], 400);
        }
        
        if (!str_ends_with($filename, '.sql')) {
            return response()->json([
                'token' => 'Error',
                'message' => 'Invalid file type'
            ], 400);
        }
        
        $backupFolder = env('DB_BACKUP_PATH', base_path('dbBackup'));
        $file = $backupFolder . DIRECTORY_SEPARATOR . $filename;
        
        if (!file_exists($file)) {
            return response()->json([
                'token' => 'Error',
                'message' => 'Backup file not found'
            ], 404);
        }
        
        return response()->download($file);
    }
    public function aiReportQuery(Request $request){
        $userQuery = $request->input('query');
        
        if (empty($userQuery)) {
            return response()->json([
                'token' => 'Error',
                'message' => 'Query is required'
            ], 400);
        }
        
        $schema = $this->getSchemaDescription();
        
        $systemPrompt = "You are a READ-ONLY SQL query generator for generating reports.

            {$schema}

            CRITICAL RULES:
            1. ONLY generate SELECT queries - NEVER DELETE, INSERT, UPDATE, DROP, ALTER, CREATE, TRUNCATE
            2. Always use JOINs when querying across related tables
            3. Use proper table aliases
            4. Parse dates intelligently
            5. Always add LIMIT clause (max 1000 rows)
            6. Return ONLY the SQL query, no markdown, no explanations";
        
        try {
            // ✅ Use Laravel HTTP client directly
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('OPENAI_API_KEY'),
                'Content-Type' => 'application/json',
            ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
                'model' => ' ',
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userQuery]
                ],
                'temperature' => 0,
                'max_tokens' => 500,
            ]);
            
            if (!$response->successful()) {
                throw new \Exception('OpenAI API failed: ' . $response->body());
            }
            
            $data = $response->json();
            $sqlQuery = $data['choices'][0]['message']['content'];
            
            $sqlQuery = $this->cleanSqlQuery($sqlQuery);
            $this->validateSqlQuery($sqlQuery);
            
            DB::beginTransaction();
            
            try {
                DB::statement('SET SESSION TRANSACTION READ ONLY');
                $results = DB::select($sqlQuery);
                DB::rollBack();
                
                return response()->json([
                    'token' => 'Success',
                    'query' => $sqlQuery,
                    'data' => $results,
                    'count' => count($results)
                ]);
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            
        } catch (\Exception $e) {
            return response()->json([
                'token' => 'Error',
                'message' => 'Query execution failed: ' . $e->getMessage()
            ], 500);
        }
    }
    private function cleanSqlQuery(string $sql): string{
        $sql = preg_replace('/```sql\s*/i', '', $sql);
        $sql = preg_replace('/```\s*/', '', $sql);
        $sql = trim($sql);
        $sql = rtrim($sql, ';');
        return $sql;
    }
    private function validateSqlQuery(string $sql): void{
        $sqlUpper = strtoupper($sql);
        
        if (!preg_match('/^\s*SELECT/i', $sql)) {
            throw new \Exception('❌ Only SELECT queries are allowed');
        }
        
        $forbiddenKeywords = [
            'INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 
            'ALTER', 'CREATE', 'REPLACE', 'RENAME', 'GRANT', 
            'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 'LOAD_FILE',
            'INTO OUTFILE', 'INTO DUMPFILE', 'LOAD DATA'
        ];
        
        foreach ($forbiddenKeywords as $keyword) {
            if (strpos($sqlUpper, $keyword) !== false) {
                throw new \Exception("❌ Forbidden keyword: {$keyword}");
            }
        }
        
        if (substr_count($sql, ';') > 0) {
            throw new \Exception('❌ Multiple statements not allowed');
        }
        
        if (!preg_match('/LIMIT\s+\d+/i', $sql)) {
            throw new \Exception('❌ LIMIT required (max 1000)');
        }
        
        if (preg_match('/LIMIT\s+(\d+)/i', $sql, $matches)) {
            $limit = (int)$matches[1];
            if ($limit > 1000) {
                throw new \Exception('❌ LIMIT cannot exceed 1000');
            }
        }
    }
    private function getSchemaDescription(): string{
        // 1. Get all tables in the current database
        $database = env('DB_DATABASE');

        $tables = DB::select("
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = ?
        ", [$database]);

        $schemaText = "DATABASE SCHEMA:\n\n";

        // 2. Loop through each table and get its columns
        foreach ($tables as $table) {
            $tableName = $table->TABLE_NAME;

            $columns = DB::select("
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = ?
                AND TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
            ", [$database, $tableName]);

            $columnNames = array_map(fn($c) => $c->COLUMN_NAME, $columns);
            $columnList = implode(', ', $columnNames);

            $schemaText .= "Table: {$tableName}\n";
            $schemaText .= "Columns: {$columnList}\n\n";
        }

        // 3. Detect foreign keys (relationships)
        $fks = DB::select("
            SELECT
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
            AND REFERENCED_TABLE_NAME IS NOT NULL
        ", [$database]);

        if (!empty($fks)) {
            $schemaText .= "RELATIONSHIPS:\n";
            foreach ($fks as $fk) {
                $schemaText .= "- {$fk->TABLE_NAME}.{$fk->COLUMN_NAME} → {$fk->REFERENCED_TABLE_NAME}.{$fk->REFERENCED_COLUMN_NAME}\n";
            }
        }
        return $schemaText;
    }
}
