import { Integration } from '../integration';
import { Logger } from '../logger';
import { Skill } from '../skill';
export declare class JSONStorageInstance<T> {
    private logger;
    private filePath;
    private defaultValue;
    constructor(logger: Logger, filePath: string, defaultValue: T);
    store(value: T): Promise<void>;
    load(): Promise<T>;
}
export declare class JSONStorage extends Integration {
    private directoryPath;
    name: "jsonStorage";
    constructor(directoryPath: string);
    actionsFor<T extends Skill>(skill: T): {
        storage: <V>(key: string, defaultValue: V) => JSONStorageInstance<V>;
    };
}
