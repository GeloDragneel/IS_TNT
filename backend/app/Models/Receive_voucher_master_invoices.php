<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Receive_voucher_master_invoices extends BaseModel
{
    use HasFactory;

    protected $table = 't_rv_master_invoices';

    protected $fillable = [
        'rv_master_id',
        'invoice_master_id',
        'created_at',
        'updated_at',
    ];

    public function invoiceMasters() {
        return $this->hasMany(Invoice_master::class, 'id', 'invoice_master_id');
    }
}
