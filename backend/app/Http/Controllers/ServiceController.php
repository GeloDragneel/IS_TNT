<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;
use App\Models\Product_services;

use Illuminate\Http\Request;

class ServiceController extends Controller{
    
    public function getServiceList(Request $request){

        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Product_services::orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('service_code', 'like', "%{$search}%")
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
                'service_code' => $list->service_code,
                'old_service_code' => $list->old_service_code,
                'description_en' => $list->description_en,
                'description_cn' => $list->description_cn,
                'is_deleted' => $list->is_deleted,
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
    public function delServices(Request $request){
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No Service IDs provided']);
        }

        // Start the transaction
        DB::beginTransaction();

        try {
            foreach ($ids as $id) {
                $services = Product_services::find($id);

                // If GRN is not found, continue with the next ID
                if (!$services) continue;

                // Log the deletion action
                $globalController = new GlobalController();
                $globalController->logAction(
                    'Services', 'm_product_services',
                    'delete',
                    'Service Code : ' . $services->service_code
                );

                // Delete the GRN
                $services->delete();
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
    public function updateServices(Request $request){
        $OrigID = $request->id;
        $Action = ($OrigID === 0 ? 'insert' : 'update');

        $countService = $this->getCountExistService($request->service_code);
        if((int) $request->id === 0 && $countService > 0){
            return response()->json([
                'token'     => 'Warning',
                'message'   => 'Service Code already exists',
                'action'    => $Action
            ]);
        }

        DB::beginTransaction();

        try {

            if ((int) $OrigID === 0) {
                $inserMaster = [
                    'service_code'      => $request->service_code,
                    'old_service_code'  => $request->service_code,
                    'description_en'    => $request->description_en,
                    'description_cn'    => $request->description_cn,
                    'is_deleted'        => 0
                ];
                $master = Product_services::create($inserMaster);
                $OrigID = $master->id;
            }
            else{
                $master = Product_services::find($request['id']);
                if ($master) {
                    $master->service_code = $request->service_code;
                    $master->old_service_code = $request->service_code;
                    $master->description_en = $request->description_en;
                    $master->description_cn = $request->description_cn;
                    $master->is_deleted = 0;
                    $master->save();
                }
            }

            $globalController = new GlobalController();
            $globalController->logAction(
                'Services', 'm_product_services',
                $Action,
                'Service Code : ' . $request->service_code
            );

            DB::commit(); // 👍 Success
            return response()->json([
                'token'     => 'Success',
                'message'   => 'Product Service Successfully Saved',
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
    public function getCountExistService($service_code){
        return Product_services::where('service_code', $service_code)->count();
    }
}
