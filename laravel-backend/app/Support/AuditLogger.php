<?php

namespace App\Support;

use App\Models\AuditLog;

class AuditLogger
{
    public static function log(array $params): void
    {
        AuditLog::create([
            'organization_id' => $params['organizationId'] ?? null,
            'user_id' => $params['userId'] ?? null,
            'action' => $params['action'],
            'entity_type' => $params['entityType'] ?? null,
            'entity_id' => $params['entityId'] ?? null,
            'description' => $params['description'],
            'ip_address' => $params['ipAddress'] ?? null,
            'user_agent' => $params['userAgent'] ?? null,
            'created_at' => now(),
        ]);
    }
}
