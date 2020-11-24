import { Event, EventListener } from "./eventing";
import { Integration } from "./integration";
import { Newable, Zayo } from "./zayo";

export abstract class Skill {
  public readonly logger = this.zayo.logger.child(this.name);

  private listeners: EventListener[] = [];

  constructor(private zayo: Zayo) {}

  abstract initialize(): void | Promise<void>;

  get name() {
    return this.constructor.name;
  }

  addListener(listener: EventListener) {
    this.listeners.push(listener);
  }

  listenersFor(event: Event): EventListener[] {
    return this.listeners.filter(listener => listener.canHandle(event));
  }

  integration<T extends Integration>(klass: Newable<T>): T {
    return this.zayo.integration(klass);
  }
}
