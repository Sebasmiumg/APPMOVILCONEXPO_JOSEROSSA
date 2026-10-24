<?php

namespace App\Support;

use Illuminate\Support\Str;

final class SupabaseResourceMapper
{
    public static function cuenta(array $row): array
    {
        return [
            'id' => $row['id'],
            'nombre' => $row['nombre'],
            'tipo' => $row['tipo'],
            'moneda' => $row['moneda'],
            'saldo_inicial' => $row['saldo_inicial'],
            'color' => $row['color'] ?? null,
            'icono' => $row['icono'] ?? null,
            'activa' => (bool) $row['activa'],
            'created_at' => $row['creada_en'] ?? null,
            'updated_at' => $row['actualizado_en'] ?? $row['creada_en'] ?? null,
        ];
    }

    public static function categoria(array $row): array
    {
        $clave = (string) ($row['nombre_clave_traduccion'] ?? '');

        return [
            'id' => $row['id'],
            'tipo' => $row['tipo'],
            'nombre' => $row['nombre_personalizado'] ?: self::nombreClave($clave),
            'icono' => $row['icono'],
            'color' => $row['color'],
            'activa' => (bool) $row['activa'],
            'created_at' => $row['creada_en'] ?? $row['actualizado_en'] ?? null,
            'updated_at' => $row['actualizado_en'] ?? null,
        ];
    }

    public static function movimiento(array $row, array $cuentas, array $categorias): array
    {
        $cuenta = $cuentas[$row['cuenta_id']] ?? null;
        $categoria = isset($row['categoria_id']) ? ($categorias[$row['categoria_id']] ?? null) : null;

        return [
            'id' => $row['id'],
            'descripcion' => $row['descripcion'] ?? '',
            'monto' => $row['monto'],
            'tipo' => $row['tipo'],
            'categoria_id' => $row['categoria_id'] ?? null,
            'categoria' => $categoria['nombre'] ?? '',
            'cuenta_id' => $row['cuenta_id'],
            'cuenta' => $cuenta['nombre'] ?? '',
            'fecha' => substr((string) $row['fecha_movimiento'], 0, 10),
            'fecha_movimiento' => $row['fecha_movimiento'],
            'notas' => $row['notas'] ?? null,
            'recurrente' => (bool) ($row['recurrente'] ?? false),
            'created_at' => $row['creado_en'] ?? null,
            'updated_at' => $row['actualizado_en'] ?? $row['creado_en'] ?? null,
        ];
    }

    public static function meta(array $row, array $aportes = []): array
    {
        return [
            'id' => $row['id'],
            'cuenta_id' => $row['cuenta_id'] ?? null,
            'nombre' => $row['nombre'],
            'monto_objetivo' => $row['monto_objetivo'],
            'monto_actual' => $row['monto_actual'],
            'fecha_objetivo' => $row['fecha_objetivo'] ?? null,
            'estado' => $row['estado'],
            'aportes' => $aportes,
            'created_at' => $row['creada_en'] ?? null,
            'updated_at' => $row['actualizado_en'] ?? $row['creada_en'] ?? null,
        ];
    }

    public static function aporte(array $row): array
    {
        return [
            'id' => $row['id'],
            'meta_id' => $row['meta_id'],
            'monto' => $row['monto'],
            'fecha' => $row['fecha'],
            'nota' => $row['nota'] ?? null,
            'created_at' => $row['creado_en'] ?? null,
            'updated_at' => $row['creado_en'] ?? null,
        ];
    }

    public static function presupuesto(array $row, array $categorias): array
    {
        return [
            'id' => $row['id'],
            'categoria_id' => $row['categoria_id'],
            'categoria' => $categorias[$row['categoria_id']]['nombre'] ?? '',
            'periodo' => $row['periodo'],
            'limite' => $row['limite'],
            'porcentaje_alerta' => (int) $row['porcentaje_alerta'],
            'created_at' => $row['creado_en'] ?? null,
            'updated_at' => $row['actualizado_en'] ?? $row['creado_en'] ?? null,
        ];
    }

    public static function nombreClave(string $clave): string
    {
        if ($clave === '') {
            return '';
        }

        return Str::headline(Str::afterLast($clave, '.'));
    }
}
