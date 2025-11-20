<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Serial_no extends BaseModel
{
    use HasFactory;

    protected $table = 'm_serial_no';

    protected $fillable = [
        'serial_no',
        'batch_no',
        'no_of_time_verified',
    ];

}
