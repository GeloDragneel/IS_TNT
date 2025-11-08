<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Login extends BaseModel
{
    use HasFactory;

    protected $table = 'm_login';

    protected $fillable = [
        'username',
        'password',
        'user_language',
        'employee_id',
    ];

    public function employeeInfo() {
        return $this->belongsTo(Employee_Info::class, 'employee_id', 'id');
    }
    public function accessRights() {
        return $this->hasMany(Access_rights::class, 'login_id', 'id');
    }
}
