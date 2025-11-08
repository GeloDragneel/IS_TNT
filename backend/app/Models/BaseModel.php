<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Audit_logs;
use Illuminate\Support\Facades\Auth;

class BaseModel extends Model
{
    /**
     * Booted method to attach global events for all models extending this.
    */
    protected static function booted()
    {
        static::created(function ($model) {
            $model->logAudit('created', $model->toArray());
        });

        static::updated(function ($model) {
            $model->logAudit('updated', $model->toArray());
        });

        static::deleted(function ($model) {
            $model->logAudit('deleted', $model->toArray());
        });
    }

    /**
     * Helper function to log the action.
    */
    protected function logAudit($action, $data = null){
        if (
            $this->getTable() !== 't_logs' &&
            $this->getTable() !== 'm_product_images' &&
            $this->getTable() !== 'm_price_setup'
        ) {
            Audit_logs::create([
                'table_name'   => $this->getTable(),
                'table_id'     => $this->getKey(),
                'table_action' => $action,
                'table_data'   => $data ? json_encode($data) : null,
                'user_id'      => \Auth::id() ?? 69,
            ]);
        }
    }

}