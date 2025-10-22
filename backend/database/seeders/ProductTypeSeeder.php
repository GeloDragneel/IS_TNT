<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Product_type;
class ProductTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $priorities = [
            ['product_type_en' => 'Action Figures',    'product_type_cn' => '可动玩具',  'is_deleted' => 0],
            ['product_type_en' => 'Statue',            'product_type_cn' => '雕像',     'is_deleted' => 0],
            ['product_type_en' => 'Designer Toys',     'product_type_cn' => '潮玩',     'is_deleted' => 0],
            ['product_type_en' => 'Prop Replica',      'product_type_cn' => '道具',     'is_deleted' => 0],
            ['product_type_en' => 'Environmental',     'product_type_cn' => '场景',     'is_deleted' => 0],
            ['product_type_en' => 'LP',                'product_type_cn' => '黑胶唱片', 'is_deleted' => 0],
            ['product_type_en' => 'Trading Figures',   'product_type_cn' => '盲盒',     'is_deleted' => 0],
            ['product_type_en' => 'Car Models',        'product_type_cn' => '车模',     'is_deleted' => 0],
        ];

        foreach ($priorities as $priority) {
            Product_type::create($priority);
        }
    }
}
