<?php

use Inertia\Testing\AssertableInertia as Assert;

test('a landing page carrega para visitantes', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('welcome'));
});
