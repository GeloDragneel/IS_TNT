<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Tag_emails extends BaseModel
{
    use HasFactory;

    protected $table = 'm_tag_emails';

    protected $fillable = [
        'email_address',
        'created_at',
        'updated_at',
    ];

}
