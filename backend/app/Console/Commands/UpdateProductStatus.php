<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Products;
use App\Models\POrder_detail;
use App\Models\Orders;
use App\Services\ProductStatusService; // Assuming ProductStatusService is in the Services folder

class UpdateProductStatus extends Command
{
    // The name and signature of the console command.
    protected $signature = 'product:update-status';

    // The console command description.
    protected $description = 'Update product status and remaining quantity daily at midnight';

    // Execute the console command.
    public function handle(){
        // Get all products, or you can loop through based on some condition if needed
        $products = Products::all();

        foreach ($products as $product) {
            // Assuming `updateProductRemQty` is a method in the Products model
            $this->updateProductRemQty($product->id);

            // Using the ProductStatusService
            $ProductStatusService = new ProductStatusService();
            $ProductStatus = $ProductStatusService->getProductStatus($product->id);

            // Update the product's status
            Products::where('id', $product->id)->update(['product_status' => $ProductStatus]);
        }

        $this->info('Product statuses updated successfully.');
    }

    // Assuming this method exists in the Products model
    function updateProductRemQty(int $product_id){
        // Step 1: Get the product
        $product = Products::where('id', $product_id)->first();

        if (!$product) {
            throw new \Exception("Product not found: {$product_id}");
        }

        // Step 2: Get needed values
        $orderQty = Orders::where('product_id', $product_id)->sum('Qty');

        $poQty = POrder_detail::where('product_id', $product_id)
            ->whereIn('postatus_id', [1, 2])
            ->sum('Qty');

        $remPOQty = POrder_detail::where('product_id', $product_id)
            ->whereIn('postatus_id', [1, 2])
            ->get()
            ->sum(fn ($row) => ($row->qty ?? 0) - ($row->receive_qty ?? 0));

        // Step 3: Determine values to update
        $status = $product->product_status;
        $remQty = 0;
        $isPOQty = 0;

        switch ($status) {
            case 'Pre-order':
                $remQty = $orderQty;
                $isPOQty = 0;
                break;

            case 'Coming Soon':
                if ($poQty > 0) {
                    $remQty = $poQty;
                    $isPOQty = 1;
                } else {
                    $remQty = $orderQty;
                    $isPOQty = 0;
                }
                break;

            case 'Partial Received':
                $remQty = $remPOQty;
                $isPOQty = 0;
                break;

            case 'No Order':
                $remQty = $poQty;
                $isPOQty = 0;
                break;

            case 'Sold Out':
                $remQty = 0;
                $isPOQty = 0;
                break;
        }

        // Step 4: Update product
        $product->rem_qty = $remQty;
        $product->is_po_qty = $isPOQty;
        $product->save();
    }
}
