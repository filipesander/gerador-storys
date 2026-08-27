<?php

use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $csv = implode("\n", [
        '"Data","Horário","Tempo do serviço","Clientes","Serviço","Status","Observações","Clientes interessadas"',
        '"21/05/2026","08:00","1:30:00","Virna Santana","Volume Inglês 5D","Confirmado","",""',
    ]);

    Http::fake(['docs.google.com/*' => Http::response($csv, 200, ['Content-Type' => 'text/csv'])]);

    config([
        'agenda.default' => 'thay',
        'agenda.professionals' => [
            'thay' => ['label' => 'Thay', 'sheet_id' => 'planilha-thay', 'sheet_gid' => '111'],
            'gaby' => ['label' => 'Gaby', 'sheet_id' => 'planilha-gaby', 'sheet_gid' => '222'],
            'mika' => ['label' => 'Mika', 'sheet_id' => 'planilha-mika', 'sheet_gid' => '333'],
        ],
    ]);
});

test('visitantes são redirecionados ao login', function () {
    $this->get(route('agenda'))->assertRedirect(route('login'));
});

test('usuário autenticado vê a agenda', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('agenda'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('agenda/index'));
});

test('a página expõe a marca para o export PNG no client', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('agenda'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('brand', 'Thay'));
});

test('a página lista as profissionais e marca a selecionada', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('agenda', ['professional' => 'gaby']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('professional', 'gaby')
            ->where('brand', 'Gaby')
            ->where('professionals', [
                ['key' => 'thay', 'label' => 'Thay'],
                ['key' => 'gaby', 'label' => 'Gaby'],
                ['key' => 'mika', 'label' => 'Mika'],
            ])
            ->etc());
});

test('uma profissional desconhecida cai para a padrão', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('agenda', ['professional' => 'ninguem']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('professional', 'thay'));
});

test('a agenda lembra a última profissional escolhida', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('agenda', ['professional' => 'mika']))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('agenda'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('professional', 'mika'));
});

test('cada profissional lê a própria planilha', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('agenda.exportar', ['professional' => 'mika', 'date' => '2026-05-21']))
        ->assertOk();

    Http::assertSent(fn ($request) => str_contains($request->url(), 'planilha-mika')
        && str_contains($request->url(), 'gid=333'));

    Http::assertNotSent(fn ($request) => str_contains($request->url(), 'planilha-thay'));
});

test('exporta a agenda em PDF', function () {
    $response = $this->actingAs(User::factory()->create())
        ->get(route('agenda.exportar', ['period' => 'dia', 'date' => '2026-05-21']));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf');
});

test('o PDF sai com a profissional no nome do arquivo', function () {
    $response = $this->actingAs(User::factory()->create())
        ->get(route('agenda.exportar', ['professional' => 'gaby', 'period' => 'dia', 'date' => '2026-05-21']));

    $response->assertOk();
    expect($response->headers->get('content-disposition'))
        ->toContain('agenda-gaby-dia-2026-05-21.pdf');
});

test('exporta o PDF mesmo quando a planilha do Google está indisponível', function () {
    Http::fake(['docs.google.com/*' => Http::response('erro', 500)]);

    $response = $this->actingAs(User::factory()->create())
        ->get(route('agenda.exportar', ['period' => 'dia', 'date' => '2026-05-21']));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf');
});

test('exporta o PDF mesmo quando o diretório de fontes do dompdf não existe (deploy novo)', function () {
    $freshFontDir = storage_path('framework/testing/dompdf-fonts-'.uniqid());
    File::deleteDirectory($freshFontDir);

    config([
        'dompdf.options.font_dir' => $freshFontDir,
        'dompdf.options.font_cache' => $freshFontDir,
    ]);

    $response = $this->actingAs(User::factory()->create())
        ->get(route('agenda.exportar', ['period' => 'dia', 'date' => '2026-05-21']));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf');

    File::deleteDirectory($freshFontDir);
});
