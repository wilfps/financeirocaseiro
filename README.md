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

## Banco de dados provisorio com Supabase

O app ja esta preparado para usar Supabase. Enquanto as variaveis abaixo nao forem configuradas, ele continua no modo local do navegador.

### 1. Criar projeto

1. Acesse https://supabase.com/.
2. Crie um projeto gratuito.
3. Entre em SQL Editor.
4. Copie e execute todo o conteudo de `supabase-schema.sql`.

Para facilitar o prototipo, em Authentication > Providers > Email, desative temporariamente a confirmacao obrigatoria de email. Depois, em uma versao mais madura, ela pode ser ativada com fluxo de email completo.

### 2. Pegar as chaves

No Supabase, va em Project Settings > API e copie:

- Project URL
- anon public key

### 3. Configurar na Vercel

No projeto da Vercel, va em Settings > Environment Variables e crie:

```txt
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public
```

Depois clique em Redeploy no ultimo deploy.

### 4. Como testar

Quando o banco estiver conectado, a tela de login mostra:

```txt
Banco Supabase conectado.
```

Ai os cadastros, senhas, boletos e lancamentos ficam salvos fora do navegador.

## Seguranca basica aplicada

- A chave usada no frontend e apenas a publishable/anon key do Supabase.
- Row Level Security fica ativo nas tabelas.
- Usuario comum so le seus proprios lancamentos e boletos.
- Cadastro pelo site sempre cria conta normal.
- Criacao de ADM pelo frontend foi bloqueada.
- Headers de seguranca foram adicionados em `vercel.json`.

Para transformar uma conta em ADM, rode manualmente no SQL Editor trocando o email:

```sql
update public.profiles
set role = 'admin'
where email = 'seu-email@exemplo.com';
```

Depois saia e entre de novo no site para carregar o menu ADM.

## Proximos passos para virar produto real

1. Criar repositorio no GitHub.
2. Publicar o frontend na Vercel ou Netlify.
3. Criar projeto no Supabase.
4. Trocar `localStorage` por banco real com usuarios.
5. Adicionar leitura real de comprovantes com OCR/IA.
6. Conectar uma API/RSS de noticias financeiras.
7. Criar regras de seguranca para dados financeiros de cada usuario.
