<?php

namespace App\Observers;

use App\Models\Sales_order_master;
use App\Models\Sales_order_detail;
use App\Models\Sales_order_detail_copy;

class SOMasterObserver
{
    /**
     * Handle the Sales_order_master "created" event.
    */
    public function created(Sales_order_master $soMaster): void{
        //
    }

    /**
     * Handle the Sales_order_master "updated" event.
    */
    public function updated(Sales_order_master $soMaster): void{
        $so_number = $soMaster->so_number;
        if($soMaster->invoice_status_id === 5){
            // Step 1: Get all matching records
            $details = Sales_order_detail::where('so_number', $so_number)->get();
            // Step 2: Insert into so_detail_copy
            foreach ($details as $detail) {
                $data = $detail->toArray();
                unset($data['id']); // remove ID if auto-incremented
                Sales_order_detail_copy::create($data);
            }

            // Step 3: Delete from original table
            Sales_order_detail::where('so_number', $so_number)->delete();
        }
    }
    /**
     * Handle the Sales_order_master "deleted" event.
    */
    public function deleted(Sales_order_master $soMaster): void{
        //
    }

    /**
     * Handle the Sales_order_master "restored" event.
    */
    public function restored(Sales_order_master $soMaster): void{
        //
    }

    /**
     * Handle the Sales_order_master "force deleted" event.
    */
    public function forceDeleted(Sales_order_master $soMaster): void{
        //
    }
}
