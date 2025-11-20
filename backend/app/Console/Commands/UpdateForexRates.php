<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Forex;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Carbon;

class UpdateForexRates extends Command{
    protected $signature = 'forex:update';
    protected $description = 'Update forex exchange rates daily at midnight';

    public function handle()
    {
        $date = Carbon::now('Asia/Singapore')->format('m/d/Y');

        $exists = Forex::where('date_enter', $date)->exists();

        if (!$exists) {
            $response = Http::get('http://data.fixer.io/api/latest', [
                'access_key' => '343e1f3574e189f17eb2a1281d8197c9',
            ]);

            if ($response->successful()) {
                $rates = $response->object()->rates;
                $base = 1 / $rates->CNY;

                $forexRates = [
                    'RMB' => 1,
                    'SG$' => (1 / $rates->SGD) / $base,
                    'US$' => (1 / $rates->USD) / $base,
                    'JPY' => (1 / $rates->JPY) / $base,
                    'HK$' => (1 / $rates->HKD) / $base,
                    'AUD' => (1 / $rates->AUD) / $base,
                ];

                foreach ($forexRates as $code => $rate) {
                    Forex::create([
                        'from_currency' => 'RMB',
                        'to_currency' => $code,
                        'ex_rate' => round($rate, 4),
                        'date_enter' => $date,
                    ]);
                }

                $this->info("Forex rates updated for $date.");
            } else {
                $this->error("API error: " . $response->body());
            }
        } else {
            $this->info("Forex rates already exist for $date.");
        }
    }
}
