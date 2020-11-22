import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports
} from 'winston';
import { Zayo } from '.';

const globalLogger = createLogger({
  level: 'info',
  format: format.simple(), //format.json(),

  // TODO: Use env variable
  transports: new transports.Console({ level: 'debug' })
});

export class Logger {
  private winstonLogger: WinstonLogger;

  constructor(private zayo: Zayo, private context: string) {
    this.winstonLogger = globalLogger.child({});
  }

  debug(message: string, info: object = {}) {
    this.winstonLogger.debug(message, {
      ...info,
      meta: this.meta()
    });
  }

  info(message: string, info: object = {}) {
    this.winstonLogger.info(message, {
      ...info,
      meta: this.meta()
    });
  }

  error(message: string, info: Record<string, any> = {}) {
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

  child(context: string) {
    return new Logger(this.zayo, context);
  }

  private meta() {
    return { context: this.context, interactionId: this.interactionId() };
  }

  private interactionId(): string | undefined {
    return this.zayo.inInteraction
      ? this.zayo.context.interactionId
      : undefined;
  }
}
