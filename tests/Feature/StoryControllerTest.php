<?php

use App\Models\Story;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function crudStoryPayload(array $overrides = []): array
{
    return array_replace_recursive([
        'title' => 'Horários da Semana',
        'content' => [
            'mode' => 'semana',
            'title' => 'Horários da Semana',
            'weekSlots' => [
                ['id' => 'a', 'weekday' => 'terca', 'times' => ['08:00']],
            ],
            'date' => '2026-06-09',
            'dayTimes' => ['08:00'],
        ],
        'template_id' => 'lilas-floral',
    ], $overrides);
}

test('visitantes não conseguem criar stories', function () {
    $this->post(route('stories.store'), crudStoryPayload())->assertRedirect(route('login'));
});

test('a página devolve apenas os stories do usuário autenticado', function () {
    $user = User::factory()->create();
    Story::factory()->count(2)->for($user)->create();
    Story::factory()->create(); // de outro usuário

    $this->actingAs($user)
        ->get(route('stories'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('stories/index')
            ->has('stories', 2));
});

test('usuário cria um story no banco', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('stories.store'), crudStoryPayload(['title' => 'Meu story']))
        ->assertRedirect();

    $story = Story::where('user_id', $user->id)->firstOrFail();

    expect($story->title)->toBe('Meu story');
    expect($story->content['weekSlots'][0]['times'])->toBe(['08:00']);
    expect($story->template_id)->toBe('lilas-floral');
});

test('usuário pode criar vários stories', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('stories.store'), crudStoryPayload(['title' => 'Primeiro']));
    $this->actingAs($user)->post(route('stories.store'), crudStoryPayload(['title' => 'Segundo']));

    expect(Story::where('user_id', $user->id)->count())->toBe(2);
});

test('story com imagem custom faz upload do arquivo', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('stories.store'), crudStoryPayload([
            'template_id' => 'custom',
            'text_mode' => 'light',
            'image' => UploadedFile::fake()->image('story.jpg', 1080, 1920),
        ]))
        ->assertRedirect();

    $story = Story::where('user_id', $user->id)->firstOrFail();

    expect($story->image_path)->not->toBeNull();
    expect($story->text_mode)->toBe('light');
    Storage::disk('public')->assertExists($story->image_path);
});

test('imagem é obrigatória ao criar story custom', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('stories.store'), crudStoryPayload(['template_id' => 'custom']))
        ->assertSessionHasErrors('image');
});

test('usuário atualiza o próprio story', function () {
    $user = User::factory()->create();
    $story = Story::factory()->for($user)->create();

    $this->actingAs($user)
        ->put(route('stories.update', $story), crudStoryPayload(['title' => 'Atualizado']))
        ->assertRedirect();

    expect($story->refresh()->title)->toBe('Atualizado');
});

test('usuário não pode atualizar story de outro', function () {
    $user = User::factory()->create();
    $story = Story::factory()->create(); // outro dono

    $this->actingAs($user)
        ->put(route('stories.update', $story), crudStoryPayload(['title' => 'Invasão']))
        ->assertForbidden();

    expect($story->refresh()->title)->not->toBe('Invasão');
});

test('trocar template custom para liso remove a imagem do disco', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    Storage::disk('public')->put('story-templates/old.jpg', 'binary');
    $story = Story::factory()->for($user)->create([
        'template_id' => 'custom',
        'image_path' => 'story-templates/old.jpg',
        'text_mode' => 'light',
    ]);

    $this->actingAs($user)
        ->put(route('stories.update', $story), crudStoryPayload(['template_id' => 'lavanda-liso']))
        ->assertRedirect();

    Storage::disk('public')->assertMissing('story-templates/old.jpg');
    expect($story->refresh()->image_path)->toBeNull();
});

test('usuário exclui o próprio story', function () {
    $user = User::factory()->create();
    $story = Story::factory()->for($user)->create();

    $this->actingAs($user)
        ->delete(route('stories.destroy', $story))
        ->assertRedirect();

    expect(Story::find($story->id))->toBeNull();
});

test('usuário não pode excluir story de outro', function () {
    $user = User::factory()->create();
    $story = Story::factory()->create(); // outro dono

    $this->actingAs($user)
        ->delete(route('stories.destroy', $story))
        ->assertForbidden();

    expect(Story::find($story->id))->not->toBeNull();
});
