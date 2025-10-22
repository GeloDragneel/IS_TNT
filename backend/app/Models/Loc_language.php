<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Loc_language extends Model
{
    use HasFactory;

    protected $fillable = ['loc_tag','en','cn'];

    protected $table = 'm_loc_languages';
}
