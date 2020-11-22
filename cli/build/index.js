#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const seed_1 = require("./seed");
const inquirer_1 = __importDefault(require("inquirer"));
commander_1.program.name('zayo');
commander_1.program
    .command('new <destination>')
    .description('Seeds a new Zayo project in the destination directory')
    .action(async (targetDir) => {
    const options = await inquirer_1.default.prompt([
        {
            name: 'packageName',
            type: 'input',
            message: 'package.json name',
            validate: input => input.trim().length > 0 ? true : 'The value cannot be empty',
        }
    ]);
    const seed = new seed_1.ZayoSeed(`${__dirname}/../template`, targetDir, options);
    console.log('Seeding project files...');
    console.log();
    await seed.seedProject();
    console.log();
    console.log('Installing modules...');
    await seed.npmInstall();
    console.log();
    console.log(`Seeded Zayo project at ${targetDir}`);
    console.log('Use `npm start` to run it');
});
commander_1.program.parseAsync(process.argv).catch(error => console.error(error));
