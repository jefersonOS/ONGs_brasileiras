-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Configurar os agendamentos (Cron Jobs do Supabase)

-- Lembretes de WhatsApp todo dia às 08:00
SELECT cron.schedule(
    'whatsapp-reminders',
    '0 8 * * *',
    $$
    SELECT net.http_post(
        url := 'https://[PROJECT_ID].supabase.co/functions/v1/reminder-job',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer [SERVICE_ROLE_KEY]')
    )
    $$
);

-- Alertas de IA todo dia às 06:00
SELECT cron.schedule(
    'ai-alerts-analysis',
    '0 6 * * *',
    $$
    SELECT net.http_post(
        url := 'https://[PROJECT_ID].supabase.co/functions/v1/ai-alerts-job',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer [SERVICE_ROLE_KEY]')
    )
    $$
);

-- Depreciação Mensal (Todo dia 1 às 02:00)
SELECT cron.schedule(
    'monthly-depreciation',
    '0 2 1 * *',
    $$
    SELECT net.http_post(
        url := 'https://[PROJECT_ID].supabase.co/functions/v1/depreciation-job',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer [SERVICE_ROLE_KEY]')
    )
    $$
);
