<?php

use App\Models\User;

test('gera o preview de horarios e nao quebra', function () {
    $this->actingAs(User::factory()->create());

    $page = visit('/horarios');

    $page->assertSee('Horários da Semana')
        ->assertSee('08:00')
        ->click('Dia')
        ->assertSee('Horários de Hoje')
        ->assertNoSmoke();
});

test('trocar de template nao gera erros', function () {
    $this->actingAs(User::factory()->create());

    $page = visit('/horarios');

    $page->click('Dark Elegante')
        ->assertNoSmoke();
});
