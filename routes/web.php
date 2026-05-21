<?php

use App\Http\Controllers\AgendaController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('agenda', [AgendaController::class, 'index'])->name('agenda');
    Route::get('agenda/exportar', [AgendaController::class, 'export'])->name('agenda.exportar');
    Route::inertia('horarios', 'stories/index')->name('stories');
});

require __DIR__.'/settings.php';
