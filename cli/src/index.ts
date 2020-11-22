#!/usr/bin/env node
import { program } from 'commander';
import { ZayoSeed } from './seed';
import inquirer from 'inquirer';

program.name('zayo');

program
  .command('new <destination>')
  .description('Seeds a new Zayo project in the destination directory')
  .action(async (targetDir: string) => {
    const options = await inquirer.prompt([
      {
        name: 'packageName',
        type: 'input',
        message: 'package.json name',
        validate: input =>
          input.trim().length > 0 ? true : 'The value cannot be empty',
      }
    ]);

    const seed = new ZayoSeed(
      `${__dirname}/../template`,
      targetDir,
      options
    );

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

program.parseAsync(process.argv).catch(error => console.error(error));
