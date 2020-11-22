import { Zayo } from '.';
export declare class Logger {
    private zayo;
    private service;
    private winstonLogger;
    constructor(zayo: Zayo, service: string);
    debug(message: string, info?: object): void;
    info(message: string, info?: object): void;
    error(message: string, info?: Record<string, any>): void;
    child(service: string): Logger;
    private meta;
    private interactionId;
}
