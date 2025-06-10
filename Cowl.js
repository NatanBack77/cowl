#!/usr/bin/env node

// watcher.js - CLI para monitorar, compilar e executar código C automaticamente

const fs = require('fs');
const { exec, spawn } = require('child_process');
const path = require('path');
const yargs = require('yargs');

// Parser de argumentos CLI com yargs
const argv = yargs
  .option('src', {
    alias: 's',
    describe: 'Arquivo C a ser monitorado',
    type: 'string',
    default: process.env.C_SOURCE_FILE || 'app.c'
  })
  .option('out', {
    alias: 'o',
    describe: 'Nome do executável C compilado',
    type: 'string',
    default: process.env.C_EXECUTABLE_NAME || 'app'
  })
  .option('delay', {
    alias: 'd',
    describe: 'Atraso (ms) antes de executar após compilação',
    type: 'number',
    default: process.env.EXEC_DELAY_MS || 100
  })
  .help()
  .argv;

const C_SOURCE_FILE = argv.src;
const C_EXECUTABLE_NAME = argv.out;
const C_EXECUTABLE_PATH = path.join(process.cwd(), C_EXECUTABLE_NAME);
const EXEC_DELAY_MS = argv.delay;

let cProcess = null;
let isCompiling = false;
let pendingCompilation = false;

// Handlers de erro
process.on('uncaughtException', err => {
  console.error(`\n[ERRO] Exceção não capturada: ${err.message}`);
  err.stack && console.error(err.stack);
  cProcess && cProcess.kill();
});
process.on('unhandledRejection', (reason, promise) => {
  console.error(`\n[ERRO] Rejeição não tratada:`, reason);
  cProcess && cProcess.kill();
});

// Compila o código C
function compileC() {
  if (isCompiling) {
    console.log('[watcher] Compilação em andamento, agendando nova...');
    pendingCompilation = true;
    return;
  }

  isCompiling = true;
  console.log(`\n[watcher] Compilando ${C_SOURCE_FILE}...`);

  if (cProcess) {
    cProcess.on('close', code => {
      console.log(`[watcher] Processo anterior saiu com código ${code}`);
      cProcess = null;
      performCompilation();
    });
    cProcess.kill();
  } else {
    performCompilation();
  }
}

function performCompilation() {
  exec(`gcc ${C_SOURCE_FILE} -o ${C_EXECUTABLE_NAME}`, (error, stdout, stderr) => {
    isCompiling = false;

    if (error) {
      console.error(`[watcher] Erro de compilação:\n${stderr}`);
    } else {
      stderr && console.warn(`[watcher] Avisos:\n${stderr}`);
      console.log(`[watcher] Compilação concluída.`);
      executeC();
    }

    if (pendingCompilation) {
      pendingCompilation = false;
      compileC();
    }
  });
}

// Executa o binário C
function executeC() {
  if (cProcess) {
    console.log('[watcher] Já em execução, ignorando.');
    return;
  }

  console.log(`[watcher] Executando ${C_EXECUTABLE_NAME}...`);
  setTimeout(() => {
    try {
      cProcess = spawn(C_EXECUTABLE_PATH, [], { stdio: 'inherit' });
      cProcess.on('error', err => {
        console.error(`[watcher] Falha ao iniciar: ${err.message}`);
        cProcess = null;
      });
      cProcess.on('close', code => {
        code !== 0 && console.error(`[watcher] Saiu com código ${code}`);
        cProcess = null;
      });
    } catch (err) {
      console.error(`[watcher] Erro ao executar: ${err.message}`);
      cProcess = null;
    }
  }, EXEC_DELAY_MS);
}

// Inicia watcher
function startWatching() {
  console.log(`[watcher] Observando ${C_SOURCE_FILE}...`);
  fs.watch(process.cwd() + '/' + C_SOURCE_FILE, { persistent: true }, (ev, fn) => {
    if (fn && ev === 'change') {
      console.log(`[watcher] Alteração detectada em ${fn}`);
      compileC();
    }
  });
  compileC();
}

// Fecha corretamente
process.on('SIGINT', () => {
  console.log('\n[watcher] Encerrando...');
  cProcess && cProcess.kill();
  process.exit(0);
});

startWatching();
