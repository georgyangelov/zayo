import { schedule, ScheduleOptions } from 'node-cron';
import cronTime from 'cron-time-generator';
import { Skill } from '../skill';
import { Integration } from '../integration';
import { Zayo } from '../zayo';

export { cronTime };

export class Cron extends Integration {
  name = 'cron' as const;

  constructor(private zayo: Zayo) {
    super();
  }

  actionsFor<T extends Skill>(skill: T) {
    const logger = skill.logger.child(this.name);

    return {
      scheduleRepeated: (cron: string, action: () => unknown, options?: Pick<ScheduleOptions, 'timezone'>) => {
        logger.info('Scheduled cron action (repeated)', { cron, options });

        return schedule(cron, async () => {
          this.zayo.interactHandlingErrors(skill, action, { cron, options, once: false });
        }, { ...options, scheduled: true });
      },

      scheduleOnce: (expressionOrDate: string | Date, action: () => unknown, options?: Pick<ScheduleOptions, 'timezone'>) => {
        const cron = expressionOrDate instanceof Date ? this.dateToCronTime(expressionOrDate) : expressionOrDate;

        if (expressionOrDate instanceof Date) {
          if (expressionOrDate.getTime() < new Date().getTime()) {
            logger.debug('Not scheduling action because it\'s in the past', { expressionOrDate, cron, options })
            return;
          }
        }

        logger.info('Scheduled cron action (once)', { expressionOrDate, cron, options });

        const task = schedule(cron, async () => {
          task.stop();

          this.zayo.interactHandlingErrors(skill, action, { cron, options, once: true });
        }, { ...options, scheduled: true });

        return task;
      }
    };
  }

  private dateToCronTime(date: Date) {
    return `${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }
}
