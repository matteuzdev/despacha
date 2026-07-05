import { spawn } from 'node:child_process';

const processes = [
  ['api', 'node server/server.mjs'],
  ['web', 'npx vite --host=127.0.0.1 --port=5173'],
];

const children = processes.map(([name, command]) => {
  const child = spawn(command, { stdio: 'inherit', shell: true });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      process.exitCode = code;
    }
  });
  return child;
});

function shutdown() {
  children.forEach((child) => {
    if (!child.killed) child.kill();
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
