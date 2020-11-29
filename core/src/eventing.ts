import { Logger } from "./logger";
import { Skill } from "./skill";
import { Zayo } from "./zayo";

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

export type ZayoEventHandler<T extends Event> = (event: T) => Promise<HandleResult>;

export interface EventListener<T extends Event> {
  priority: number;

  canHandle(event: Event): boolean;
  handle: ZayoEventHandler<T>;
}

export class Eventing {
  constructor(private zayo: Zayo, private logger: Logger) {}

  async handleEvent(event: Event): Promise<void> {
    if (!isErrorEvent(event)) {
      this.logger.debug('Handling event', { event });
    }

    const handlers = this.listenersForEvent(event);

    for (const handler of handlers) {
      try {
        const result = await this.zayo.interact(handler.skill, () => handler.listener.handle(event));

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
    return this.zayo._internal_skills
      .flatMap(skill =>
        skill.listenersFor(event).map(listener => ({ listener, skill }))
      )
      .sort((a, b) => b.listener.priority - a.listener.priority);
  }
}
