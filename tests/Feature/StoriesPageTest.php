<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('visitantes sao redirecionados para o login', function () {
    $this->get(route('stories'))->assertRedirect(route('login'));
});

test('usuarios autenticados acessam o gerador de stories', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('stories'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('stories/index'));
});
