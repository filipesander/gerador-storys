<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $csv = implode("\n", [
        '"Data","Horário","Tempo do serviço","Clientes","Serviço","Status","Observações","Clientes interessadas"',
        '"21/05/2026","08:00","1:30:00","Virna Santana","Volume Inglês 5D","Confirmado","",""',
    ]);

    Http::fake(['docs.google.com/*' => Http::response($csv, 200, ['Content-Type' => 'text/csv'])]);
});

test('exporta a agenda em PNG sem gerar erros', function () {
    $this->actingAs(User::factory()->create());

    $page = visit('/agenda?period=dia&date=2026-05-21');

    $page->assertSee('Virna Santana')
        ->click('Exportar PNG')
        ->assertNoSmoke();
});
