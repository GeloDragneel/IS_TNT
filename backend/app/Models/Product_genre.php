<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Genre;
class Product_genre extends Model
{
    use HasFactory;

    protected $table = 'm_product_genre';
    protected $fillable = ['product_id','genre_id'];

    public function genre()
    {
        return $this->hasOne(Genre::class, 'product_id', 'id');
    }

}
