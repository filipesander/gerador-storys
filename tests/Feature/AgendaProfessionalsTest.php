<?php

use App\Services\AgendaImporter;
use App\Services\ProfessionalRegistry;
use App\Services\SheetTabResolver;
use App\Support\Professional;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Trecho do HTML de /htmlview: é dali que lemos a lista de abas da planilha.
 */
function sheetTabsHtml(): string
{
    return <<<'HTML'
    <html><script>
    items.push({name: "Procedimentos", pageUrl: "https:\/\/docs.google.com\/x?gid=111", gid: "111",initialSheet: ("111" == gid)});items.push({name: "Descri\u00e7\u00f5es", pageUrl: "x", gid: "222",initialSheet: ("222" == gid)});items.push({name: "Agenda antiga", pageUrl: "x", gid: "444",initialSheet: ("444" == gid)});items.push({name: "Agendamento", pageUrl: "x", gid: "333",initialSheet: ("333" == gid)});
    </script></html>
    HTML;
}

function agendaCsv(string $client = 'Virna Santana'): string
{
    return implode("\n", [
        '"Data","Horário","Tempo do serviço","Clientes","Serviço","Status","Aplicação ou Manutenção"',
        '"21/05/2026","08:00","1:30:00","'.$client.'","Volume Inglês 5D","Confirmado","Aplicação"',
    ]);
}

beforeEach(function () {
    config([
        'agenda.default' => 'thay',
        'agenda.professionals' => [
            'thay' => ['label' => 'Thay', 'sheet_id' => 'planilha-thay', 'sheet_gid' => '614191594'],
            'gaby' => ['label' => 'Gaby', 'sheet_id' => 'planilha-gaby', 'sheet_gid' => null],
        ],
    ]);
});

it('ignora profissionais sem planilha configurada', function () {
    config([
        'agenda.professionals' => [
            'thay' => ['label' => 'Thay', 'sheet_id' => 'planilha-thay'],
            'vazia' => ['label' => 'Vazia', 'sheet_id' => ''],
        ],
    ]);

    expect(app(ProfessionalRegistry::class)->all()->keys()->all())->toBe(['thay']);
});

it('cai para a padrão quando a chave pedida não existe', function () {
    config(['agenda.default' => 'gaby']);

    $registry = app(ProfessionalRegistry::class);

    expect($registry->resolve('mika')->key)->toBe('gaby')
        ->and($registry->resolve(null)->key)->toBe('gaby')
        ->and($registry->resolve('thay')->key)->toBe('thay')
        ->and($registry->find('mika'))->toBeNull();
});

it('cai para a primeira profissional quando nem a padrão existe', function () {
    config(['agenda.default' => 'ninguem']);

    expect(app(ProfessionalRegistry::class)->resolve('mika')->key)->toBe('thay');
});

it('usa o gid fixado na configuração sem consultar as abas da planilha', function () {
    Http::fake(['*' => Http::response(agendaCsv())]);

    $thay = app(ProfessionalRegistry::class)->resolve('thay');
    $url = app(AgendaImporter::class)->url($thay);

    expect($url)->toBe('https://docs.google.com/spreadsheets/d/planilha-thay/gviz/tq?tqx=out:csv&gid=614191594');

    Http::assertNothingSent();
});

it('descobre a aba de agendamentos quando o gid não está configurado', function () {
    Http::fake([
        '*htmlview*' => Http::response(sheetTabsHtml()),
        '*gid=444*' => Http::response('"Técnica","Valor"'."\n".'"Volume","R$ 140,00"'),
        '*gid=333*' => Http::response(agendaCsv('Jhessy')),
        '*' => Http::response('nada aqui', 404),
    ]);

    $gaby = app(ProfessionalRegistry::class)->resolve('gaby');
    $appointments = app(AgendaImporter::class)->all($gaby);

    // "Agenda antiga" (444) casa pelo nome mas não tem as colunas da agenda,
    // então a busca continua até "Agendamento" (333).
    expect($appointments)->toHaveCount(1)
        ->and($appointments->first()->client)->toBe('Jhessy');

    Http::assertSent(fn ($request) => str_contains($request->url(), 'planilha-gaby/gviz/tq')
        && str_contains($request->url(), 'gid=333'));
});

