#!/usr/bin/env node
// Cowl.js – Vigilante do C Otimizado com Logs Aprimorados (UTF-8 no Windows)
//
// ATENÇÃO:
// 1) package.json deve ter: { "type": "module" }
// 2) Instale dependências com: npm install chokidar yargs chalk ora

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawnSync, spawn } from 'child_process';
import chokidar from 'chokidar';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import ora from 'ora';

// — Configurações Globais —
let silentMode = false;
const PLATFORM = os.platform();

// — Timestamp para logs —
const timestamp = () => new Date().toLocaleTimeString();

// — Funções de log —
const log = {
  info: msg  => !silentMode && console.log(chalk.cyan(`[${timestamp()}] [INFO]`), msg),
  warn: msg  => !silentMode && console.warn(chalk.yellow(`[${timestamp()}] [WARN]`), msg),
  error: msg => console.error(chalk.red(`[${timestamp()}] [ERROR]`), msg),
  success: msg => !silentMode && console.log(chalk.green(`[${timestamp()}] [SUCESSO]`), msg),
};

// — Forçar UTF-8 no Windows —
if (PLATFORM === 'win32') {
  spawn('cmd', ['/c', 'chcp', '65001'], { stdio: 'ignore', shell: true });
}

// — Verifica se comando existe —
function hasCommand(cmd) {
  const whichCmd = PLATFORM === 'win32' ? 'where' : 'which';
  const result = spawnSync(whichCmd, [cmd], { stdio: 'ignore' });
  return result.status === 0;
}

// — Instalação no Windows via Chocolatey —
function ensureWindowsDependencies() {
  log.info('Verificando ambiente Windows...');
  if (!hasCommand('choco')) {
    log.warn('Chocolatey não encontrado. Instalando Chocolatey...');
    console.log(chalk.blue(`
Passo a passo para instalar Chocolatey:
1) Abra PowerShell como Administrador
2) Execute:
   Set-ExecutionPolicy Bypass -Scope Process -Force
   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
`));
    process.exit(1);
  } else {
    log.success('Chocolatey detectado. Instalando MinGW...');
    console.log(chalk.blue('Executando: choco install mingw -y'));
    spawnSync('choco', ['install', 'mingw', '-y'], { stdio: 'inherit', shell: true });
    log.success('MinGW instalado.');
    process.exit(0);
  }
}

// — Localizar compilador e instruções —
async function findCompiler() {
  const candidates = PLATFORM === 'darwin' ? ['clang', 'gcc'] : ['gcc'];
  for (const cmd of candidates) {
    if (hasCommand(cmd)) {
      log.info(`Compilador encontrado: ${cmd}`);
      return cmd;
    }
  }
  if (PLATFORM === 'win32') {
    ensureWindowsDependencies();
  }
  log.error('Nenhum compilador encontrado. Instale um compilador C:');
  if (PLATFORM === 'darwin') console.log(chalk.blue('brew install llvm')); 
  else console.log(chalk.blue('sudo apt update && sudo apt install -y build-essential'));
  process.exit(1);
}

// — Resolução de fonte e saída —
async function resolveSource(src) {
  if (src) {
    const file = src.endsWith('.c') ? src : `${src}.c`;
    await fs.access(file).catch(() => { log.error(`Arquivo não existe: ${file}`); process.exit(1); });
    log.info(`Fonte especificada: ${file}`);
    return path.resolve(file);
  }
  const list = (await fs.readdir('.')).filter(f => f.endsWith('.c'));
  if (!list.length) { log.error('Nenhum .c encontrado no diretório atual.'); process.exit(1); }
  log.info(`Fonte detectada: ${list[0]}`);
  return path.resolve(list[0]);
}

function resolveOutput(out) {
  let name = out;
  if (PLATFORM === 'win32' && !name.endsWith('.exe')) name += '.exe';
  log.info(`Executável: ${name}`);
  return path.resolve(name);
}

