import { promisify } from 'util';
import { glob as globCallback } from 'glob';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { render } from 'ejs';
import path from 'path';
import { run } from './run';

const glob = promisify(globCallback);

interface ProjectOptions {
  packageName: string;
}

export class ZayoSeed {
  constructor(
    private templateDir: string,
    private targetDir: string,
    private options: ProjectOptions
  ) {}

  async seedProject() {
    const templateFiles = await glob('**/*', {
      cwd: this.templateDir,
      dot: true,
      nonull: false,
      nodir: true,
      absolute: false,
    });

    for (const templateFile of templateFiles) {
      await this.renderFile(templateFile, this.targetDir);
    }
  }

  async npmInstall() {
    await run(this.targetDir, 'npm install');
  }

  private async renderFile(
    templateFileName: string,
    targetDir: string,
    newFileName?: string
  ) {
    const templateFilePath = path.join(this.templateDir, templateFileName);
    const isTemplate = /\.ejs$/.test(templateFileName);
    const targetFileName =
      newFileName ?? templateFileName.replace(/\.ejs$/, '');
    const targetFilePath = path.join(targetDir, targetFileName);

    const templateContent = await readFile(templateFilePath, {
      encoding: 'utf-8',
    });

    let content = templateContent;

    if (isTemplate) {
      content = render(
        templateContent,
        { project: this.options },
        {
          beautify: false,
          escape: undefined,
        }
      );
    }

    await mkdir(path.dirname(targetFilePath), { recursive: true });

    await writeFile(targetFilePath, content, { encoding: 'utf-8', flag: 'w' });
    console.log(`Created ${targetFileName}`);
  }
}
