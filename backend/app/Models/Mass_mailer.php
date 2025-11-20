<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Mass_mailer extends BaseModel
{
    use HasFactory;

    protected $table = 't_mass_mailer';

    protected $fillable = [
        'date',
        'template_id',
        'campaign_id',
        'campaign_name',
    ];

    public function mailerCustomer(){
        return $this->hasMany(Mass_mailer_customer::class, 'mass_mailer_id', 'id');
    }
    public function mailerGroup(){
        return $this->hasMany(Mass_mailer_customer_group::class, 'mass_mailer_id', 'id');
    }
}
