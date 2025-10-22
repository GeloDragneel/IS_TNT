<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee_Info extends Model
{
    use HasFactory;

    protected $table = 'm_employee_info';

    protected $fillable = [
        'employee_no',
        'firstname',
        'middlename',
        'lastname',
    ];

    public function getFullNameAttribute(){
        return trim("{$this->firstname} {$this->middlename} {$this->lastname}");
    }
}
