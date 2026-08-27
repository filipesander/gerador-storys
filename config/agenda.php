<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Profissional padrão
    |--------------------------------------------------------------------------
    |
    | Chave usada quando a requisição não informa (nem a sessão lembra) qual
    | agenda deve ser exibida.
    |
    */

    'default' => env('AGENDA_DEFAULT', 'thay'),

    'cache_seconds' => (int) env('AGENDA_CACHE_SECONDS', 60),

    /*
    | Por quanto tempo guardamos o gid da aba de agendamentos descoberto
    | automaticamente. Abas mudam muito raramente, então o TTL é longo.
    */

    'tab_cache_seconds' => (int) env('AGENDA_TAB_CACHE_SECONDS', 86400),

    /*
    |--------------------------------------------------------------------------
    | Profissionais
    |--------------------------------------------------------------------------
    |
    | Cada profissional tem a própria planilha do Google. Quando "sheet_gid"
    | fica nulo, a aba de agendamentos é descoberta automaticamente pelo
    | App\Services\SheetTabResolver (use `php artisan agenda:tabs` para
    | descobrir o gid e fixá-lo no .env).
    |
    | A planilha precisa estar compartilhada como "qualquer pessoa com o link
    | pode ver" — sem isso o Google devolve 401 e a agenda não carrega.
    |
    */

    'professionals' => [

        'thay' => [
            'label' => env('AGENDA_THAY_LABEL', 'Thay'),
            'sheet_id' => env('AGENDA_THAY_SHEET_ID', '1KZnWxGHmy3Mtn-1ZPDU0Lm1Q91MyVyI9xlqc-Z9TL48'),
            'sheet_gid' => env('AGENDA_THAY_SHEET_GID', '614191594'),
        ],

        'gaby' => [
            'label' => env('AGENDA_GABY_LABEL', 'Gaby'),
            'sheet_id' => env('AGENDA_GABY_SHEET_ID', '1NqeAgIR3CuNLwn40FNDu_gAfMWzIvAZpZiLnx2QG2MU'),
            'sheet_gid' => env('AGENDA_GABY_SHEET_GID', '1221632543'),
        ],

        'mika' => [
            'label' => env('AGENDA_MIKA_LABEL', 'Mika'),
            'sheet_id' => env('AGENDA_MIKA_SHEET_ID', '1EpIgFQT1QQhmzAxc_HHZO7Vx2VQfbmmYkW4HCIuBVEM'),
            'sheet_gid' => env('AGENDA_MIKA_SHEET_GID', '1555086347'),
        ],

    ],

];
