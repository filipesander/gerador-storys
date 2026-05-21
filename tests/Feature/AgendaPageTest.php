<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $csv = implode("\n", [
        '"Data","Horário","Tempo do serviço","Clientes","Serviço","Status","Observações","Clientes interessadas"',
        '"21/05/2026","08:00","1:30:00","Virna Santana","Volume Inglês 5D","Confirmado","",""',
    ]);

    Http::fake(['docs.google.com/*' => Http::response($csv, 200, ['Content-Type' => 'text/csv'])]);
});

test('visitantes são redirecionados ao login', function () {
    $this->get(route('agenda'))->assertRedirect(route('login'));
});

test('usuário autenticado vê a agenda', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('agenda'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('agenda/index'));
});

test('exporta a agenda em PDF', function () {
    $response = $this->actingAs(User::factory()->create())
        ->get(route('agenda.exportar', ['period' => 'dia', 'date' => '2026-05-21']));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf');
});
