<?php

namespace App\Observers;
use Illuminate\Support\Facades\DB;
use App\Models\Credits;
use App\Models\Customer_credit;
use App\Models\Account_customer_cn;

class AccountCustomerCnObserver
{
    /**
     * Handle the Account_customer_cn "created" event.
    */
    public function created(Account_customer_cn $accCustomerCn): void{
        $this->saveCustomerCredit($accCustomerCn);
    }

    /**
     * Handle the Account_customer_cn "updated" event.
    */
    public function updated(Account_customer_cn $accCustomerCn): void{
        $this->saveCustomerCredit($accCustomerCn);
    }

    /**
     * Handle the Account_customer_cn "deleted" event.
    */
    public function deleted(Account_customer_cn $accCustomerCn): void{
        $this->saveCustomerCredit($accCustomerCn);
    }

    /**
     * Handle the Account_customer_cn "restored" event.
    */
    public function restored(Account_customer_cn $accCustomerCn): void{
        //
    }

    /**
     * Handle the Account_customer_cn "force deleted" event.
    */
    public function forceDeleted(Account_customer_cn $accCustomerCn): void{
        //
    }
    public function saveCustomerCredit(Account_customer_cn $accCustomerCn){
        $customer_id = $accCustomerCn->customer_id;

        // Step 1: Delete existing records for the customer
        Credits::where('customer_id', $customer_id)->delete();
        
        // Step 2: Check if the Customer is 'WH-CN-RN' for special case
        if ($customer_id !== 5) {
            // Step 3: Non-'WH-CN-RN' case - using Eloquent's aggregation
            $credits = Customer_credit::where('customer_id', $customer_id)
                ->select('customer_id', 'currency', DB::raw('COALESCE(SUM(credit - debit), 0) as current_credit'))
                ->groupBy('customer_id', 'currency')
                ->get();

            foreach ($credits as $credit) {
                Credits::create([
                    'customer_id' => $credit->customer_id,
                    'currency' => $credit->currency,
                    'current_credit' => $credit->current_credit
                ]);
            }
        } else {
            // Step 4: 'WH-CN-RN' case - using Eloquent relationships
            $credits = Customer_credit::where('customer_id', $accCustomerCn->customer_id)
                ->join('m_customer as zz', 'zz.id', '=', 't_customer_credit.customer_id')
                ->select('t_customer_credit.customer_id', 't_customer_credit.currency', DB::raw('SUM(CASE WHEN t_customer_credit.currency = zz.currency THEN t_customer_credit.credit - t_customer_credit.debit ELSE (t_customer_credit.credit - t_customer_credit.debit) * t_customer_credit.ex_rate END) as current_credit'))
                ->groupBy('t_customer_credit.customer_id', 't_customer_credit.currency')
                ->get();

            foreach ($credits as $credit) {
                Credits::create([
                    'customer_id' => $credit->customer_id,
                    'currency' => $credit->currency,
                    'current_credit' => $credit->current_credit
                ]);
            }
        }

    }
}
