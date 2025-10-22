<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mass_mailer_customer extends Model
{
    use HasFactory;

    protected $table = 't_mass_mailer_customer';

    protected $fillable = [
        'mass_mailer_id',
        'customer_id',
    ];

    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
}
