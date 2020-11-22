import { Skill } from "./skill";

export abstract class Integration {
  abstract name: string;

  async start(): Promise<void> {}
  async stop(): Promise<void> {}

  abstract actionsFor(skill: Skill): {};
}
