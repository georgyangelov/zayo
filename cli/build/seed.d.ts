interface ProjectOptions {
    packageName: string;
}
export declare class ZayoSeed {
    private templateDir;
    private targetDir;
    private options;
    constructor(templateDir: string, targetDir: string, options: ProjectOptions);
    seedProject(): Promise<void>;
    npmInstall(): Promise<void>;
    private renderFile;
}
export {};
