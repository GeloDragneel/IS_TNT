<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Manufacturer;
class ManufacturerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $priorities = [
            ['manufacturer_en' => 'NECA', 'manufacturer_cn' => 'NECA',  'is_deleted' => 0],
            ['manufacturer_en' => 'Mezco', 'manufacturer_cn' => 'Mezco', 'is_deleted' => 0],
            ['manufacturer_en' => 'QMX', 'manufacturer_cn' => 'QMX', 'is_deleted' => 0],
            ['manufacturer_en' => 'Diamond Distributors', 'manufacturer_cn' => 'Diamond Distributors', 'is_deleted' => 0],
            ['manufacturer_en' => 'Toyntoys', 'manufacturer_cn' => 'Toyntoys', 'is_deleted' => 0],
            ['manufacturer_en' => 'Megalopolis', 'manufacturer_cn' => 'Megalopolis', 'is_deleted' => 0],
            ['manufacturer_en' => 'Purearts', 'manufacturer_cn' => 'Purearts', 'is_deleted' => 0],
            ['manufacturer_en' => 'Wizkids', 'manufacturer_cn' => 'Wizkids', 'is_deleted' => 0],
            ['manufacturer_en' => 'WETA', 'manufacturer_cn' => 'WETA', 'is_deleted' => 0],
            ['manufacturer_en' => 'Sideshow Collectibles', 'manufacturer_cn' => 'Sideshow Collectibles', 'is_deleted' => 0],
            ['manufacturer_en' => 'Imaginarium Art', 'manufacturer_cn' => 'Imaginarium Art', 'is_deleted' => 0],
            ['manufacturer_en' => 'Super 7', 'manufacturer_cn' => 'Super 7', 'is_deleted' => 0],
            ['manufacturer_en' => 'Kaiyodo', 'manufacturer_cn' => '海洋堂', 'is_deleted' => 0],
            ['manufacturer_en' => 'Metal Blade', 'manufacturer_cn' => 'Metal Blade', 'is_deleted' => 0],
            ['manufacturer_en' => 'Nuclear Blast', 'manufacturer_cn' => 'Nuclear Blast', 'is_deleted' => 0],
            ['manufacturer_en' => 'Black Tears', 'manufacturer_cn' => 'Black Tears', 'is_deleted' => 0],
            ['manufacturer_en' => 'American Recordings', 'manufacturer_cn' => 'American Recordings', 'is_deleted' => 0],
            ['manufacturer_en' => 'Earache', 'manufacturer_cn' => 'Earache', 'is_deleted' => 0],
            ['manufacturer_en' => 'Listenable', 'manufacturer_cn' => 'Listenable', 'is_deleted' => 0],
            ['manufacturer_en' => 'Sumerian', 'manufacturer_cn' => 'Sumerian', 'is_deleted' => 0],
            ['manufacturer_en' => 'Century Media', 'manufacturer_cn' => 'Century Media', 'is_deleted' => 0],
            ['manufacturer_en' => 'Roadrunner Records', 'manufacturer_cn' => 'Roadrunner Records', 'is_deleted' => 0],
            ['manufacturer_en' => 'Premium DNA', 'manufacturer_cn' => 'Premium DNA', 'is_deleted' => 0],
            ['manufacturer_en' => 'Takaratomy', 'manufacturer_cn' => 'Takaratomy', 'is_deleted' => 0],
            ['manufacturer_en' => 'The Four Horsemen', 'manufacturer_cn' => '四骑士', 'is_deleted' => 0],
            ['manufacturer_en' => 'Nacelle', 'manufacturer_cn' => 'Nacelle', 'is_deleted' => 0],
            ['manufacturer_en' => 'SD Toys', 'manufacturer_cn' => 'SD Toys', 'is_deleted' => 0],
            ['manufacturer_en' => 'Capcom', 'manufacturer_cn' => 'Capcom', 'is_deleted' => 0],
            ['manufacturer_en' => 'Youtooz', 'manufacturer_cn' => 'Youtooz', 'is_deleted' => 0],
        ];

        foreach ($priorities as $priority) {
            Manufacturer::create($priority);
        }
    }
}
