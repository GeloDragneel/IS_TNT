<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Genre extends BaseModel
{
    use HasFactory;

    protected $fillable = ['genre_en','genre_cn','is_deleted'];
    protected $table = 'm_genre';
}
