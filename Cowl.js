#!/usr/bin/env node

// Cowl.js - CLI para monitorar, compilar e executar código C automaticamente

/*--------------------------------------------------------------------------
  Banner
---------------------------------------------------------------------------*/
console.log('\x1b[35m');
console.log(' ██████╗ ██████╗ ██╗    ██╗██╗     ');
console.log('██╔════╝██╔═══██╗██║    ██║██║     ');
console.log('██║     ██║   ██║██║ █╗ ██║██║     ');
console.log('██║     ██║   ██║██║███╗██║██║     ');
console.log('╚██████╗╚██████╔╝╚███╔███╔╝███████╗');
console.log(' ╚═════╝ ╚═════╝  ╚══╝╚══╝ ╚══════╝');
console.log('');
console.log('   🦉  Cowl - Vigilante do C  🦉');
console.log('================================');
console.log('\x1b[0m');

/*--------------------------------------------------------------------------
  Imports e Configurações
---------------------------------------------------------------------------*/
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const yargs = require('yargs');

/*--------------------------------------------------------------------------
  Parser de argumentos com yargs
---------------------------------------------------------------------------*/
const argv = yargs
  .usage('Uso: $0 [--src <arquivo>] [--out <nome>] [--delay <ms>]')
  .option('src', {
    alias: 's',
    describe: 'Arquivo C a ser monitorado (se não fornecido, usa o primeiro *.c encontrado)',
    type: 'string'
  })
  .option('out', {
    alias: 'o',
    describe: 'Nome ou caminho do executável compilado',
    type: 'string',
    default: process.env.C_EXECUTABLE_NAME || 'app'
  })
  .option('delay', {
    alias: 'd',
    describe: 'Delay (ms) antes de executar após compilação',
    type: 'number',
    default: Number(process.env.EXEC_DELAY_MS) || 100
  })
  .help('h')
  .alias('h', 'help')
  .argv;

/*--------------------------------------------------------------------------
  Seleção de arquivo-fonte
---------------------------------------------------------------------------*/
let sourceFile = argv.src;
if (!sourceFile) {
  const files = fs.readdirSync(process.cwd()).filter(f => f.endsWith('.c'));
  if (files.length === 0) {
    console.error('[cowl][ERRO] Nenhum arquivo .c encontrado no diretório atual.');
    process.exit(1);
  }
  sourceFile = files[0];
  console.log(`[cowl] Nenhum arquivo especificado. Usando: ${sourceFile}`);
}

/*--------------------------------------------------------------------------
  Constantes de execução
---------------------------------------------------------------------------*/
const C_SOURCE_FILE = path.isAbsolute(sourceFile)
  ? sourceFile
  : path.resolve(process.cwd(), sourceFile);

const C_EXECUTABLE_NAME = argv.out;
const C_EXECUTABLE_PATH = path.isAbsolute(C_EXECUTABLE_NAME)
  ? C_EXECUTABLE_NAME
  : path.resolve(process.cwd(), C_EXECUTABLE_NAME);

const EXEC_DELAY_MS = argv.delay;

// Criar diretório do executável, se necessário
const outDir = path.dirname(C_EXECUTABLE_PATH);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

let cProcess = null;
let isCompiling = false;
let pendingCompilation = false;

/*--------------------------------------------------------------------------
  Funções utilitárias de log
---------------------------------------------------------------------------*/
const logInfo = msg => console.log(`\x1b[32m[cowl]\x1b[0m ${msg}`);
const logError = msg => console.error(`\x1b[31m[cowl][ERRO]\x1b[0m ${msg}`);

/*--------------------------------------------------------------------------
  Validação inicial
---------------------------------------------------------------------------*/
if (!fs.existsSync(C_SOURCE_FILE)) {
  logError(`Arquivo não encontrado: ${C_SOURCE_FILE}`);
  const dirFiles = fs.readdirSync(process.cwd()).filter(f => f.endsWith('.c'));
  if (dirFiles.length > 0) {
    logInfo(`Talvez você tenha querido usar: ${dirFiles.join(', ')}`);
  }
  process.exit(1);
}

logInfo(`Arquivo-fonte: ${C_SOURCE_FILE}`);
logInfo(`Executável: ${C_EXECUTABLE_PATH}`);

/*--------------------------------------------------------------------------
  Tratamento de erros não capturados
---------------------------------------------------------------------------*/
process.on('uncaughtException', err => {
  logError(`Exceção não capturada: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  logError(`Rejeição não tratada: ${reason}`);
  process.exit(1);
});

/*--------------------------------------------------------------------------
  Função: Compilar código C
---------------------------------------------------------------------------*/
function compileC() {
  if (isCompiling) {
    logInfo('Compilação em andamento, agendando nova...');
    pendingCompilation = true;
    return;
  }

  isCompiling = true;
  logInfo(`Compilando: ${C_SOURCE_FILE}`);

  if (cProcess) {
    cProcess.kill();
    cProcess = null;
  }

  exec(`gcc "${C_SOURCE_FILE}" -o "${C_EXECUTABLE_PATH}"`, (err, _, stderr) => {
    isCompiling = false;

    if (err) {
      return logError(`Falha na compilação:\n${stderr}`);
    }

    if (stderr) {
      logInfo(`Avisos:\n${stderr}`);
    }

    logInfo('Compilação concluída.');
    executeC();

    if (pendingCompilation) {
      pendingCompilation = false;
      compileC();
    }
  });
}

/*--------------------------------------------------------------------------
  Função: Executar binário C
---------------------------------------------------------------------------*/
function executeC() {
  if (cProcess) {
    logInfo('Processo em execução, aguardando término...');
    return;
  }

  logInfo(`Executando: ${C_EXECUTABLE_PATH} em ${EXEC_DELAY_MS}ms`);
  setTimeout(() => {
    cProcess = spawn(C_EXECUTABLE_PATH, [], { stdio: 'inherit' });

    cProcess.on('error', err => {
      logError(`Erro ao executar: ${err.message}`);
      cProcess = null;
    });

    cProcess.on('close', code => {
      if (code !== 0) logError(`Saída com código: ${code}`);
      cProcess = null;
    });
  }, EXEC_DELAY_MS);
}

/*--------------------------------------------------------------------------
  Função: Iniciar watcher no arquivo
---------------------------------------------------------------------------*/
function startWatching() {
  logInfo(`Observando: ${C_SOURCE_FILE}`);

  try {
    fs.watch(C_SOURCE_FILE, { persistent: true }, (eventType, filename) => {
      if (eventType === 'change') {
        logInfo(`Alteração detectada: ${filename}`);
        compileC();
      }
    });
  } catch (err) {
    logError(`Não foi possível iniciar o watcher: ${err.message}`);
    process.exit(1);
  }

  compileC(); // Primeira compilação
}

/*--------------------------------------------------------------------------
  Tratamento de SIGINT para encerramento gracioso
---------------------------------------------------------------------------*/
process.on('SIGINT', () => {
  logInfo('Encerrando...');
  if (cProcess) cProcess.kill();
  process.exit(0);
});

// Iniciar
startWatching();
