<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Access_rights extends Model
{
    use HasFactory;

    protected $table = 'm_access_rights';
    protected $fillable = ['login_id','menu_id'];

    public function menu(){
        return $this->belongsTo(Menu_data::class, 'menu_id', 'id');
    }
}
