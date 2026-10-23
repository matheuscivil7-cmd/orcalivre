# OrçaLivre

Orçamento de obras gratuito: planilha por etapas, subetapas e serviços, composições do SINAPI
(27 estados, não desonerado, desonerado e sem encargos complementares) e do CDHU, extração de
insumos pelas composições, curva ABC, indicadores, BDI (TCU), cronograma físico-financeiro e
relatórios em PDF e Excel.

## Como está montado

| Parte | Onde fica | O que faz |
|---|---|---|
| App | `index.html` (GitHub Pages) | Interface completa; roda no navegador |
| Bases de preços | `dados/` | Arquivos gerados pelo robô, servidos pelo próprio site |
| Robô | `robo/atualizar_sinapi.py` + `.github/workflows/atualizar-bases.yml` | Baixa o SINAPI direto da Caixa, confere e publica |
| Contas e orçamentos | Supabase (`supabase.sql`) | Cadastro aberto; cada usuário vê só os próprios orçamentos |

## Robô do SINAPI

- Roda sozinho todo dia do 3 ao 25 de cada mês, às 9h de Brasília. Quando a Caixa publica um mês novo,
  ele baixa o pacote XLSX oficial, gera os arquivos e publica no site. Guarda os últimos 12 meses.
- Antes de publicar, recalcula as composições de SP pelo analítico. Se menos de 90% fecharem com o custo
  oficial, ou se o layout da planilha mudar, ele para com erro e não altera nada.
- Para rodar na hora: aba **Actions › Atualizar bases de preços › Run workflow**.

## Configuração (uma vez)

1. No Supabase, rode `supabase.sql` no SQL Editor.
2. Em `config.js`, preencha `supabaseUrl` e `supabaseAnonKey` (Project Settings › API).
3. Em Supabase › Authentication › URL Configuration, use o endereço do site como Site URL.

Fontes: SINAPI – Caixa Econômica Federal (caixa.gov.br/sinapi); CDHU – Boletim Referencial de Custos.
