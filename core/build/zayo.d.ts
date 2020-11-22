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
export declare function isErrorEvent(event: Event): event is ErrorEvent;
export declare enum ListenerAction {
    Stop = "stop",
    Next = "next"
}
export declare type HandleResult = void | ListenerAction | Promise<void | ListenerAction>;
export interface EventListener {
    priority: number;
    canHandle(event: Event): boolean;
    handle(event: Event): Promise<HandleResult>;
}
export declare type SkillConstructor<T> = new (zayo: Zayo) => T;
export declare type Newable<T> = new (...args: any[]) => T;
declare type IntegrationConstructor = (zayo: Zayo) => Record<string, Integration>;
export interface Context {
    interactionId: string;
    skill: Skill;
}
export declare class Zayo {
    readonly logger: Logger;
    private skills;
    private integrations;
    private started?;
    readonly interactionContext: ContinuationLocal<Context>;
    constructor(integrations: IntegrationConstructor);
    registerSkill(skillConstructor: SkillConstructor<Skill>): void;
    get inInteraction(): boolean;
    get context(): Context;
    start(): Promise<void>;
    interact<T>(skill: Skill, callback: () => T): T;
    integration<T extends Integration>(klass: Newable<T>): T;
    handleEvent(event: Event): Promise<void>;
    private listenersForEvent;
}
export {};
