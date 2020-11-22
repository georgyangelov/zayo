import { Integration } from "./integration";
import { Event, EventListener, Newable, Zayo } from "./zayo";
export declare abstract class Skill {
    private zayo;
    readonly logger: import("./logger").Logger;
    private listeners;
    constructor(zayo: Zayo);
    abstract initialize(): void | Promise<void>;
    get name(): string;
    addListener(listener: EventListener): void;
    listenersFor(event: Event): EventListener[];
    integration<T extends Integration>(klass: Newable<T>): T;
}
