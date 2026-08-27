<?php

use App\Services\AgendaImporter;
use App\Services\SheetTabResolver;
use App\Support\Appointment;

it('parseia o CSV em appointments, ignorando linhas vazias e inválidas', function () {
    $csv = implode("\n", [
        '"Data","Horário","Tempo do serviço","Clientes","Serviço","Status","Observações","Clientes interessadas"',
        '"21/05/2026","08:00","1:30:00","Virna Santana","Volume Inglês 5D","Confirmado","",""',
        '"21/05/2026","17:00","0:00:00","Caroline Dias","","Confirmado","",""',
        '"","","","","","","",""',
        '"lixo","x","","","","","",""',
        '"22/05/2026","13:30","3:00:00","Jhessy","Brasileiro Fox Eyes","A confirmar","obs","Maria"',
    ]);

    $appointments = (new AgendaImporter(new SheetTabResolver))->parse($csv);

    expect($appointments)->toHaveCount(3);

    $first = $appointments->first();
    expect($first)->toBeInstanceOf(Appointment::class)
        ->and($first->client)->toBe('Virna Santana')
        ->and($first->durationMinutes)->toBe(90)
        ->and($first->endTime)->toBe('09:30')
        ->and($first->status)->toBe('Confirmado');

    $caroline = $appointments->firstWhere('client', 'Caroline Dias');
    expect($caroline->durationMinutes)->toBe(0)
        ->and($caroline->endTime)->toBe('17:00');

    $jhessy = $appointments->firstWhere('client', 'Jhessy');
    expect($jhessy->durationMinutes)->toBe(180)
        ->and($jhessy->endTime)->toBe('16:30')
        ->and($jhessy->status)->toBe('A confirmar')
        ->and($jhessy->notes)->toBe('obs')
        ->and($jhessy->interested)->toBe('Maria');
});

it('mapeia colunas pelo cabeçalho e lê Aplicação/Manutenção mesmo inserida no meio', function () {
    $csv = implode("\n", [
        '"Data","Horário","Tempo do serviço","Clientes","Serviço ","Status","Aplicação ou Manutenção","Clientes interessadas"',
        '"21/05/2026","08:00","1:30:00","Virna Santana","Volume Inglês 5D","Confirmado","Aplicação","Bia"',
        '"22/05/2026","13:30","2:00:00","Jhessy","Brasileiro","A confirmar","Manutenção",""',
        '"lixo","x","","","","","",""',
    ]);

    $appointments = (new AgendaImporter(new SheetTabResolver))->parse($csv);

    expect($appointments)->toHaveCount(2);

    $virna = $appointments->firstWhere('client', 'Virna Santana');
    expect($virna->type)->toBe('Aplicação')
        ->and($virna->service)->toBe('Volume Inglês 5D') // lido apesar do espaço em "Serviço "
        ->and($virna->interested)->toBe('Bia')
        ->and($virna->notes)->toBe(''); // não há coluna "Observações"

    $jhessy = $appointments->firstWhere('client', 'Jhessy');
    expect($jhessy->type)->toBe('Manutenção');
});
