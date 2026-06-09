<?php

use App\Models\StorySetting;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function storyPayload(array $overrides = []): array
{
    return array_replace_recursive([
        'data' => [
            'mode' => 'semana',
            'title' => 'Horários da Semana',
            'weekSlots' => [
                ['id' => 'a', 'weekday' => 'terca', 'times' => ['08:00']],
            ],
            'date' => '2026-06-09',
            'dayTimes' => ['08:00'],
        ],
        'template_id' => 'lilas-floral',
        'custom' => null,
    ], $overrides);
}

test('visitantes não conseguem salvar', function () {
    $this->put(route('stories.update'), storyPayload())->assertRedirect(route('login'));
});

test('usuário salva os horários no banco', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('stories.update'), storyPayload())
        ->assertRedirect();

    $setting = StorySetting::where('user_id', $user->id)->firstOrFail();

    expect($setting->data['title'])->toBe('Horários da Semana');
    expect($setting->data['weekSlots'][0]['times'])->toBe(['08:00']);
    expect($setting->template_id)->toBe('lilas-floral');
});

test('salvar duas vezes mantém apenas um registro por usuário', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->put(route('stories.update'), storyPayload());
    $this->actingAs($user)->put(route('stories.update'), storyPayload([
        'data' => ['title' => 'Atualizado'],
    ]));

    expect(StorySetting::where('user_id', $user->id)->count())->toBe(1);
    expect($user->storySetting()->firstOrFail()->data['title'])->toBe('Atualizado');
});

test('a página devolve os horários salvos', function () {
    $user = User::factory()->create();
    $user->storySetting()->create([
        'data' => storyPayload()['data'],
        'template_id' => 'roxo-profundo',
    ]);

    $this->actingAs($user)
        ->get(route('stories'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('saved.templateId', 'roxo-profundo')
            ->where('saved.data.title', 'Horários da Semana'));
});

test('sem horários salvos o prop saved é nulo', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('stories'))
        ->assertInertia(fn (Assert $page) => $page->where('saved', null));
});

test('imagem personalizada é decodificada e salva no disco', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    // 1x1 JPEG em base64.
    $jpeg = base64_encode(base64_decode(
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAAv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AvwA//9k='
    ));

    $this->actingAs($user)
        ->put(route('stories.update'), storyPayload([
            'template_id' => 'custom',
            'custom' => [
                'image' => 'data:image/jpeg;base64,'.$jpeg,
                'textMode' => 'light',
            ],
        ]))
        ->assertRedirect();

    $setting = $user->storySetting()->firstOrFail();

    expect($setting->custom_image_path)->not->toBeNull();
    expect($setting->custom_text_mode)->toBe('light');
    Storage::disk('public')->assertExists($setting->custom_image_path);
});

test('remover a imagem apaga o arquivo do disco', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    Storage::disk('public')->put('story-templates/old.jpg', 'binary');
    $user->storySetting()->create([
        'data' => storyPayload()['data'],
        'template_id' => 'custom',
        'custom_image_path' => 'story-templates/old.jpg',
        'custom_text_mode' => 'light',
    ]);

    $this->actingAs($user)
        ->put(route('stories.update'), storyPayload(['template_id' => 'lilas-floral']))
        ->assertRedirect();

    Storage::disk('public')->assertMissing('story-templates/old.jpg');
    expect($user->storySetting()->firstOrFail()->custom_image_path)->toBeNull();
});
