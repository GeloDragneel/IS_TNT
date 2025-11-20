<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Genre;

class GenreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $priorities = [
            ['genre_en' => 'Movies', 'genre_cn' => '电影人物',  'is_deleted' => 0],
            ['genre_en' => 'Horror', 'genre_cn' => '恐怖', 'is_deleted' => 0],
            ['genre_en' => 'Designer Toys', 'genre_cn' => '潮玩', 'is_deleted' => 0],
            ['genre_en' => 'Cartoon', 'genre_cn' => '卡通', 'is_deleted' => 0],
            ['genre_en' => 'Comics', 'genre_cn' => '漫画', 'is_deleted' => 0],
            ['genre_en' => 'Games', 'genre_cn' => '游戏人物', 'is_deleted' => 0],
            ['genre_en' => 'Crossover', 'genre_cn' => '跨界版', 'is_deleted' => 0],
            ['genre_en' => 'Comedy', 'genre_cn' => '搞笑', 'is_deleted' => 0],
            ['genre_en' => 'Sci-Fi', 'genre_cn' => '科幻', 'is_deleted' => 0],
            ['genre_en' => 'Music', 'genre_cn' => '歌手', 'is_deleted' => 0],
            ['genre_en' => 'Animals & Reptiles', 'genre_cn' => '动物', 'is_deleted' => 0],
            ['genre_en' => 'Anime', 'genre_cn' => '日本动画', 'is_deleted' => 0],
            ['genre_en' => 'TV Series', 'genre_cn' => '电视续集', 'is_deleted' => 0],
        ];

        foreach ($priorities as $priority) {
            Genre::create($priority);
        }
    }
}
