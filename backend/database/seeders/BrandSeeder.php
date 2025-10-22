<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Brands;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $priorities = [
            ['brands_en' => 'Teenage Mutant Ninja Turtles', 'brands_cn' => '忍着神龟',  'is_deleted' => 0],
            ['brands_en' => 'Star Wars', 'brands_cn' => '星球大战', 'is_deleted' => 0],
            ['brands_en' => 'Friday The 13th', 'brands_cn' => '黑色星期五', 'is_deleted' => 0],
            ['brands_en' => 'The Conjuring', 'brands_cn' => '招魂', 'is_deleted' => 0],
            ['brands_en' => 'Halloween', 'brands_cn' => '月光光心慌慌', 'is_deleted' => 0],
            ['brands_en' => 'Alien', 'brands_cn' => '异形', 'is_deleted' => 0],
            ['brands_en' => 'Gremlins', 'brands_cn' => '小精灵', 'is_deleted' => 0],
            ['brands_en' => 'Batman', 'brands_cn' => '蝙蝠侠', 'is_deleted' => 0],
        ];

        foreach ($priorities as $priority) {
            Brands::create($priority);
        }
    }
}
