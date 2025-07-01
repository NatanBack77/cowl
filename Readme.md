<p align="center">
  <img src="https://raw.githubusercontent.com/NatanBack77/Cowl/main/assets/logo.png" alt="Logo do Cowl" width="200"/>
</p>

<h1 align="center">
  <img src="https://img.shields.io/badge/Bash-Cowl-4EAA25?style=for-the-badge&logo=gnu-bash&logoColor=white" alt="Bash Badge">
  <img src="https://img.shields.io/badge/JavaScript-Cowl-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript Badge">
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@natabael/cowl">
    <img src="https://img.shields.io/npm/v/@natabael/cowl.svg" alt="NPM version">
  </a>
  <a href="https://opencollective.com/cowl/backers">
    <img src="https://opencollective.com/cowl/backers/badge.svg" alt="Backers">
  </a>
  <a href="https://opencollective.com/cowl/sponsors">
    <img src="https://opencollective.com/cowl/sponsors/badge.svg" alt="Sponsors">
  </a>
</p>

<h1 align="center">Cowl 🦉</h1>

<p align="center">
  CLI para monitorar, compilar e executar código C automaticamente em **Windows, Linux e macOS**. <br>
  Inspirado na coruja vigilante, que observa e age no momento certo.
</p>


---

## 📦 Instalação

### 🔧 Requisitos

* Node.js v14+ instalado
* No Windows: PowerShell para instalação do Chocolatey

### 🌐 Instalando via npm

```bash
# Globalmente
npm install -g @natabael/cowl

# Local (dentro do projeto)
npm install @natabael/cowl
```

### 🪟 Configuração automática no Windows

Se o Cowl não encontrar um compilador C no Windows, ele verifica o Chocolatey:

* **Sem Chocolatey instalado**: exibe passo a passo para instalar
* **Com Chocolatey instalado**: executa `choco install mingw -y` e encerra

Você pode rodar manualmente também:

```bash
# Para instalar Chocolatey (executar em PowerShell Admin)
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Após instalar Chocolatey, instale MinGW:
choco install mingw -y
```

## 🚀 Uso

```bash
# Executa watcher com padrões:
cowl

# Com fonte e saída personalizados:
cowl --src=meu_codigo.c --out=meu_binario
```

### Controles de teclado

* **Ctrl+C**: encerra o Cowl
* **R** (enquanto não estiver compilando/executando): força rebuild manual

### Opções

| Flag                 | Alias | Descrição                                | Default |
| -------------------- | ----- | ---------------------------------------- | ------- |
| `--src &lt;file&gt;` | `-s`  | Arquivo fonte `.c`                       | `app.c` |
| `--out &lt;name&gt;` | `-o`  | Nome do executável compilado             | `app`   |
| `--delay &lt;ms&gt;` | `-d`  | Atraso (ms) antes de executar após build | `100`   |
| `--silent`           |       | Oculta logs INFO e SUCCESS               | `false` |
| `--help`             | `-h`  | Exibe ajuda e opções                     |         |

## ⚙️ Variáveis de Ambiente

Também é possível usar variáveis de ambiente:

```bash
export C_SOURCE_FILE=mycode.c
export C_EXECUTABLE_NAME=mybin
export EXEC_DELAY_MS=200
cowl
```

## 🛠️ Funcionalidades Principais

* **Watcher inteligente**: observa qualquer `.c` no diretório e força rebuild imediato, mesmo em modo interativo
* **Fallback de compilador**: detecta `gcc`, `clang` ou instala MinGW no Windows via Chocolatey
* **Logs coloridos** e spinner de build para melhor experiência
* **Controles manuais**: rebuild com tecla `R`, encerramento com `Ctrl+C`

## 📄 Release e SemVer

Usa **Semantic Release** para versionamento:

1. Commits seguindo Conventional Commits (`feat:`, `fix:`, `docs:` etc.)
2. Push em `main`/`develop` -> GitHub Actions roda `npx semantic-release`
3. Gera `CHANGELOG.md`, cria release e atualiza tags automaticamente

## 📝 Licença

MIT © Natanael Marcelino da Silva Vieira
