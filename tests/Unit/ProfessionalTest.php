<?php

use App\Support\Professional;

it('monta a profissional a partir da configuração', function () {
    $professional = Professional::fromConfig('gaby', [
        'label' => 'Gaby',
        'sheet_id' => 'planilha-gaby',
        'sheet_gid' => 4242,
    ]);

    expect($professional->key)->toBe('gaby')
        ->and($professional->label)->toBe('Gaby')
        ->and($professional->sheetId)->toBe('planilha-gaby')
        ->and($professional->sheetGid)->toBe('4242');
});

it('trata gid vazio como "descobrir automaticamente"', function () {
    $vazio = Professional::fromConfig('mika', ['sheet_id' => 'planilha-mika', 'sheet_gid' => '']);
    $ausente = Professional::fromConfig('mika', ['sheet_id' => 'planilha-mika']);

    expect($vazio->sheetGid)->toBeNull()
        ->and($ausente->sheetGid)->toBeNull()
        ->and($ausente->label)->toBe('Mika'); // sem label, usa a chave capitalizada
});

it('expõe ao front apenas chave e nome, nunca a planilha', function () {
    $professional = Professional::fromConfig('thay', [
        'label' => 'Thay',
        'sheet_id' => 'planilha-secreta',
        'sheet_gid' => '1',
    ]);

    expect($professional->toArray())->toBe(['key' => 'thay', 'label' => 'Thay']);
});
