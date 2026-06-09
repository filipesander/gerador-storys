<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreStoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * O conteúdo do story trafega como string JSON (junto com o upload
     * multipart). Decodificamos antes de validar para aplicar as regras
     * aninhadas normalmente.
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('content'))) {
            $decoded = json_decode($this->input('content'), true);

            $this->merge(['content' => is_array($decoded) ? $decoded : []]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'content' => ['required', 'array'],
            'content.mode' => ['required', 'in:semana,dia'],
            'content.title' => ['required', 'string', 'max:120'],
            'content.weekSlots' => ['present', 'array'],
            'content.weekSlots.*.id' => ['required', 'string', 'max:64'],
            'content.weekSlots.*.weekday' => ['required', 'in:segunda,terca,quarta,quinta,sexta,sabado,domingo'],
            'content.weekSlots.*.times' => ['present', 'array'],
            'content.weekSlots.*.times.*' => ['string', 'max:5'],
            'content.date' => ['nullable', 'string', 'max:10'],
            'content.dayTimes' => ['present', 'array'],
            'content.dayTimes.*' => ['string', 'max:5'],
            'template_id' => ['required', 'string', 'max:60'],
            'text_mode' => ['nullable', 'in:light,dark'],
            'image' => $this->imageRules(),
        ];
    }

    /**
     * Regras do upload de imagem. Na criação a imagem é obrigatória
     * apenas para o template custom.
     *
     * @return array<int, mixed>
     */
    protected function imageRules(): array
    {
        return [
            'required_if:template_id,custom',
            'image',
            'mimes:jpeg,png,webp',
            'max:10240',
            'dimensions:min_width=600,min_height=1066',
        ];
    }
}
