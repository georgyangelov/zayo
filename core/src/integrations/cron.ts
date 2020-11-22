import { schedule, ScheduleOptions } from 'node-cron';
import cronTime from 'cron-time-generator';
import { Skill } from '../skill';
import { Integration } from '../integration';

export { cronTime };

export class Cron extends Integration {
  name = 'cron' as const;

  actionsFor<T extends Skill>(skill: T) {
    const logger = skill.logger.child(this.name);

    return {
      scheduleRepeated(cron: string, action: () => unknown | Promise<unknown>, options?: Pick<ScheduleOptions, 'timezone'>) {
        logger.info('Scheduled cron action (repeated)', { cron, options });

        return schedule(cron, async () => {
          try {
            await action();
          } catch (error) {
            logger.error('Error in scheduled action', { cron, options, error, once: false });
          }
        }, { ...options, scheduled: true });
      },

      scheduleOnce(cron: string, action: () => unknown | Promise<unknown>, options?: Pick<ScheduleOptions, 'timezone'>) {
        logger.info('Scheduled cron action (once)', { cron, options });

        const task = schedule(cron, async () => {
          task.stop();

          try {
            await action();
          } catch (error) {
            logger.error('Error in scheduled action', { cron, options, error, once: true })
          }
        }, { ...options, scheduled: true });
      }
    };
  }
}
