<?php

namespace App\Http\Controllers;
use App\Models\Charts_of_account;
use App\Models\General_ledger;
use App\Models\Account_invoice;
use App\Models\Account_payment_voucher;
use App\Models\Account_receive_voucher;
use App\Models\Accounts_receivable;
use App\Models\Receive_voucher_master;
use App\Models\Payment_voucher_master;
use App\Models\Accounting_settings;
use App\Models\Account_customer_cn;
use App\Models\Account_supplier_invoice;
use App\Models\Credit_note_customer_detail;
use App\Models\Payment_voucher_detail;
use App\Models\Receive_voucher_detail;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class ChartsOfAccountController extends Controller{

    public function getChartsOfAccountList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Query only top-level (Level 1)
        $query = Charts_of_account::where('root_name', 0)->orderBy('account_code', 'asc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('account_code', 'like', "%{$search}%")
                ->orWhere('account_name_en', 'like', "%{$search}%")
                ->orWhere('account_name_cn', 'like', "%{$search}%");
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Recursive transform function to get children (up to 4 levels)
        $transform = function ($item, $depth = 1) use (&$transform) {
            if ($depth > 4) {
                return null;
            }

            // Get children of this item (next level)
            $children = Charts_of_account::where('root_name', $item->account_code)
                ->orderBy('account_code', 'asc')
                ->get();

            $transformedChildren = $children->map(function ($child) use ($transform, $depth) {
                return $transform($child, $depth + 1);
            });

            return [
                'id' => $item->id,
                'root_name' => $item->root_name,
                'account_code' => $item->account_code,
                'account_name_en' => $item->account_name_en,
                'account_name_cn' => $item->account_name_cn,
                'description_en' => $item->description_en,
                'description_cn' => $item->description_cn,
                'account_type_en' => $item->account_type_en,
                'account_type_cn' => $item->account_type_cn,
                'children_count' => $transformedChildren->count(),
                'details' => $transformedChildren,
            ];
        };

        // Apply the transformation
        if ($perPage === -1) {
            $data = $result->map(function ($item) use ($transform) {
                return $transform($item);
            });
            $response = [
                'current_page' => 1,
                'data' => $data,
                'last_page' => 1,
                'per_page' => $data->count(),
                'total' => $data->count(),
            ];
        } else {
            $data = $result->getCollection()->map(function ($item) use ($transform) {
                return $transform($item);
            });
            $result->setCollection($data);
            $response = $result;
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $response,
        ]);
    }
    public function getCountExistAccount($account_code){
        return Charts_of_account::where('account_code', $account_code)->count();
    }
    public function updateChartsOfAccount(Request $request){
        $OrigID = $request->id;
        $Action = ($OrigID === 0 ? 'insert' : 'update');

        $countAccounts = $this->getCountExistAccount($request->account_code);
        if((int) $request->id === 0 && $countAccounts > 0){
            return response()->json([
                'token'     => 'Warning',
                'message'   => 'Account Code is already exists',
                'action'    => $Action
            ]);
        }

        DB::beginTransaction();

        try {

            if ((int) $OrigID === 0) {
                $inserMaster = [
                    'root_name' => $request->root_name,
                    'account_code'  => $request->account_code,
                    'account_name_en' => $request->account_name_en,
                    'account_name_cn' => $request->account_name_cn,
                    'account_type_en' => $request->account_type_en,
                    'account_type_cn' => $request->account_type_cn,
                    'description_en' => $request->description_en,
                    'description_cn' => $request->description_cn,
                ];
                $master = Charts_of_account::create($inserMaster);
                $OrigID = $master->id;
            }
            else{
                $master = Charts_of_account::find($request['id']);
                if ($master) {
                    $old_account_code = $master->account_code;
                    $master->root_name = $request->root_name;
                    $master->account_code = $request->account_code;
                    $master->account_name_en = $request->account_name_en;
                    $master->account_name_cn = $request->account_name_cn;
                    $master->account_type_en = $request->account_type_en;
                    $master->account_type_cn = $request->account_type_cn;
                    $master->description_en = $request->description_en;
                    $master->description_cn = $request->description_cn;
                    $master->save();
                    if($old_account_code <> $request->account_code){
                        $this->updateAccountCodes($request->account_code,$old_account_code);
                    }
                }
            }

            $globalController = new GlobalController();
            $globalController->logAction(
                'Charts of Account', 'm_charts_of_account',
                $Action,
                'Account Code : ' . $request->account_code
            );

            DB::commit(); // 👍 Success
            return response()->json([
                'token'     => 'Success',
                'message'   => 'Chart Of Account Successfully Saved',
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
    public function delChartsOfAccount(Request $request){
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No COA IDs provided']);
        }

        // Start the transaction
        DB::beginTransaction();

        try {
            foreach ($ids as $id) {
                $master = Charts_of_account::find($id);

                // If GRN is not found, continue with the next ID
                if (!$master) continue;

                // Log the deletion action
                $globalController = new GlobalController();
                $globalController->logAction(
                    'Charts of Account', 'm_charts_of_account',
                    'delete',
                    'Account Code : ' . $request->account_code
                );

                // Delete the GRN
                $master->delete();
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
    public function updateAccountCodes(string $newCode, string $oldCode){
        General_ledger::where('account_code', $oldCode)->update(['account_code' => $newCode]);
        Account_invoice::where('account_code', $oldCode)->update(['account_code' => $newCode]);
        Account_payment_voucher::where('account_code', $oldCode)->update(['account_code' => $newCode]);
        Account_receive_voucher::where('account_code', $oldCode)->update(['account_code' => $newCode]);
        Accounts_receivable::where('account_code', $oldCode)->update(['account_code' => $newCode]);
        Receive_voucher_master::where('bank', $oldCode)->update(['bank' => $newCode]);
        Payment_voucher_master::where('bank', $oldCode)->update(['bank' => $newCode]);
        Accounting_settings::where('account_code', $oldCode)->update(['account_code' => $newCode]);
        Account_customer_cn::where('account_code', $oldCode)->update(['account_code' => $newCode]);
        Account_supplier_invoice::where('account_code', $oldCode)->update(['account_code' => $newCode]);
        Credit_note_customer_detail::where('account_code', $oldCode)->update(['account_code' => $newCode]);
        Payment_voucher_detail::where('account_code', $oldCode)->update(['account_code' => $newCode]);
        Receive_voucher_detail::where('account_code', $oldCode)->update(['account_code' => $newCode]);
    }
}
