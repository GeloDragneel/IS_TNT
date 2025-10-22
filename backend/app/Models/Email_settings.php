<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Email_settings extends Model
{
    use HasFactory;

    protected $table = 'm_email_settings';

    protected $fillable = [
        'sender_name',
        'sender_email',
        'reply_to',
        'set_as_default',
    ];
}
