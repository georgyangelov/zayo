import { spawn } from 'child_process';

export function run(cwd: string, command: string): Promise<void> {
  const child = spawn(command, { cwd, stdio: 'inherit', shell: true });

  return new Promise((resolve, reject) => {
    child.on('close', code => {
      if (code) {
        reject(new Error(`Process exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}
