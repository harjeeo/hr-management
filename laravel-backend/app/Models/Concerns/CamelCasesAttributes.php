<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Serializes Eloquent models to camelCase JSON keys so the API shape
 * matches the previous NestJS/Prisma backend (and the existing React
 * frontend's TypeScript types) without touching every controller.
 */
trait CamelCasesAttributes
{
    public function toArray(): array
    {
        return $this->camelCaseKeys(parent::toArray());
    }

    private function camelCaseKeys(array $array): array
    {
        $result = [];

        foreach ($array as $key => $value) {
            $newKey = is_string($key) && $key !== '' && $key[0] !== '_'
                ? Str::camel($key)
                : $key;

            if (is_array($value)) {
                $value = $this->camelCaseKeys($value);
            }

            $result[$newKey] = $value;
        }

        return $result;
    }
}
