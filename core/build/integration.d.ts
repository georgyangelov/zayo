import { Skill } from "./skill";
export declare abstract class Integration {
    abstract name: string;
    start(): Promise<void>;
    stop(): Promise<void>;
    abstract actionsFor(skill: Skill): {};
}
