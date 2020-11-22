export declare class Config {
    static getOptionalString(name: string): string | undefined;
    static getOptionalNumber(name: string): number | undefined;
    static getOptionalBoolean(name: string): boolean | undefined;
    static getString(name: string, defaultValue?: string): string;
    static getNumber(name: string, defaultValue?: number): number;
    static getBoolean(name: string, defaultValue?: boolean): boolean;
}
