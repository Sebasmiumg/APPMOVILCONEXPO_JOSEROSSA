<?php

use App\Http\Controllers\AporteMetaController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\CuentaController;
use App\Http\Controllers\MetaController;
use App\Http\Controllers\MovimientoController;
use App\Http\Controllers\PresupuestoCapacitacionController;
use App\Http\Controllers\PresupuestoCategoriaController;
use App\Http\Controllers\ReporteController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware(['throttle:60,1', 'auth.hibrida'])->group(function () {
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('movimientos', MovimientoController::class);
    Route::apiResource('presupuestos-capacitacion', PresupuestoCapacitacionController::class);
    Route::get('/reportes/movimientos-por-mes', [ReporteController::class, 'movimientosPorMes']);

    Route::apiResource('cuentas', CuentaController::class);
    Route::apiResource('categorias', CategoriaController::class);
    Route::apiResource('presupuestos-categoria', PresupuestoCategoriaController::class)
        ->parameter('presupuestos-categoria', 'presupuesto_categoria');
    Route::apiResource('metas', MetaController::class);
    Route::apiResource('metas.aportes', AporteMetaController::class)->shallow();
});
