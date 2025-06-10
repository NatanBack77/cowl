<p align="center">
  <img src="https://raw.githubusercontent.com/NatanBack77/Cowl/main/assets/logo.png" alt="Logo do Cowl" width="200" />
</p>

<h1 align="center">
  <img src="https://img.shields.io/badge/Bash-Cowl-4EAA25?style=for-the-badge&logo=gnu-bash&logoColor=white" alt="Nome estilizado como Bash">
  <img src="https://img.shields.io/badge/JavaScript-Cowl-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Feito com JavaScript">
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@natabael/cowl"><img src="https://img.shields.io/npm/v/@natabael/cowl.svg" alt="NPM version"></a>
  <a href="https://opencollective.com/cowl/backers"><img src="https://opencollective.com/cowl/backers/badge.svg" alt="Backers"></a>
  <a href="https://opencollective.com/cowl/sponsors"><img src="https://opencollective.com/cowl/sponsors/badge.svg" alt="Sponsors"></a>
</p>

# cowl

CLI para monitorar, compilar e executar código C automaticamente. Inspirado na coruja vigilante.

## 📦 Instalação

```bash
# Instalação global via npm
npm install -g @natabael/cowl
```

Ou, para instalar localmente:

```bash
npm install @natabael/cowl
```

## 🚀 Uso

```bash
# Executa o watcher com padrões:
cowl

# Especifica arquivo-fonte e nome do executável:
cowl --src=hello.c --out=hello_app
```

### Opções

| Flag           | Alias | Descrição                                 | Default |
| -------------- | ----- | ----------------------------------------- | ------- |
| `--src <path>` | `-s`  | Arquivo C a ser monitorado                | `app.c` |
| `--out <name>` | `-o`  | Nome do executável compilado              | `app`   |
| `--delay <ms>` | `-d`  | Atraso em milissegundos antes de executar | `100`   |
| `--help`       |       | Exibe ajuda e opções disponíveis          |         |

## ⚙️ Variáveis de Ambiente

Você também pode configurar via env:

```bash
export C_SOURCE_FILE=mycode.c
export C_EXECUTABLE_NAME=mybin
export EXEC_DELAY_MS=200
cowl
```

## 📄 Configuração de Release (Semantic Release)

Este projeto utiliza **Semantic Release** para automatizar versões, CHANGELOG e tags no GitHub.

1. Commit com **Conventional Commits** (`feat:`, `fix:`, `docs:` etc.)
2. Push em branches `main`, `develop` ou `release/*`
3. GitHub Actions executa `npx semantic-release` e:

   * Analisa commits (`@semantic-release/commit-analyzer`)
   * Gera notas de release (`@semantic-release/release-notes-generator`)
   * Atualiza `CHANGELOG.md` (`@semantic-release/changelog`)
   * Cria release no GitHub (`@semantic-release/github`)
   * Faz commit de `CHANGELOG.md`, `package.json` e `Cowl.js` (`@semantic-release/git`)

## 🛠️ Desenvolvimento

```bash
# Instala dependências dev e roda watcher localmente
npm install
npm run dev
```

## 📝 Licença

MIT © Natanael Marcelino da Silva Vieira
