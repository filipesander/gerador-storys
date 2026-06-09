<?php

namespace Database\Factories;

use App\Models\Story;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Story>
 */
class StoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = 'Horários da Semana';

        return [
            'user_id' => User::factory(),
            'title' => $title,
            'content' => [
                'mode' => 'semana',
                'title' => $title,
                'weekSlots' => [
                    ['id' => (string) Str::uuid(), 'weekday' => 'terca', 'times' => ['08:00']],
                ],
                'date' => now()->toDateString(),
                'dayTimes' => ['08:00'],
            ],
            'template_id' => 'lilas-floral',
            'image_path' => null,
            'text_mode' => null,
        ];
    }

    /**
     * Story com imagem custom enviada pelo usuário.
     */
    public function withCustomImage(): static
    {
        return $this->state(fn (): array => [
            'template_id' => 'custom',
            'image_path' => 'story-templates/'.Str::random(12).'.jpg',
            'text_mode' => 'dark',
        ]);
    }
}
