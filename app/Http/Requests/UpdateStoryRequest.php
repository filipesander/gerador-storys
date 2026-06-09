<?php

namespace App\Http\Requests;

class UpdateStoryRequest extends StoreStoryRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('story'));
    }

    /**
     * Na edição a imagem é opcional — quando ausente, mantemos a já salva.
     *
     * @return array<int, mixed>
     */
    protected function imageRules(): array
    {
        return [
            'nullable',
            'image',
            'mimes:jpeg,png,webp',
            'max:10240',
            'dimensions:min_width=600,min_height=1066',
        ];
    }
}
