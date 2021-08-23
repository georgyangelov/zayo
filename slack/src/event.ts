import { Event } from "@zayojs/core";

export abstract class SlackEvent implements Event {
  integration = 'slack' as const;

  constructor(public name: string) {}
}
