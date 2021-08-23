import { Skill } from '../skill';
import { Integration } from '../integration';
import { Zayo } from '../zayo';
import express, { Application, Router } from 'express';
import { Server as NodeHttpServer } from 'http';
import {
  logger as expressWinstonLogger,
  errorLogger as expressWinstonErrorLogger
} from 'express-winston';

interface HTTPServerConfig {
  port: number;

  configure?: (app: Application) => unknown | Promise<unknown>;
  createServer?: (app: Application, port: number) => NodeHttpServer | Promise<NodeHttpServer>;
}

export class HTTPServer extends Integration {
  name = 'http-server' as const;

  private app?: Application;
  private server?: NodeHttpServer;

  constructor(private zayo: Zayo, private config: HTTPServerConfig) {
    super();
  }

  async start() {
    const app = express();

    const logger = this.zayo.logger.child('http-server-express')
    app.use(expressWinstonLogger({
      winstonInstance: logger.winstonLogger,
      level: 'silly',

      // TODO: This should be configurable
      requestWhitelist: ['url', 'headers', 'method', 'body'],
      bodyBlacklist: ['password']
    }));

    await this.config.configure?.(app);

    app.use(expressWinstonErrorLogger({
      winstonInstance: logger.winstonLogger,
      level: 'info'
    }));

    const createServer = this.config.createServer ?? HTTPServer.createDefaultHttpServer;

    this.app = app;
    this.server = await createServer(app, this.config.port);

    // TODO: Log
  }

  async stop() {
    this.server?.close();

    this.app = undefined;
    this.server = undefined;
  }

  actionsFor<T extends Skill>(skill: T) {
    const logger = skill.logger.child(this.name);

    return {
      // TODO: Remove these bindings on skill unload
      router: (path?: string): Router => {
        const app = this.getApp();
        const router = Router();

        if (path) {
          app.use(path, router);
        } else {
          app.use(router);
        }

        return router;
      }
    };
  }

  private getApp() {
    const app = this.app;

    if (!app) {
      throw new Error('HTTP server not started, but a method was used that relies on it');
    }

    return app;
  }

  private static createDefaultHttpServer(app: Application, port: number) {
    return new Promise<NodeHttpServer>((resolve, _reject) => {
      const server = app.listen(port, () => resolve(server));
    });
  }
}