it('guarda em cache o gid descoberto para não reler as abas a cada visita', function () {
    Http::fake([
        '*htmlview*' => Http::response(sheetTabsHtml()),
        '*gid=444*' => Http::response('"Técnica","Valor"'."\n".'"Volume","R$ 140,00"'),
        '*gid=333*' => Http::response(agendaCsv()),
        '*' => Http::response('nada aqui', 404),
    ]);

    $resolver = app(SheetTabResolver::class);

    expect($resolver->resolveAgendaGid('planilha-gaby'))->toBe('333')
        ->and(Cache::get('agenda.tab.planilha-gaby'))->toBe('333');

    // htmlview + as duas abas testadas; a segunda chamada sai do cache.
    Http::assertSentCount(3);
    expect($resolver->resolveAgendaGid('planilha-gaby'))->toBe('333');
    Http::assertSentCount(3);
});

it('não relê as abas quando o gid já está em cache', function () {
    Cache::put('agenda.tab.planilha-gaby', '333', 60);

    Http::fake(['*' => Http::response(agendaCsv())]);

    $url = app(AgendaImporter::class)->url(app(ProfessionalRegistry::class)->resolve('gaby'));

    expect($url)->toContain('gid=333');

    Http::assertNothingSent();
});

it('devolve o CSV sem gid quando nenhuma aba serve, em vez de quebrar', function () {
    Http::fake(['*' => Http::response('sem permissão', 401)]);

    $gaby = app(ProfessionalRegistry::class)->resolve('gaby');

    expect(app(AgendaImporter::class)->url($gaby))
        ->toBe('https://docs.google.com/spreadsheets/d/planilha-gaby/gviz/tq?tqx=out:csv');
});

it('mantém um cache de CSV por profissional', function () {
    Http::fake([
        '*planilha-thay*' => Http::response(agendaCsv('Cliente da Thay')),
        '*htmlview*' => Http::response(sheetTabsHtml()),
        '*gid=444*' => Http::response('"Técnica","Valor"'),
        '*gid=333*' => Http::response(agendaCsv('Cliente da Gaby')),
        '*' => Http::response('nada aqui', 404),
    ]);

    $registry = app(ProfessionalRegistry::class);
    $importer = app(AgendaImporter::class);

    $thay = $importer->all($registry->resolve('thay'));
    $gaby = $importer->all($registry->resolve('gaby'));

    expect($thay->first()->client)->toBe('Cliente da Thay')
        ->and($gaby->first()->client)->toBe('Cliente da Gaby')
        ->and(Cache::has('agenda.csv.thay'))->toBeTrue()
        ->and(Cache::has('agenda.csv.gaby'))->toBeTrue();
});

it('o refresh limpa apenas o cache da profissional pedida', function () {
    Http::fake(['*' => Http::response(agendaCsv())]);

    Cache::put('agenda.csv.thay', agendaCsv('Antiga'), 60);
    Cache::put('agenda.csv.gaby', agendaCsv('Outra'), 60);

    $thay = new Professional('thay', 'Thay', 'planilha-thay', '614191594');
    app(AgendaImporter::class)->all($thay, refresh: true);

    expect(Cache::get('agenda.csv.thay'))->not->toContain('Antiga')
        ->and(Cache::get('agenda.csv.gaby'))->toContain('Outra');
});

it('lê os nomes das abas com acento', function () {
    Http::fake(['*htmlview*' => Http::response(sheetTabsHtml())]);

    $tabs = app(SheetTabResolver::class)->tabs('planilha-gaby');

    expect($tabs)->toBe([
        ['gid' => '111', 'name' => 'Procedimentos'],
        ['gid' => '222', 'name' => 'Descrições'],
        ['gid' => '444', 'name' => 'Agenda antiga'],
        ['gid' => '333', 'name' => 'Agendamento'],
    ]);
});

it('o comando agenda:tabs mostra qual aba tem os agendamentos', function () {
    Http::fake([
        '*htmlview*' => Http::response(sheetTabsHtml()),
        '*gid=333*' => Http::response(agendaCsv()),
        '*' => Http::response('"Técnica","Valor"'),
    ]);

    $this->artisan('agenda:tabs gaby')
        ->expectsOutputToContain('AGENDA_GABY_SHEET_GID=333')
        ->assertSuccessful();
});

it('o comando agenda:tabs avisa quando a planilha não está compartilhada', function () {
    Http::fake(['*' => Http::response('sem permissão', 401)]);

    $this->artisan('agenda:tabs gaby')->assertFailed();
});

it('o comando agenda:tabs recusa uma profissional desconhecida', function () {
    $this->artisan('agenda:tabs ninguem')->assertFailed();
});
