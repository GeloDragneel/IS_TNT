<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Mass_mailer_template extends BaseModel
{
    use HasFactory;

    protected $table = 't_mass_mailer_template';

    protected $fillable = [
        'template_name',
        'status',
    ];
}
