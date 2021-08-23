import { Event, EventListener } from "./eventing";
import { Integration } from "./integration";
import { Newable, Zayo } from "./zayo";

export abstract class Skill {
  public readonly logger = this.zayo.logger.child(this.name);

  private listeners: EventListener<Event>[] = [];

  constructor(public readonly zayo: Zayo) {}

  abstract initialize(): void | Promise<void>;

  get name() {
    return this.constructor.name;
  }

  addListener<T extends Event>(listener: EventListener<T>) {
    this.listeners.push(listener as EventListener<Event>);

    return () => {
      this.listeners = this.listeners.filter(_ => _ !== listener);
    };
  }

  public get eventListeners() {
    return this.listeners;
  }

  integration<T extends Integration>(klass: Newable<T>): T {
    return this.zayo.integration(klass);
  }
}
