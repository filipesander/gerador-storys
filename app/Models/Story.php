<?php

namespace App\Models;

use Database\Factories\StoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable(['title', 'content', 'template_id', 'image_path', 'text_mode'])]
class Story extends Model
{
    /** @use HasFactory<StoryFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Estrutura consumida pelo frontend (Inertia).
     *
     * @return array{
     *     id: int,
     *     title: string,
     *     content: array<string, mixed>,
     *     templateId: string,
     *     custom: array{image: string, textMode: string}|null,
     *     updatedAt: string|null
     * }
     */
    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'templateId' => $this->template_id,
            'custom' => $this->image_path ? [
                'image' => Storage::disk('public')->url($this->image_path),
                'textMode' => $this->text_mode ?? 'dark',
            ] : null,
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
