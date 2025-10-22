<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        \App\Events\POEvent::class => [],
        \App\Events\CustomerEvent::class => [],
        \App\Events\PreorderEvent::class => [],
        \App\Events\ProductEvent::class => [],
        \App\Events\PVEvent::class => [],
        \App\Events\RVEvent::class => [],
        \App\Events\SupplierEvent::class => [],
        \App\Events\LogEvent::class => [],
        \App\Events\GRNEvent::class => [],
        \App\Events\AllocationEvent::class => [],
        \App\Events\InventoryEvent::class => [],
        \App\Events\SOEvent::class => [],
        \App\Events\CustInvoiceEvent::class => [],
        \App\Events\ShipmentEvent::class => [],
        \App\Events\MassMailerEvent::class => [],
        \App\Events\CustomerGroupEvent::class => [],
        \App\Events\APEvent::class => [],
        \App\Events\AccessRightEvent::class => [],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void{
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool{
        return false;
    }
}
