import { v4 as uuidV4 } from 'uuid';
import { ContinuationLocal } from './lib/continuation-locals';
import { Logger } from './logger';
import { Skill } from './skill';
import { Integration } from "./integration";

export interface Event {
  integration: string;
  name: string;
}

export interface ErrorEvent {
  integration: 'internal';
  name: 'error';

  originalEvent: Event;

  skill: Skill;
  error: Error;
}

export function isErrorEvent(event: Event): event is ErrorEvent {
  return event.integration === 'internal' && event.name === 'error';
}

export enum ListenerAction {
  Stop = 'stop',
  Next = 'next'
}

export type HandleResult =
  | void
  | ListenerAction
  | Promise<void | ListenerAction>;

export interface EventListener {
  priority: number;

  canHandle(event: Event): boolean;
  handle(event: Event): Promise<HandleResult>;
}

export type SkillConstructor<T> = new (zayo: Zayo) => T;
export type Newable<T> = new (...args: any[]) => T;
type IntegrationConstructor = (zayo: Zayo) => Record<string, Integration>;

export interface Context {
  interactionId: string;
  skill: Skill;
}

export class Zayo {
  public readonly logger = new Logger(this, 'zayo');

  private skills: Skill[] = [];
  private integrations: Record<string, Integration>;
  private started?: Promise<void>;

  public readonly interactionContext = new ContinuationLocal<Context>();

  constructor(integrations: IntegrationConstructor) {
    this.integrations = integrations(this);
  }

  registerSkill(skillConstructor: SkillConstructor<Skill>) {
    const skill = new skillConstructor(this);

    this.skills.push(skill);

    if (this.started) {
      this.started
        .then(() => skill.initialize())
        .catch(error => {
          this.logger.error('Could not initialize skill', {
            error,
            skill: skill.name
          });
        });
    }
  }

  get inInteraction(): boolean {
    return this.interactionContext.get() !== undefined;
  }

  get context(): Context {
    const context = this.interactionContext.get();

    if (!context) {
      throw new Error(
        'Cannot call Zayo#context from outside of an interaction'
      );
    }

    return context;
  }

  async start() {
    if (this.started) {
      return;
    }

    this.logger.info('Hello zayo', { version: '2.0' });

    // Doing this to prevent any skill registrations while this is going on
    // to affect it. Otherwise, this may cause some skills to be initialized twice.
    const skills = [...this.skills];

    this.started = (async () => {
      await Promise.all(Object.values(this.integrations).map(i => i.start()));

      for (const skill of skills) {
        await skill.initialize();
      }
    })();

    await this.started;
  }

  interact<T>(skill: Skill, callback: () => T): T {
    return this.interactionContext.set(
      {
        interactionId: uuidV4(),
        skill
      },
      callback
    );
  }

  integration<T extends Integration>(klass: Newable<T>): T {
    const instances = Object.values(this.integrations).filter(
      integration => integration.constructor === klass
    ) as T[];

    if (instances.length === 0) {
      throw new Error(`No ${klass.name} integrations configured`);
    }

    if (instances.length === 2) {
      throw new Error(`More than one ${klass.name} integration configured`);
    }

    return instances[0];
  }

  async handleEvent(event: Event): Promise<void> {
    if (!isErrorEvent(event)) {
      this.logger.debug('Handling event', { event });
    }

    const handlers = this.listenersForEvent(event);

    for (const handler of handlers) {
      try {
        const result = await handler.listener.handle(event);

        if (!result || result === ListenerAction.Stop) {
          return;
        } else if (result === ListenerAction.Next) {
          continue;
        } else {
          this.logger.error('Unknown result returned by a handler', {
            result
          });
        }
      } catch (err) {
        if (isErrorEvent(event)) {
          this.logger.error('Error happened while handling another error', {
            originalError: event.error.toString(),
            error: err.toString()
          });
        }

        const errorEvent: ErrorEvent = {
          integration: 'internal',
          name: 'error',

          originalEvent: event,

          skill: handler.skill,
          error: err
        };

        return this.handleEvent(errorEvent);
      }
    }

    if (isErrorEvent(event)) {
      this.logger.error('Error handling event', {
        event: event.originalEvent,
        skill: event.skill.name,
        error: {
          name: event.error.name,
          message: event.error.message,
          stack: event.error.stack
        }
      });
    } else {
      this.logger.debug('No listeners can handle event', { event });
    }
  }

  private listenersForEvent(event: Event) {
    return this.skills
      .flatMap(skill =>
        skill.listenersFor(event).map(listener => ({ listener, skill }))
      )
      .sort((a, b) => b.listener.priority - a.listener.priority);
  }
}