// — Lógica principal —
async function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Uso: $0 [--src <file>] [--out <name>] [--delay <ms>] [--silent]')
    .option('src',    { alias: 's', describe: 'Arquivo fonte .c', type: 'string' })
    .option('out',    { alias: 'o', describe: 'Nome do executável', default: 'app', type: 'string' })
    .option('delay',  { alias: 'd', describe: 'Delay após build (ms)', default: 100, type: 'number' })
    .option('silent', { describe: 'Modo silencioso', type: 'boolean', default: false })
    .help('h').alias('h', 'help')
    .argv;

  silentMode = argv.silent;
  const SRC   = await resolveSource(argv.src);
  const OUT   = resolveOutput(argv.out);
  const DELAY = argv.delay;
  const COMP  = await findCompiler();

  let building = false, child = null;

  // — Teclado —
  function enableInput() {
    if (!process.stdin.isTTY) return;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', data => {
      const key = data.toString();
      if (key === '\u0003') { child?.kill(); process.exit(0); }
      if (!building && !child && key.toLowerCase() === 'r') compileAndRun();
    });
  }
  function disableInput() {
    process.stdin.setRawMode(false);
    process.stdin.removeAllListeners('data');
  }

  // — Compile & Run —
  async function compileAndRun() {
    if (building) return;
    building = true;
    if (child) { child.kill(); child = null; }

    const spinner = ora({ text: `Compilando ${path.basename(SRC)}`, spinner: 'dots' }).start();
    const build = spawn(COMP, [SRC, '-o', OUT], { stdio: 'inherit' });

    build.on('exit', async code => {
      spinner.stop();
      building = false;
      if (code === 0) {
        log.success('Build concluído!');
        await new Promise(r => setTimeout(r, DELAY));
        await runExecutable();
      } else {
        log.error(`Falha no build (${code})`);
      }
    });
  }

  function runExecutable() {
    return new Promise(resolve => {
      disableInput();
      log.info(`Executando ${path.basename(OUT)}`);
      console.log(chalk.gray('─'.repeat(40)));
      child = spawn(OUT, { stdio: 'inherit', env: { ...process.env, LANG: 'en_US.UTF-8' } });
      child.on('exit', (code, signal) => {
        console.log(chalk.gray('─'.repeat(40)));
        log.info(code != null ? `Programa finalizado (${code})` : `Sinal ${signal}`);
        child = null;
        enableInput();
        resolve();
      });
    });
  }

  // — Watcher para .c —
  const watcher = chokidar.watch(path.dirname(SRC)||'.', {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 }
  });
  watcher.on('change', fp => {
    if (fp.endsWith('.c')) {
      log.info(`Alteração em ${path.basename(fp)}: forçando rebuild.`);
      if (child) { log.warn('Encerrando execução atual...'); child.kill(); }
      compileAndRun();
    }
  });
  watcher.on('error', err => { log.error(err.message); process.exit(1); });

  // — Banner UI —
  console.clear();
  console.log(chalk.magenta.bold(`
    ██████╗ ██████╗ ██╗     ██╗██╗
    ██╔════╝██╔═══██╗██║     ██║██║
    ██║     ██║   ██║██║ █╗ ██║██║
    ██║     ██║   ██║██║███╗██║██║
    ╚██████╗╚██████╔╝╚███╔███╔╝███████╗
     ╚═════╝ ╚═════╝  ╚══╝╚══╝ ╚══════╗
  `));
  console.log(chalk.bold.yellow('        🦉  Cowl - Vigilante do C  🦉'));
  console.log(chalk.gray('='.repeat(50)));
  log.info(`Delay após build: ${DELAY}ms`);
  console.log(chalk.gray('='.repeat(50)));
  console.log(chalk.yellow('Controles: R → rebuild manual | Ctrl+C → sair'));

  // — Start —
  enableInput();
  await compileAndRun();
}

main().catch(err => { log.error('Erro fatal:'); console.error(err); process.exit(1); });
