# FinFlow

Controle financeiro jovem em React + Vite, preparado para virar PWA instalavel no celular.

## Rodar localmente

```bash
npm install
npm run dev
```

## O que ja existe

- Dashboard com saldo previsto e status verde/amarelo/vermelho.
- Cadastro de ganhos e gastos.
- Forma de pagamento por gasto: Cartao de credito, Pix, Debito ou Dinheiro.
- Cadastro de boletos e marcacao de pago/aberto.
- Aba de IA com upload/foto de comprovante.
- Aba de educacao financeira/noticias em versao inicial.
- Dados salvos no navegador com `localStorage`.
- Manifesto PWA e service worker basico.

## Hospedagem gratuita recomendada

Para a primeira versao, use:

- Frontend/site: Vercel Hobby ou Netlify Free.
- Login, banco e arquivos: Supabase Free.

Fontes oficiais consultadas em 09/05/2026:

- Vercel Hobby: https://vercel.com/docs/accounts/plans/hobby
- Netlify Pricing: https://www.netlify.com/pricing/
- Supabase Pricing: https://supabase.com/pricing

## Proximos passos para virar produto real

1. Criar repositorio no GitHub.
2. Publicar o frontend na Vercel ou Netlify.
3. Criar projeto no Supabase.
4. Trocar `localStorage` por banco real com usuarios.
5. Adicionar leitura real de comprovantes com OCR/IA.
6. Conectar uma API/RSS de noticias financeiras.
7. Criar regras de seguranca para dados financeiros de cada usuario.
