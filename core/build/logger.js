"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = require("winston");
const globalLogger = winston_1.createLogger({
    level: 'info',
    format: winston_1.format.simple(),
    // TODO: Use env variable
    transports: new winston_1.transports.Console({ level: 'debug' })
});
class Logger {
    constructor(zayo, service) {
        this.zayo = zayo;
        this.service = service;
        this.winstonLogger = globalLogger.child({});
    }
    debug(message, info = {}) {
        this.winstonLogger.debug(message, {
            ...info,
            meta: this.meta()
        });
    }
    info(message, info = {}) {
        this.winstonLogger.info(message, {
            ...info,
            meta: this.meta()
        });
    }
    error(message, info = {}) {
        const errorObject = info.error;
        if (errorObject.name && errorObject.message && errorObject.stack) {
            info.error = {
                name: errorObject.name,
                message: errorObject.message,
                stack: errorObject.stack
            };
        }
        this.winstonLogger.error(message, {
            ...info,
            meta: this.meta()
        });
    }
    child(service) {
        return new Logger(this.zayo, service);
    }
    meta() {
        return { service: this.service, interactionId: this.interactionId() };
    }
    interactionId() {
        return this.zayo.inInteraction
            ? this.zayo.context.interactionId
            : undefined;
    }
}
exports.Logger = Logger;
