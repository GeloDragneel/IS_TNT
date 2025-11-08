<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Menu_data extends BaseModel
{
    use HasFactory;

    protected $table = 'm_menu_data';

    protected $fillable = [
        'root_name',
        'label_en',
        'label_cn',
        'icon',
        'icon_name',
        'component',
        'component_name',
        'is_deleted',
        'login_id',
        'ranking',
    ];

    // In Menu_data.php
    public function accessRights(){
        return $this->hasMany(Access_rights::class, 'menu_id', 'id');
    }
}
