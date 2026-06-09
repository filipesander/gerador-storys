<?php

use App\Http\Controllers\AgendaController;
use App\Http\Controllers\StoryController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('agenda', [AgendaController::class, 'index'])->name('agenda');
    Route::get('agenda/exportar', [AgendaController::class, 'export'])->name('agenda.exportar');
    Route::get('horarios', [StoryController::class, 'index'])->name('stories');
    Route::put('horarios', [StoryController::class, 'update'])->name('stories.update');
});

require __DIR__.'/settings.php';
