<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class States extends BaseModel
{
    use HasFactory;

    protected $table = 'm_states';
    protected $fillable = ['statename_en','statename_cn','country_code'];
}
