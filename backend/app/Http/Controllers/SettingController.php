<?php

namespace App\Http\Controllers;

use App\Models\Loc_language;
use App\Models\Courier;
use App\Models\Shipping_stat;
use App\Models\Tax_group;
use App\Models\Payment_terms;
use App\Models\Warehouse;
use App\Models\Shipping_terms;
use App\Models\Source;
use App\Models\Store_location;
use App\Models\Currencies;
use App\Models\ISSettings;
use App\Models\Emp_Department;
use App\Models\Login;
use App\Models\Employee_Info;
use App\Models\Menu_data;
use App\Models\Access_rights;

use App\Events\AccessRightEvent;

use Hash;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class SettingController extends Controller{

    public function getLanguages(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Loc_language::orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('loc_tag', 'like', "%{$search}%")
                    ->orWhere('en', 'like', "%{$search}%")
                    ->orWhere('cn', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'loc_tag' => $list->loc_tag,
                'en' => $list->en,
                'cn' => $list->cn,
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
    public function getCouriers(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Courier::orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('courier_en', 'like', "%{$search}%")
                    ->orWhere('courier_cn', 'like', "%{$search}%")
                    ->orWhere('alias', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'courier_en' => $list->courier_en,
                'courier_cn' => $list->courier_cn,
                'alias' => $list->alias ?? "",
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
    public function getShippingStatus(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Shipping_stat::with(['warehouseList','countryList'])->orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('shipping_stat_en', 'like', "%{$search}%")
                    ->orWhere('shipping_stat_cn', 'like', "%{$search}%")
                    ->orWhere('warehouse', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {

            $wh = $list->warehouseList;
            $country = $list->countryList;

            $warehouse_en  = $wh->warehouse_en ?? "";
            $warehouse_cn  = $wh->warehouse_cn ?? "";

            $country_en  = $country->country_en ?? "";
            $country_cn  = $country->country_cn ?? "";

            return [
                'id' => $list->id,
                'shipping_stat_en' => $list->shipping_stat_en,
                'shipping_stat_cn' => $list->shipping_stat_cn,
                'warehouse_code' => $list->warehouse ?? "",
                'country_code' => $list->country_code ?? "",
                'warehouse_en' => $warehouse_en,
                'warehouse_cn' => $warehouse_cn,
                'country_en' => $country_en,
                'country_cn' => $country_cn,
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
    public function getTaxGroup(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Tax_group::orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('tax_value', 'like', "%{$search}%")
                    ->orWhere('tax', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'tax_value' => $list->tax_value,
                'tax' => $list->tax,
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
    public function getPaymentTerms(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Payment_terms::orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('alias', 'like', "%{$search}%")
                    ->orWhere('payment_terms_en', 'like', "%{$search}%")
                    ->orWhere('payment_terms_cn', 'like', "%{$search}%")
                    ->orWhere('terms', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'payment_terms_en' => $list->payment_terms_en,
                'payment_terms_cn' => $list->payment_terms_cn,
                'terms' => $list->terms,
                'alias' => $list->alias,
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
    public function getWarehouseList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Warehouse::with(['countryList'])->orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('wh_code', 'like', "%{$search}%")
                    ->orWhere('warehouse_en', 'like', "%{$search}%")
                    ->orWhere('warehouse_cn', 'like', "%{$search}%")
                    ->orWhere('country_code', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {

            $country = $list->countryList;
            $country_en  = $country->country_en ?? "";
            $country_cn  = $country->country_cn ?? "";

            return [
                'id' => $list->id,
                'warehouse_code' => $list->wh_code,
                'warehouse_en' => $list->warehouse_en,
                'warehouse_cn' => $list->warehouse_cn,
                'country_code' => $list->country_code,
                'is_deleted' => $list->is_deleted,
                'country_en' => $country_en,
                'country_cn' => $country_cn,
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
    public function getShippingTerms(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Shipping_terms::orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('shipping_terms_en', 'like', "%{$search}%")
                    ->orWhere('shipping_terms_cn', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'shipping_terms_en' => $list->shipping_terms_en,
                'shipping_terms_cn' => $list->shipping_terms_cn,
                'is_deleted' => $list->is_deleted,
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
    public function getSourceList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Source::orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('description_en', 'like', "%{$search}%")
                    ->orWhere('description_cn', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'description_en' => $list->description_en,
                'description_cn' => $list->description_cn,
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
    public function getStoreLocationList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Store_location::orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('store_name_en', 'like', "%{$search}%")
                    ->orWhere('address_en', 'like', "%{$search}%")
                    ->orWhere('address_cn', 'like', "%{$search}%")
                    ->orWhere('store_name_en', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'store_name_en' => $list->store_name_en,
                'store_name_cn' => $list->store_name_cn,
                'address_en' => $list->address_en,
                'address_cn' => $list->address_cn,
                'set_as_default' => $list->set_as_default,
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
    public function getCurrenyList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Currencies::orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('currency_title', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'code' => $list->code,
                'currency_title' => $list->currency_title,
                'set_as_default' => $list->set_as_default,
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
    public function getISSettings(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = ISSettings::orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('tag', 'like', "%{$search}%")
                    ->orWhere('en', 'like', "%{$search}%")
                    ->orWhere('cn', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'tag' => $list->tag,
                'en' => $list->en,
                'cn' => $list->cn,
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
    public function getEmpDepartment(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Emp_Department::orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('alias', 'like', "%{$search}%")
                    ->orWhere('description_en', 'like', "%{$search}%")
                    ->orWhere('description_cn', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            return [
                'id' => $list->id,
                'alias' => $list->alias,
                'description_en' => $list->description_en,
                'description_cn' => $list->description_cn,
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
    public function getLoginList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        $query = Login::with(['employeeInfo', 'accessRights'])
            ->orderBy('id', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                ->orWhere('user_language', 'like', "%{$search}%");
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        $transform = function ($login) {
            $employee = optional($login->employeeInfo);
            $accessRights = $login->accessRights->map(function ($access) {
                return [
                    'id' => $access->id,
                    'menu_id' => $access->menu_id,
                ];
            });
            return [
                'id' => $login->id,
                'username' => $login->username,
                'password' => $login->password,
                'mobile_password' => $login->mobile_password,
                'user_language' => $login->user_language,
                'employee_id' => $login->employee_id,
                'employee_no' => $employee->employee_no,
                'fullname' => trim("{$employee->firstname} {$employee->middlename} {$employee->lastname}"),
                'updated_at' => optional($login->updated_at)->format('M d Y - h:i:s A'),
                'created_at' => optional($login->created_at)->format('M d Y - h:i:s A'),
                'accessRights' => $accessRights,
            ];
        };

        // Format response
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
            'message' => 'Success',
            'list' => $response,
        ]);
    }
    public function getAllEmployeeList() {
        $types = Employee_Info::select('id', 'employee_no', 'firstname','middlename', 'lastname')->get();
        $mappedTypes = $types->map(function ($type) {
            return [
                'value' => $type->id,
                'value2' => $type->employee_no,
                'en' => trim("{$type->firstname} {$type->middlename} {$type->lastname}"),
                'cn' => trim("{$type->firstname} {$type->middlename} {$type->lastname}"),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $mappedTypes,
        ]);
    }
    public function getAllMenuData(Request $request){
        // Get top-level root items
        $roots = Menu_data::where('root_name', 'root')
            ->orderBy('id', 'asc')
            ->get();

        // Recursive transform function (up to 4 levels deep)
        $transform = function ($item, $depth = 1) use (&$transform) {
            if ($depth > 4) {
                return null;
            }

            // Get child items of this menu item
            $children = Menu_data::where('root_name', $item->id)
                ->orderBy('id', 'asc')
                ->get();

            // Recursively transform children
            $transformedChildren = $children->map(function ($child) use ($transform, $depth) {
                return $transform($child, $depth + 1);
            })->filter(); // remove nulls (in case of depth limit)

            return [
                'id' => $item->id,
                'root_name' => $item->root_name,
                'label_en' => $item->label_en,
                'label_cn' => $item->label_cn,
                'children_count' => $transformedChildren->count(),
                'details' => $transformedChildren->values(), // reset keys
            ];
        };

        // Transform all root items
        $menuList = $roots->map(function ($item) use ($transform) {
            return $transform($item);
        });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $menuList,
        ]);
    }
    public function delSettings(Request $request,$module){
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No IDs provided']);
        }

        // Start the transaction
        DB::beginTransaction();

        try {
            foreach ($ids as $id) {

                switch($module){
                    case 'language':
                        $master = Loc_language::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'courier':
                        $master = Courier::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'shipping-stat':
                        $master = Shipping_stat::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'warehouse':
                        $master = Warehouse::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'tax-group':
                        $master = Tax_group::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'payment-terms':
                        $master = Payment_terms::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'source':
                        $master = Source::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'store-location':
                        $master = Store_location::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'currency':
                        $master = Currencies::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'issettings':
                        $master = ISSettings::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'department':
                        $master = Emp_Department::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                    case 'login':
                        $master = Login::find($id);
                        if($master){
                            $master->delete();
                        }
                    break;
                }
            }
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
    public function updateSettings(Request $request,$module){
        $OrigID = $request->id;
        $Action = ($OrigID === 0 ? 'insert' : 'update');

        DB::beginTransaction();

        try {

            if ((int) $OrigID === 0) {

                switch($module){
                    case 'language':
                        $inserMaster = [
                            'loc_tag' => $request->loc_tag,
                            'en' => $request->en,
                            'cn' => $request->cn,
                        ];
                        Loc_language::create($inserMaster);
                    break;
                    case 'courier':
                        $courier_en = $request->courier_en;
                        $courier_cn = $request->courier_cn;
                        $courier_cn = ($courier_cn === null ? $courier_en : $courier_cn);
                        $inserMaster = [
                            'courier_en' => $courier_en,
                            'courier_cn' => $courier_cn,
                            'alias' => $request->alias,
                            'is_deleted' => 0
                        ];
                        Courier::create($inserMaster);
                    break;
                    case 'shipping-stat':
                        $shipping_stat_en = $request->shipping_stat_en;
                        $shipping_stat_cn = $request->shipping_stat_cn;
                        $shipping_stat_cn = ($shipping_stat_cn === null ? $shipping_stat_en : $shipping_stat_cn);
                        $inserMaster = [
                            'shipping_stat_en' => $shipping_stat_en,
                            'shipping_stat_cn' => $shipping_stat_cn,
                            'country_code' => $request->country_code,
                            'warehouse' => $request->warehouse,
                        ];
                        Shipping_stat::create($inserMaster);
                    break;
                    case 'warehouse':
                        $warehouse_en = $request->warehouse_en;
                        $warehouse_cn = $request->warehouse_cn;
                        $warehouse_cn = ($warehouse_cn === null ? $warehouse_en : $warehouse_cn);
                        $inserMaster = [
                            'warehouse_en' => $warehouse_en,
                            'warehouse_cn' => $warehouse_cn,
                            'country_code' => $request->country_code,
                            'wh_code' => $request->warehouse_code,
                        ];
                        Warehouse::create($inserMaster);
                    break;
                    case 'tax-group':
                        $inserMaster = [
                            'tax_value' => $request->tax_value,
                            'tax' => $request->tax,
                        ];
                        Tax_group::create($inserMaster);
                    break;
                    case 'payment-terms':
                        $payment_terms_en = $request->payment_terms_en;
                        $payment_terms_cn = $request->payment_terms_cn;
                        $payment_terms_cn = ($payment_terms_cn === null ? $payment_terms_en : $payment_terms_cn);
                        $inserMaster = [
                            'alias' => $request->alias,
                            'terms' => $request->terms,
                            'payment_terms_en' => $payment_terms_en,
                            'payment_terms_cn' => $payment_terms_cn,
                        ];
                        Payment_terms::create($inserMaster);
                    break;
                    case 'source':
                        $description_en = $request->description_en;
                        $description_cn = $request->description_cn;
                        $description_cn = ($description_cn === null ? $description_en : $description_cn);
                        $inserMaster = [
                            'description_en' => $description_en,
                            'description_cn' => $description_cn,
                        ];
                        Source::create($inserMaster);
                    break;
                    case 'store-location':
                        $store_name_en = $request->store_name_en;
                        $store_name_cn = $request->store_name_cn;
                        $store_name_cn = ($store_name_cn === null ? $store_name_en : $store_name_cn);

                        $address_en = $request->address_en;
                        $address_cn = $request->address_cn;
                        $address_cn = ($address_cn === null ? $address_en : $address_cn);

                        $inserMaster = [
                            'store_name_en' => $store_name_en,
                            'store_name_cn' => $store_name_cn,
                            'address_en' => $address_en,
                            'address_cn' => $address_cn,
                            'set_as_default' => 0
                        ];
                        Store_location::create($inserMaster);
                    break;
                    case 'currency':
                        $inserMaster = [
                            'code' => $request->code,
                            'currency_title' => $request->currency_title,
                        ];
                        Currencies::create($inserMaster);
                    break;
                    case 'issettings':
                        $inserMaster = [
                            'tag' => $request->tag,
                            'en' => $request->en,
                            'cn' => $request->cn,
                        ];
                        ISSettings::create($inserMaster);
                    break;
                    case 'department':
                        $description_en = $request->description_en;
                        $description_cn = $request->description_cn;
                        $description_cn = ($description_cn === null ? $description_en : $description_cn);
                        $inserMaster = [
                            'alias' => $request->alias,
                            'description_en' => $description_en,
                            'description_cn' => $description_cn,
                        ];
                        Emp_Department::create($inserMaster);
                    break;
                }
            }
            else{
                switch($module){
                    case 'language':
                        $master = Loc_language::find($request['id']);
                        if ($master) {
                            $master->loc_tag = $request->loc_tag;
                            $master->en = $request->en;
                            $master->cn = $request->cn;
                            $master->save();
                        }
                    break;
                    case 'courier':
                        $master = Courier::find($request['id']);
                        if ($master) {
                            $master->courier_en = $request->courier_en;
                            $master->courier_cn = $request->courier_cn;
                            $master->alias = $request->alias;
                            $master->save();
                        }
                    break;
                    case 'shipping-stat':
                        $master = Shipping_stat::find($request['id']);
                        if ($master) {
                            $master->shipping_stat_en = $request->shipping_stat_en;
                            $master->shipping_stat_cn = $request->shipping_stat_cn;
                            $master->country_code = $request->country_code;
                            $master->warehouse = $request->warehouse;
                            $master->save();
                        }
                    break;
                    case 'warehouse':
                        $master = Warehouse::find($request['id']);
                        if ($master) {
                            $master->warehouse_en = $request->warehouse_en;
                            $master->warehouse_cn = $request->warehouse_cn;
                            $master->country_code = $request->country_code;
                            $master->wh_code = $request->warehouse_code;
                            $master->save();
                        }
                    break;
                    case 'tax-group':
                        $master = Tax_group::find($request['id']);
                        if ($master) {
                            $master->tax = $request->tax;
                            $master->tax_value = $request->tax_value;
                            $master->save();
                        }
                    break;
                    case 'payment-terms':
                        $master = Payment_terms::find($request['id']);
                        if ($master) {
                            $master->alias = $request->alias;
                            $master->terms = $request->terms;
                            $master->payment_terms_en = $request->payment_terms_en;
                            $master->payment_terms_cn = $request->payment_terms_cn;
                            $master->save();
                        }
                    break;
                    case 'source':
                        $master = Source::find($request['id']);
                        if ($master) {
                            $master->description_en = $request->description_en;
                            $master->description_cn = $request->description_cn;
                            $master->save();
                        }
                    break;
                    case 'store-location':
                        $master = Store_location::find($request['id']);
                        if ($master) {

                            $store_name_en = $request->store_name_en;
                            $store_name_cn = $request->store_name_cn;
                            $store_name_cn = ($store_name_cn === null ? $store_name_en : $store_name_cn);

                            $address_en = $request->address_en;
                            $address_cn = $request->address_cn;
                            $address_cn = ($address_cn === null ? $address_en : $address_cn);

                            $master->store_name_en = $store_name_en;
                            $master->store_name_cn = $store_name_cn;
                            $master->address_en = $address_en;
                            $master->address_cn = $address_cn;
                            $master->save();
                        }
                    break;
                    case 'currency':
                        $master = Currencies::find($request['id']);
                        if ($master) {
                            $master->code = $request->code;
                            $master->currency_title = $request->currency_title;
                            $master->save();
                        }
                    break;
                    case 'issettings':
                        $master = ISSettings::find($request['id']);
                        if ($master) {
                            $master->tag = $request->tag;
                            $master->en = $request->en;
                            $master->cn = $request->cn;
                            $master->save();
                        }
                    break;
                    case 'department':
                        $master = Emp_Department::find($request['id']);
                        if ($master) {
                            $master->alias = $request->alias;
                            $master->description_en = $request->description_en;
                            $master->description_cn = $request->description_cn;
                            $master->save();
                        }
                    break;
                }
            }

            DB::commit(); // 👍 Success
            
            return response()->json([
                'token'     => 'Success',
                'message'   => 'Record Successfully Saved',
                'action'    => $Action
            ]);
        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'token'     => 'Error',
                'message'   => $e->getMessage(),
                'action'    => $Action
            ]);
        }
    }
    public function setAsDefaultSettings($tableId, $module){

        DB::beginTransaction();

        try {
            $Action = 'update'; // Define $Action variable

            switch($module){
                case 'store-location':
                    Store_location::query()->update(['set_as_default' => 0]);
                    $master = Store_location::find($tableId);
                    if ($master) {
                        $master->set_as_default = 1;
                        $master->save();
                    } else {
                        // Handle case when record is not found
                        throw new \Exception('Record not found');
                    }
                break;
                case 'currency':
                    Currencies::query()->update(['set_as_default' => 0]);
                    $master = Currencies::find($tableId);
                    if ($master) {
                        $master->set_as_default = 1;
                        $master->save();
                    } else {
                        // Handle case when record is not found
                        throw new \Exception('Record not found');
                    }
                break;
            }
            
            DB::commit(); // 👍 Success
            return response()->json([
                'token'     => 'Success',
                'message'   => 'Record Successfully Saved',
                'action'    => $Action
            ]);

        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'token'     => 'Error',
                'message'   => $e->getMessage(),
                'action'    => $Action ?? 'update' // Fallback if $Action is not defined
            ]);
        }
    }
    public function updateAccessRights(Request $request){
        $OrigID = $request->id;
        $Action = ($OrigID === 0 ? 'insert' : 'update');

        DB::beginTransaction();

        try {
            $loginId = null;

            if ((int) $OrigID === 0) {
                $count = Login::where('username',$request->username)->count();
                if($count > 0){
                    return response()->json([
                        'token'     => 'Warning',
                        'message'   => 'Employee already exists',
                        'action'    => $Action
                    ]);
                }
            }

            if ((int) $OrigID === 0) {
                $insertMaster = [
                    'username' => $request->username,
                    'password' => Hash::make($request->password),
                    'mobile_password' => Hash::make($request->mobile_password),
                    'user_language' => $request->user_language,
                    'employee_id' => $request->employee_id,
                ];
                $login = Login::create($insertMaster);
                $loginId = $login->id;
            }
            else {
                $master = Login::find($request['id']);
                if ($master) {
                    $master->username = $request->username;
                    $master->user_language = $request->user_language;
                    $master->employee_id = $request->employee_id;
                    // Update password if provided and length > 3
                    if (!empty($request->password) && strlen($request->password) > 3) {
                        $master->password = Hash::make($request->password);
                    }
                    // Update mobile_password if provided and length > 3
                    if (!empty($request->mobile_password) && strlen($request->mobile_password) > 3) {
                        $master->mobile_password = Hash::make($request->mobile_password);
                    }
                    $master->save();
                    $loginId = $master->id;
                }
            }

            // Handle access rights
            if ($loginId) {
                $newMenuIds = $request->ids ?? [];
                
                // Get existing menu_ids for this login_id
                $existingAccessRights = Access_rights::where('login_id', $loginId)->get();
                $existingMenuIds = $existingAccessRights->pluck('menu_id')->toArray();
                
                // Find menu_ids to insert (in new but not in existing)
                $menuIdsToInsert = array_diff($newMenuIds, $existingMenuIds);
                
                // Find menu_ids to delete (in existing but not in new)
                $menuIdsToDelete = array_diff($existingMenuIds, $newMenuIds);
                
                // Insert new access rights
                foreach ($menuIdsToInsert as $menuId) {
                    Access_rights::create([
                        'login_id' => $loginId,
                        'menu_id' => $menuId,
                    ]);
                }
                
                // Delete removed access rights
                if (!empty($menuIdsToDelete)) {
                    Access_rights::where('login_id', $loginId)
                        ->whereIn('menu_id', $menuIdsToDelete)
                        ->delete();
                }
            }

            event(new AccessRightEvent( 'save'));

            DB::commit(); // 👍 Success
            
            return response()->json([
                'token'     => 'Success',
                'message'   => 'Record Successfully Saved',
                'action'    => $Action
            ]);
        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'token'     => 'Error',
                'message'   => $e->getMessage(),
                'action'    => $Action
            ]);
        }
    }
}
