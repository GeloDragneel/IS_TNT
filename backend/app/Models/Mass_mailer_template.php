<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mass_mailer_template extends Model
{
    use HasFactory;

    protected $table = 't_mass_mailer_template';

    protected $fillable = [
        'template_name',
        'status',
    ];
}
