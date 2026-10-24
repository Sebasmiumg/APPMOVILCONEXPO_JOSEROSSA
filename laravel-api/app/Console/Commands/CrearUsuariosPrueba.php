<?php

namespace App\Console\Commands;

use App\Models\Movimiento;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;

class CrearUsuariosPrueba extends Command
{
    protected $signature = 'usuarios:crear-prueba';

    protected $description = 'Crea o actualiza cuentas de prueba solo si se habilitan y se configuran contraseñas únicas';

    private const CUENTAS = [
        ['nombre' => 'Ana Fernanda López', 'email' => 'ana.lopez@example.com', 'password_env' => 'PRUEBA_ANA_PASSWORD'],
        ['nombre' => 'José Cayetano', 'email' => 'jose.cayetano@example.com', 'password_env' => 'PRUEBA_JOSE_PASSWORD'],
    ];

    public function handle(): int
    {
        if (! filter_var(env('PRUEBA_USUARIOS_HABILITADOS', false), FILTER_VALIDATE_BOOL)) {
            $this->info('Cuentas de prueba deshabilitadas; no se crearon ni modificaron usuarios.');
            return self::SUCCESS;
        }

        $contrasenas = [];
        foreach (self::CUENTAS as $cuenta) {
            $password = env($cuenta['password_env']);
            if (! is_string($password) || strlen($password) < 16) {
                $this->error("Falta configurar una contraseña única de al menos 16 caracteres en {$cuenta['password_env']}; no se modificaron cuentas.");
                return self::FAILURE;
            }
            $contrasenas[$cuenta['email']] = $password;
        }

        foreach (self::CUENTAS as $cuenta) {
            $usuario = User::where('email', $cuenta['email'])->first();

            if (! $usuario) {
                $usuario = User::create([
                    'name' => $cuenta['nombre'],
                    'email' => $cuenta['email'],
                    'password' => $contrasenas[$cuenta['email']],
                ]);
                $this->info("Cuenta de prueba {$cuenta['email']} creada.");
            } else {
                $usuario->password = $contrasenas[$cuenta['email']];
                $usuario->save();
                $usuario->tokens()->delete();
                $this->info("Credencial de {$cuenta['email']} actualizada y sesiones revocadas.");
            }

            if ($cuenta['email'] === 'ana.lopez@example.com') {
                $this->sembrarMovimientos($usuario, [
                    ['descripcion' => 'Venta de productos', 'monto' => 1500.00, 'tipo' => 'ingreso', 'categoria' => 'Ventas', 'dias' => 2, 'mes' => 'anterior'],
                    ['descripcion' => 'Aporte de capital', 'monto' => 500.00, 'tipo' => 'ingreso', 'categoria' => 'Aportes', 'dias' => 6, 'mes' => 'anterior'],
                    ['descripcion' => 'Compra de insumos', 'monto' => 320.50, 'tipo' => 'gasto', 'categoria' => 'Insumos', 'dias' => 10, 'mes' => 'anterior'],
                    ['descripcion' => 'Pago de servicios', 'monto' => 150.00, 'tipo' => 'gasto', 'categoria' => 'Servicios', 'dias' => 20, 'mes' => 'anterior'],
                    ['descripcion' => 'Venta de productos', 'monto' => 1800.00, 'tipo' => 'ingreso', 'categoria' => 'Ventas', 'dias' => 3, 'mes' => 'actual'],
                    ['descripcion' => 'Compra de insumos', 'monto' => 410.75, 'tipo' => 'gasto', 'categoria' => 'Insumos', 'dias' => 5, 'mes' => 'actual'],
                    ['descripcion' => 'Transporte', 'monto' => 85.00, 'tipo' => 'gasto', 'categoria' => 'Transporte', 'dias' => 8, 'mes' => 'actual'],
                ]);
            }

            if ($cuenta['email'] === 'jose.cayetano@example.com') {
                $this->sembrarMovimientos($usuario, [
                    ['descripcion' => 'Pago de cliente', 'monto' => 2200.00, 'tipo' => 'ingreso', 'categoria' => 'Ventas', 'dias' => 1, 'mes' => 'anterior'],
                    ['descripcion' => 'Consultoría', 'monto' => 900.00, 'tipo' => 'ingreso', 'categoria' => 'Servicios', 'dias' => 9, 'mes' => 'anterior'],
                    ['descripcion' => 'Alquiler de local', 'monto' => 650.00, 'tipo' => 'gasto', 'categoria' => 'Alquiler', 'dias' => 12, 'mes' => 'anterior'],
                    ['descripcion' => 'Compra de equipo', 'monto' => 275.25, 'tipo' => 'gasto', 'categoria' => 'Insumos', 'dias' => 18, 'mes' => 'anterior'],
                    ['descripcion' => 'Pago de cliente', 'monto' => 2600.00, 'tipo' => 'ingreso', 'categoria' => 'Ventas', 'dias' => 4, 'mes' => 'actual'],
                    ['descripcion' => 'Publicidad', 'monto' => 300.00, 'tipo' => 'gasto', 'categoria' => 'Marketing', 'dias' => 6, 'mes' => 'actual'],
                    ['descripcion' => 'Transporte', 'monto' => 95.00, 'tipo' => 'gasto', 'categoria' => 'Transporte', 'dias' => 11, 'mes' => 'actual'],
                ]);
            }
        }

        return self::SUCCESS;
    }

    // El equipo va a probar GET /reportes/movimientos-por-mes contra estas
    // cuentas: sin movimientos cargados, el reporte devolvería una lista
    // vacía y no demostraría nada. Se usan fechas ancladas al mes anterior y
    // al actual (en vez de "hace N días") para garantizar siempre dos
    // periodos distintos en el agrupado por mes, sin importar qué día del
    // mes sea hoy.
    private function sembrarMovimientos(User $usuario, array $movimientos): void
    {
        if (Movimiento::withoutGlobalScopes()->where('user_id', $usuario->id)->exists()) {
            $this->info("{$usuario->email} ya tiene movimientos de caja de efectivo, no se vuelven a sembrar.");
            return;
        }

        $mesAnterior = now()->subMonthNoOverflow()->startOfMonth();
        $mesActual = now()->startOfMonth();

        Auth::login($usuario);
        foreach ($movimientos as $datos) {
            $base = $datos['mes'] === 'anterior' ? $mesAnterior : $mesActual;
            Movimiento::create([
                'descripcion' => $datos['descripcion'],
                'monto' => $datos['monto'],
                'tipo' => $datos['tipo'],
                'categoria' => $datos['categoria'],
                'cuenta' => 'Efectivo',
                'fecha' => $base->copy()->addDays($datos['dias'])->format('Y-m-d'),
            ]);
        }
        Auth::logout();

        $this->info("Movimientos de caja de efectivo de {$usuario->email} sembrados (2 meses).");
    }
}
