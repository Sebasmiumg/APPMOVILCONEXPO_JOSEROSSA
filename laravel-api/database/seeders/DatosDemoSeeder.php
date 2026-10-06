<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Cuenta;
use App\Models\Meta;
use App\Models\Movimiento;
use App\Models\PresupuestoCapacitacion;
use App\Models\PresupuestoCategoria;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Genera datos de demostración con volumen y variedad, simulando varios usuarios
 * distintos (cada uno con sus propias cuentas, movimientos y metas). Los recursos
 * de este backend no tienen aún una relación user_id formal (ver README), así que
 * la pertenencia a cada usuario se refleja en el nombre de sus cuentas.
 */
class DatosDemoSeeder extends Seeder
{
    private const USUARIOS = [
        ['nombre' => 'Ana Fernanda López', 'email' => 'ana.lopez@example.com'],
        ['nombre' => 'Carlos Eduardo Ramírez', 'email' => 'carlos.ramirez@example.com'],
        ['nombre' => 'María José Gutiérrez', 'email' => 'maria.gutierrez@example.com'],
        ['nombre' => 'Luis Fernando Pérez', 'email' => 'luis.perez@example.com'],
        ['nombre' => 'Sofía Alejandra Morales', 'email' => 'sofia.morales@example.com'],
    ];

    private const TIPOS_CUENTA_SECUNDARIA = ['cuenta_ahorro', 'tarjeta_credito', 'cuenta_bancaria', 'billetera_digital', 'negocio'];

    private const ETIQUETAS_TIPO_CUENTA = [
        'cuenta_ahorro' => 'Cuenta de ahorro',
        'tarjeta_credito' => 'Tarjeta de crédito',
        'cuenta_bancaria' => 'Cuenta bancaria',
        'billetera_digital' => 'Billetera digital',
        'negocio' => 'Cuenta de negocio',
    ];

    private const METAS_NOMBRES = [
        'Fondo de emergencia', 'Viaje a la playa', 'Nueva laptop', 'Enganche de auto',
        'Curso de idiomas', 'Remodelación de cocina', 'Boda', 'Fondo de retiro',
    ];

    private const CAPACITACIONES = [
        'Capacitación de Laravel avanzado' => 'Taller práctico para el equipo de backend sobre patrones avanzados de Laravel.',
        'Taller de liderazgo para equipos' => 'Desarrollo de habilidades de liderazgo y comunicación para jefaturas.',
        'Curso de atención al cliente' => 'Técnicas de servicio y resolución de quejas para el equipo de soporte.',
        'Certificación en manejo de Excel avanzado' => 'Fórmulas, tablas dinámicas y automatización básica con macros.',
        'Taller de primeros auxilios' => 'Capacitación obligatoria de seguridad e higiene para todo el personal.',
        'Curso de oratoria y presentaciones' => 'Mejora de habilidades de comunicación en público para el equipo comercial.',
        'Capacitación en seguridad ocupacional' => 'Normas de seguridad industrial y prevención de accidentes laborales.',
        'Taller de ventas consultivas' => 'Estrategias de venta consultiva orientadas a la retención de clientes.',
    ];

    private const NOTAS_APORTE = [
        'Ahorro quincenal', 'Bono extra del mes', 'Aporte mensual programado',
        'Depósito adicional', 'Ahorro del aguinaldo', 'Venta de artículos usados',
    ];

    public function run(): void
    {
        $categoriasGasto = Categoria::where('tipo', 'gasto')->get();
        $categoriasIngreso = Categoria::where('tipo', 'ingreso')->get();

        foreach (self::USUARIOS as $indice => $datosUsuario) {
            $primerNombre = explode(' ', $datosUsuario['nombre'])[0];

            User::factory()->create([
                'name' => $datosUsuario['nombre'],
                'email' => $datosUsuario['email'],
            ]);

            $cuentaEfectivo = Cuenta::create([
                'nombre' => "Efectivo de {$primerNombre}",
                'tipo' => 'efectivo',
                'moneda' => 'GTQ',
                'saldo_inicial' => fake()->randomFloat(2, 200, 3000),
                'color' => '#20D997',
                'icono' => 'payments',
                'activa' => true,
            ]);

            $tipoSecundario = self::TIPOS_CUENTA_SECUNDARIA[$indice % count(self::TIPOS_CUENTA_SECUNDARIA)];
            $cuentaSecundaria = Cuenta::create([
                'nombre' => self::ETIQUETAS_TIPO_CUENTA[$tipoSecundario] . " de {$primerNombre}",
                'tipo' => $tipoSecundario,
                'moneda' => fake()->randomElement(['GTQ', 'GTQ', 'GTQ', 'USD']),
                'saldo_inicial' => fake()->randomFloat(2, 500, 15000),
                'color' => '#7C4DFF',
                'icono' => 'account-balance-wallet',
                'activa' => true,
            ]);

            foreach ([$cuentaEfectivo, $cuentaSecundaria] as $cuenta) {
                $this->generarMovimientos($cuenta, $categoriasGasto, $categoriasIngreso);
            }

            $this->generarMetas($cuentaSecundaria);
        }

        $this->generarPresupuestosCategoria($categoriasGasto);
        $this->generarPresupuestosCapacitacion();
    }

