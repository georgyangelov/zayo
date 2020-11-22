import { Cron, cronTime, Skill } from '@zayo/core';

export default class Clock extends Skill {
  private cron = this.integration(Cron).actionsFor(this);

  initialize() {
    this.cron.scheduleRepeated(cronTime.everyMinute(), () => {
      this.logger.info('Clock update', { time: new Date() });
    });
  }
}
