<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Grn_status extends BaseModel
{
    use HasFactory;

    protected $fillable = ['grn_status_en','grn_status_cn'];
    protected $table = 'm_grn_status';
}
