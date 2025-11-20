<?php

namespace App\Observers;
use Illuminate\Support\Facades\DB;
use App\Models\Credits;
use App\Models\Accounts_receivable;
use App\Models\Customer_credit;

class AccountReceivableObserver
{
    /**
     * Handle the Accounts_receivable "created" event.
    */
    public function created(Accounts_receivable $accReceivable): void{
        $this->saveCustomerCredit($accReceivable);
    }
    /**
     * Handle the Accounts_receivable "updated" event.
    */
    public function updated(Accounts_receivable $accReceivable): void{
        $this->saveCustomerCredit($accReceivable);
    }
    /**
     * Handle the Accounts_receivable "deleted" event.
    */
    public function deleted(Accounts_receivable $accReceivable): void{
        $this->saveCustomerCredit($accReceivable);
    }
    /**
     * Handle the Accounts_receivable "restored" event.
    */
    public function restored(Accounts_receivable $accReceivable): void{
        //
    }
    /**
     * Handle the Accounts_receivable "force deleted" event.
    */
    public function forceDeleted(Accounts_receivable $accReceivable): void{
        //
    }
    public function saveCustomerCredit(Accounts_receivable $accReceivable){
        $customer_id = $accReceivable->customer_id;

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
            $credits = Customer_credit::where('customer_id', $accReceivable->customer_id)
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
