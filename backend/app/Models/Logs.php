<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Logs extends Model
{
    use HasFactory;

    protected $table = 't_logs';
    protected $fillable = ['module','table','action','description','added_by','created_at'];

    public function user(){
        return $this->belongsTo(Login::class, 'added_by', 'id');
    }
}
