<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStoryRequest;
use App\Http\Requests\UpdateStoryRequest;
use App\Models\Story;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StoryController extends Controller
{
    public function index(Request $request): Response
    {
        $stories = $request->user()->stories()
            ->latest('updated_at')
            ->get()
            ->map(fn (Story $story): array => $story->toFrontendArray())
            ->all();

        return Inertia::render('stories/index', [
            'stories' => $stories,
        ]);
    }

    public function store(StoreStoryRequest $request): RedirectResponse
    {
        $story = new Story($this->attributesFrom($request));
        $story->user()->associate($request->user());

        if ($request->hasFile('image')) {
            $story->image_path = $this->storeImage($request->file('image'));
        }

        $story->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Story salvo.')]);

        return back();
    }

    public function update(UpdateStoryRequest $request, Story $story): RedirectResponse
    {
        $story->fill($this->attributesFrom($request));

        if ($request->hasFile('image')) {
            $this->deleteImage($story->getOriginal('image_path'));
            $story->image_path = $this->storeImage($request->file('image'));
        } elseif ($story->template_id !== 'custom') {
            $this->deleteImage($story->getOriginal('image_path'));
            $story->image_path = null;
        }

        $story->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Story atualizado.')]);

        return back();
    }

    public function destroy(Story $story): RedirectResponse
    {
        Gate::authorize('delete', $story);

        $this->deleteImage($story->image_path);
        $story->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Story removido.')]);

        return back();
    }

    /**
     * Atributos persistíveis a partir da request validada.
     *
     * @return array{title: string, content: array<string, mixed>, template_id: string, text_mode: string|null}
     */
    protected function attributesFrom(StoreStoryRequest $request): array
    {
        $validated = $request->validated();

        return [
            'title' => $validated['title'],
            'content' => $validated['content'],
            'template_id' => $validated['template_id'],
            'text_mode' => $validated['template_id'] === 'custom'
                ? ($validated['text_mode'] ?? 'dark')
                : null,
        ];
    }

    protected function storeImage(UploadedFile $file): string
    {
        return $file->store('story-templates', 'public');
    }

    protected function deleteImage(?string $path): void
    {
        if ($path !== null && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
