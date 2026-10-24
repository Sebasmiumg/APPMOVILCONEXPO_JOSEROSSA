<?php

namespace App\Support;

final class AccesoCapacitaciones
{
    public static function emailPermitido(?string $email): bool
    {
        if (! is_string($email) || trim($email) === '') {
            return false;
        }

        return in_array(
            mb_strtolower(trim($email)),
            config('capacitaciones.allowed_emails', []),
            true,
        );
    }
}
