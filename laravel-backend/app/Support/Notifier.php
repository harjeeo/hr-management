<?php

namespace App\Support;

use App\Models\AppNotification;

class Notifier
{
    public static function send(string $organizationId, string $userId, string $type, string $message): void
    {
        AppNotification::create([
            'organization_id' => $organizationId,
            'user_id' => $userId,
            'type' => $type,
            'message' => $message,
        ]);
    }
}