    private function generarMovimientos(Cuenta $cuenta, Collection $categoriasGasto, Collection $categoriasIngreso): void
    {
        $cantidad = fake()->numberBetween(15, 25);

        for ($i = 0; $i < $cantidad; $i++) {
            $tipo = fake()->randomElement(['gasto', 'gasto', 'gasto', 'ingreso']);
            $categoria = $tipo === 'gasto' ? $categoriasGasto->random() : $categoriasIngreso->random();

            Movimiento::create([
                'descripcion' => self::descripcionMovimiento($categoria->nombre, $tipo),
                'monto' => $tipo === 'ingreso' ? fake()->randomFloat(2, 500, 8000) : fake()->randomFloat(2, 15, 1200),
                'tipo' => $tipo,
                'categoria' => $categoria->nombre,
                'cuenta' => $cuenta->nombre,
                'fecha' => now()->subDays(fake()->numberBetween(0, 120))->format('Y-m-d'),
            ]);
        }
    }

    private function generarMetas(Cuenta $cuenta): void
    {
        $cantidadMetas = fake()->numberBetween(1, 2);

        for ($i = 0; $i < $cantidadMetas; $i++) {
            $montoObjetivo = fake()->randomFloat(2, 1000, 15000);

            $meta = Meta::create([
                'cuenta_id' => $cuenta->id,
                'nombre' => fake()->randomElement(self::METAS_NOMBRES),
                'monto_objetivo' => $montoObjetivo,
                'monto_actual' => 0,
                'fecha_objetivo' => now()->addMonths(fake()->numberBetween(2, 12))->format('Y-m-d'),
                'estado' => 'activa',
            ]);

            $totalAportes = 0;
            $cantidadAportes = fake()->numberBetween(2, 5);
            for ($a = 0; $a < $cantidadAportes; $a++) {
                $montoAporte = fake()->randomFloat(2, 50, max(50, $montoObjetivo * 0.15));
                $totalAportes += $montoAporte;

                $meta->aportes()->create([
                    'monto' => $montoAporte,
                    'fecha' => now()->subDays(fake()->numberBetween(1, 90))->format('Y-m-d'),
                    'nota' => fake()->optional(0.4)->randomElement(self::NOTAS_APORTE),
                ]);
            }

            $meta->update(['monto_actual' => round($totalAportes, 2)]);
        }
    }

    private function generarPresupuestosCategoria(Collection $categoriasGasto): void
    {
        $periodos = [now()->format('Y-m'), now()->subMonth()->format('Y-m')];

        foreach ($categoriasGasto->random(min(10, $categoriasGasto->count())) as $categoria) {
            foreach ($periodos as $periodo) {
                PresupuestoCategoria::create([
                    'categoria_id' => $categoria->id,
                    'periodo' => $periodo,
                    'limite' => fake()->randomFloat(2, 300, 3000),
                    'porcentaje_alerta' => fake()->randomElement([50, 75, 80, 90]),
                ]);
            }
        }
    }

    private function generarPresupuestosCapacitacion(): void
    {
        foreach (self::CAPACITACIONES as $nombre => $descripcion) {
            $montoAsignado = fake()->randomFloat(2, 500, 5000);
            $estado = fake()->randomElement(['planificada', 'en_curso', 'finalizada', 'cancelada']);
            $fechaInicio = now()->copy()->subDays(fake()->numberBetween(-60, 90));

            $montoEjecutado = match ($estado) {
                'finalizada' => $montoAsignado,
                'en_curso' => fake()->randomFloat(2, 0, $montoAsignado),
                default => 0,
            };

            PresupuestoCapacitacion::create([
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'monto_asignado' => $montoAsignado,
                'monto_ejecutado' => $montoEjecutado,
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin' => $fechaInicio->copy()->addDays(fake()->numberBetween(1, 20))->format('Y-m-d'),
                'estado' => $estado,
            ]);
        }
    }

    private static function descripcionMovimiento(string $categoria, string $tipo): string
    {
        if ($tipo === 'ingreso') {
            return fake()->randomElement([
                "Pago de {$categoria}",
                "Depósito por {$categoria}",
                "{$categoria} recibido de " . fake()->company(),
            ]);
        }

        return fake()->randomElement([
            "{$categoria} en " . fake()->company(),
            "Pago de {$categoria}",
            "Compra en " . fake()->city(),
        ]);
    }
}
