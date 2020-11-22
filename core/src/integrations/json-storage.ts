import { mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { Integration } from '../integration';
import { Logger } from '../logger';
import { Skill } from '../skill';

export class JSONStorageInstance<T> {
  constructor(private logger: Logger, private filePath: string, private defaultValue: T) {}

  async store(value: T) {
    await writeFile(
      this.filePath,
      JSON.stringify(value),
      { encoding: 'utf-8', flag: 'w' }
    );
  }

  async load(): Promise<T> {
    let jsonString;
    try {
      jsonString = await readFile(this.filePath, { encoding: 'utf-8' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return this.defaultValue;
      }

      throw error;
    }

    try {
      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error('Cannot read JSON storage file', {
        filePath: this.filePath,
        jsonString
      });

      throw error;
    }
  }
}

export class JSONStorage extends Integration {
  name = 'jsonStorage' as const;

  constructor(private directoryPath: string) {
    super();
  }

  actionsFor<T extends Skill>(skill: T) {
    const logger = skill.logger.child(this.name);

    return {
      storage: <V>(key: string, defaultValue: V) => {
        // TODO: Validate skill name
        const skillDirectory = path.join(this.directoryPath, skill.name);

        mkdirSync(skillDirectory, { recursive: true });

        // TODO: Validate key name
        const filePath = path.join(skillDirectory, `${key}.json`);

        return new JSONStorageInstance<V>(logger, filePath, defaultValue);
      }
    };
  }
}
