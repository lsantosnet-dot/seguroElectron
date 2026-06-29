# Apólice — Gestão de Seguros (Desktop)

App **nativo de Windows** para corretores de seguros: clientes, apólices, cotações
multi-seguradora, parcelas, renovações, sinistros, documentos, relacionamento,
agenda de vencimentos, metas e backup. Tema escuro com verde financeiro.

Esta é a versão **desktop** (Electron + SQLite) do app web original. Mesmas
funcionalidades, arquitetura diferente: roda 100% local, sem nuvem, sem login
em servidor.

**Stack:** Electron · React 19 · TypeScript · Tailwind CSS v4 ·
`better-sqlite3` (banco local) · electron-vite (build) · electron-builder
(instalador + auto-update) · electron-updater (GitHub).

---

## Funcionalidades

- **Dashboard gerencial** (Executivo/Operacional): KPIs de carteira, comissão
  estimada, seguros a vencer, parcelas a cobrar, comissão por mês e meta do mês.
- **Clientes**: lista em cards com tags, cadastro/edição e detalhe com abas.
- **Detalhe do cliente**: Apólices (com parcelas), Cotações, Relacionamento,
  Sinistros e Documentos (upload de arquivos/PDF).
- **Cotação multi-seguradora** (assistente em 3 passos): cliente → comparar
  propostas (com PDF e destaque do menor preço) → oficializar, gerando a apólice
  e as parcelas automaticamente.
- **Parcelas**: marcar como paga; status pendente/atrasada/paga.
- **@mail**: botões que abrem o e-mail padrão já preenchido (renovação/parcela).
- **Agenda** de vencimentos e renovações, agrupada por prazo.
- **Sinistros** com histórico e atualização de status.
- **Metas mensais** de faturamento.
- **Busca global** (cliente, apólice, seguradora).
- **Backup**: exportação e importação de toda a base em JSON.
- **Trava de acesso local** por PIN/senha (definida na primeira execução).
- **Atualização automática** via GitHub (avisa quando há nova versão).

---

## Onde ficam os dados

O banco e os arquivos enviados ficam **fora da pasta do app**, então **não são
perdidos ao atualizar de versão**:

```
%APPDATA%\apolice-desktop\data\apolice.db     # banco SQLite
%APPDATA%\apolice-desktop\data\files\...       # documentos e PDFs de cotação
```

Backup: use a tela **Backup** para exportar/importar tudo em JSON.

---

## Desenvolvimento

Pré-requisitos: **Node.js 20+** e Git.

```bash
npm install            # instala dependências
npm run dev            # roda o app em modo desenvolvimento (HMR)
```

> O `better-sqlite3` é um módulo nativo. O `postinstall`
> (`electron-builder install-app-deps`) baixa o binário pré-compilado para a
> versão do Electron — **não é necessário** ter o compilador C++ instalado.
> Caso o `npm install` reclame de build nativo, rode:
> `npm install --ignore-scripts && npm run rebuild`.

Scripts úteis:

| Script | O que faz |
| --- | --- |
| `npm run dev` | App em desenvolvimento |
| `npm run build` | Compila main/preload/renderer |
| `npm run typecheck` | Checagem de tipos (main + renderer) |
| `npm run dist` | Gera o instalador Windows (NSIS) sem publicar |
| `npm run publish` | Build + publica o release no GitHub (auto-update) |

---

## Gerar o instalador (distribuição)

```bash
npm run dist
```

O instalador sai em `release\Apolice-Setup-<versão>.exe`. É um instalador
assistido (NSIS, por usuário, sem exigir administrador). Distribua esse `.exe`.

> O app **não é assinado digitalmente**. Ao instalar pela primeira vez, o
> Windows SmartScreen pode exibir um aviso ("Mais informações" → "Executar
> assim mesmo"). Para remover o aviso é necessário um certificado de assinatura
> de código (Code Signing), que pode ser configurado depois.

---

## Atualização automática (auto-update via GitHub)

O app verifica novas versões no **GitHub** ao iniciar (se houver rede) e avisa o
usuário, que decide baixar e instalar.

### 1. Configurar o repositório (uma vez)

Edite o bloco `publish` em [`electron-builder.yml`](electron-builder.yml) e troque
o placeholder pelo seu repositório **público**:

```yaml
publish:
  provider: github
  owner: SEU_USUARIO_GITHUB   # ex.: lsantos-net
  repo: SeguroElectron
```

### 2. Publicar uma nova versão

1. Suba o número da versão em `package.json` (`version`).
2. Crie um token do GitHub com escopo `repo` e exporte como `GH_TOKEN`:
   ```bash
   # PowerShell
   $env:GH_TOKEN = "seu_token"
   npm run publish
   ```
3. Isso gera o instalador e o `latest.yml`, cria um **release** (rascunho) no
   GitHub e anexa os arquivos. Publique o release (deixe de ser rascunho).

Pronto: clientes com a versão antiga verão o aviso de atualização ao abrir o app.

> Alternativa manual: rode `npm run dist` e anexe os arquivos de `release\`
> (`Apolice-Setup-<versão>.exe`, `latest.yml`, `*.blockmap`) a um release do
> GitHub manualmente. O `latest.yml` é o que o app usa para detectar a versão.

---

## Estrutura

```
electron.vite.config.ts        # build (main/preload/renderer)
electron-builder.yml           # empacotamento + NSIS + publish (auto-update)
src/
  shared/                      # tipos, constantes, format, mail (main + renderer)
  main/
    index.ts                   # processo principal (janela, CSP em produção)
    db.ts                      # SQLite (schema/migrations) em userData
    repo.ts                    # consultas + mutações (porte de data.ts/actions.ts)
    storage.ts                 # arquivos (documentos/PDFs) em userData/files
    auth.ts                    # PIN/senha local (hash scrypt)
    updater.ts                 # auto-update (electron-updater + GitHub)
    ipc.ts                     # handlers IPC
  preload/
    index.ts                   # bridge segura (contextBridge -> window.api)
    index.d.ts                 # tipos da API exposta
  renderer/
    src/
      App.tsx                  # rotas (HashRouter) + trava de acesso
      pages/                   # uma página por rota
      components/              # UI (shell, dashboard, cliente, cotação, etc.)
      lib/                     # api (window.api), contexto de refresh, hooks
```

---

## Observações de arquitetura

- **Sem nuvem / sem login de servidor.** O original (Next.js) usava Clerk +
  Supabase multi-usuário; aqui é um app local de usuário único, com trava por
  PIN/senha. Não há `owner_id`.
- **Banco SQLite** acessado apenas no processo `main` (`better-sqlite3`,
  síncrono). O renderer fala com o banco somente via IPC (`window.api`),
  com `contextIsolation` ligado e `nodeIntegration` desligado.
- **Arquivos** (documentos/PDFs) são copiados para `userData/files` e abertos no
  app padrão do sistema (substitui o Supabase Storage).
