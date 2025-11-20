<?php

namespace App\Observers;

use App\Models\Accounts_payable_details;
use App\Models\Grn_details;

class APDetailObserver
{
    /**
     * Handle the Accounts_payable_details "created" event.
     */
    public function created(Accounts_payable_details $accounts_payable_details): void{
        //
    }

    /**
     * Handle the Accounts_payable_details "updated" event.
     */
    public function updated(Accounts_payable_details $accounts_payable_details): void{
        //
    }

    /**
     * Handle the Accounts_payable_details "deleted" event.
     */
    public function deleted(Accounts_payable_details $accounts_payable_details): void{
        Grn_details::where('po_id', $accounts_payable_details->po_detail_id)->update(['ap_invoice_no' => 0]);
    }

    /**
     * Handle the Accounts_payable_details "restored" event.
     */
    public function restored(Accounts_payable_details $accounts_payable_details): void{
        //
    }

    /**
     * Handle the Accounts_payable_details "force deleted" event.
     */
    public function forceDeleted(Accounts_payable_details $accounts_payable_details): void{
        //
    }
}
