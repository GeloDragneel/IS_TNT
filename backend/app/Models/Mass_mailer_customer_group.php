<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mass_mailer_customer_group extends Model
{
    use HasFactory;

    protected $table = 't_mass_mailer_group';

    protected $fillable = [
        'mass_mailer_id',
        'customer_group_id',
    ];

    public function customerGroup(){
        return $this->belongsTo(Customer_group::class, 'customer_group_id', 'id');
    }
}
