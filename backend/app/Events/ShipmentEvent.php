<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class ShipmentEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $action;
    
    public function __construct($action)
    {
        $this->action = $action;
    }

    // Channel clients subscribe to
    public function broadcastOn()
    {
        return new Channel('shipment-channel');
    }

    // Event name to broadcast as
    public function broadcastAs()
    {
        return 'shipment-event';
    }

    // Data sent to clients
    public function broadcastWith()
    {
        return [
            'action' => $this->action,
        ];
    }
}
