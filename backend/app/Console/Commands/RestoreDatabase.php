<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class RestoreDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:restore-database';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle(){
        $dbName = env('DB_DATABASE');
        $dbUser = env('DB_USERNAME');
        $dbPass = env('DB_PASSWORD');
        $sqlFile = base_path('dbBackup/is2025_v4_restore.sql');

        $command = "mysql -u {$dbUser} -p{$dbPass} {$dbName} < {$sqlFile}";

        $process = Process::fromShellCommandline($command);

        try {
            $process->mustRun();
            $this->info('Database restored successfully.');
        } catch (ProcessFailedException $exception) {
            $this->error('Database restore failed: ' . $exception->getMessage());
        }
    }
}
