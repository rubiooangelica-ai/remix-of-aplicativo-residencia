# Premium + Mercado Pago

Este documento descreve como ligar o checkout de assinaturas do Mercado Pago ao sistema Premium do ResidênciaPro.

## O que já existe no app

- Plano grátis com limite de 10 questões por dia.
- Plano Premium sem limite diário.
- Admin com acesso Premium automático.
- Tabelas `plans`, `subscriptions` e `subscription_events`.
- Função `meu_status_plano()` para o app consultar o status do usuário.
- Função `tem_acesso_premium()` para regras no banco.
- Edge Function `criar-checkout-premium` criando assinatura recorrente via `POST /preapproval`.
- Edge Function `mercado-pago-webhook` processando eventos de assinatura e pagamento.
- Página `/premium` com botões de assinatura mensal e anual.
- Páginas de retorno: `/premium-sucesso`, `/premium-pendente` e `/premium-cancelado`.
- Página `/minha-assinatura` para o usuário ver plano atual e limite diário.
- Página `/admin-assinaturas` para conceder/cancelar Premium manualmente.

## Preços configurados inicialmente no app

Esses valores estão centralizados em `src/lib/plano.ts` e também no servidor em `supabase/functions/criar-checkout-premium/index.ts`.

- Premium mensal: R$ 29,90/mês.
- Premium anual: R$ 249,90/ano.

O anual equivale a aproximadamente R$ 20,83 por mês, então dá uma sensação boa de desconto sem desvalorizar o produto.

## Variáveis necessárias no Lovable

Configure como secrets server-side, nunca em variável `VITE_` e nunca em arquivo público:

```env
MERCADO_PAGO_ACCESS_TOKEN=access_token_de_teste_ou_producao
MERCADO_PAGO_WEBHOOK_SECRET=um-segredo-longo-aleatorio
SITE_URL=https://seu-app-publicado.lovable.app
```

`SITE_URL` é opcional, mas recomendado. Se não existir, a função usa `https://resident-mentor-ai.lovable.app`.

As variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são usadas pela função de webhook para atualizar assinaturas. No Lovable/Supabase integrado, elas normalmente já existem no ambiente das Edge Functions.

## Fluxo esperado

1. Usuário entra em `/premium`.
2. Clica em `Assinar mensal` ou `Assinar anual`.
3. O app chama `criar-checkout-premium`.
4. A função cria uma assinatura no Mercado Pago com `external_reference=user_id:plano`.
5. A função retorna `init_point` e o usuário é enviado para o checkout de assinatura.
6. Usuário autoriza a assinatura no Mercado Pago.
7. Mercado Pago chama `mercado-pago-webhook`.
8. Webhook consulta a assinatura/pagamento na API oficial do Mercado Pago.
9. Webhook registra o evento em `subscription_events`.
10. Webhook ativa, renova ou cancela o Premium em `subscriptions`.
11. O app passa a liberar recursos Premium para o usuário.

## Estratégia de preço

Minha recomendação para o lançamento é começar com preço fundador:

- Premium fundador mensal: R$ 19,90 ou R$ 24,90.
- Premium fundador anual: R$ 149,90 ou R$ 199,90.

Depois, quando o app tiver Ligas, Simulados, Caderno de erros avançado, Flashcards inteligentes e Progresso avançado, subir para novos usuários:

- Premium mensal: R$ 29,90 a R$ 39,90.
- Premium anual: R$ 249,90 a R$ 349,90.

## Checklist para validar o Freemium no Lovable

1. Entrar com usuário comum, sem assinatura.
2. Abrir `/minha-assinatura` e confirmar que aparece plano grátis.
3. Abrir `/questoes` e confirmar contador `0/10 grátis hoje` dentro da sessão.
4. Responder algumas questões e verificar se o contador aumenta.
5. Tentar ultrapassar 10 questões no dia e confirmar que aparece chamada Premium, não erro técnico.
6. Abrir `/material` e confirmar que dá para ler o começo do resumo, com o restante borrado.
7. Abrir `/ia` e confirmar que usuário grátis vê paywall.
8. Abrir tutor IA dentro de uma questão e confirmar que usuário grátis vê paywall compacto.
9. Entrar com admin e confirmar que aparece `Admin Premium`.
10. Com admin, confirmar que IA, material completo e questões ilimitadas ficam liberados.
11. Abrir `/admin-assinaturas` como admin e testar conceder Premium manualmente para um usuário.
12. Entrar com esse usuário e confirmar que aparece Premium.

## Checklist para testar Mercado Pago

1. Confirmar que `MERCADO_PAGO_ACCESS_TOKEN` está nos secrets do Lovable.
2. Confirmar que `MERCADO_PAGO_WEBHOOK_SECRET` está nos secrets do Lovable.
3. Confirmar que `SITE_URL` aponta para o domínio publicado.
4. Publicar o app.
5. Entrar no app com a conta compradora de teste.
6. Abrir `/premium`.
7. Clicar em plano mensal.
8. Concluir assinatura com conta/cartão de teste.
9. Confirmar retorno para `/premium-sucesso`.
10. Confirmar que uma linha aparece em `subscription_events`.
11. Confirmar que uma linha ativa aparece em `subscriptions`.
12. Entrar em `/minha-assinatura` e verificar se liberou Premium.
13. Testar IA, material completo e mais de 10 questões.
