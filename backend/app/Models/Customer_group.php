<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Customer_group extends BaseModel
{
    use HasFactory;

    protected $table = 'm_customer_group';

    protected $fillable = [
        'customer_group_en',
        'customer_group_cn',
        'currency',
        'brevo_list_id'
    ];

    public function groupList(){
        return $this->hasMany(Customer_group_list::class, 'customer_group_id', 'id');
    }
}
