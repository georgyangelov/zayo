import { ScheduleOptions } from 'node-cron';
import cronTime from 'cron-time-generator';
import { Skill } from '../skill';
import { Integration } from '../integration';
export { cronTime };
export declare class Cron extends Integration {
    name: "cron";
    actionsFor<T extends Skill>(skill: T): {
        scheduleRepeated(cron: string, action: () => unknown | Promise<unknown>, options?: Pick<ScheduleOptions, "timezone"> | undefined): import("node-cron").ScheduledTask;
        scheduleOnce(cron: string, action: () => unknown | Promise<unknown>, options?: Pick<ScheduleOptions, "timezone"> | undefined): void;
    };
}
