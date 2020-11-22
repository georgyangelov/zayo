"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const child_process_1 = require("child_process");
function run(cwd, command) {
    const child = child_process_1.spawn(command, { cwd, stdio: 'inherit', shell: true });
    return new Promise((resolve, reject) => {
        child.on('close', code => {
            if (code) {
                reject(new Error(`Process exited with code ${code}`));
            }
            else {
                resolve();
            }
        });
    });
}
exports.run = run;
