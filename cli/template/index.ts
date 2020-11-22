import { Zayo, Cron, JSONStorage } from '@zayojs/core';
import * as dotenv from 'dotenv';

import Clock from './skills/clock';

dotenv.config();

const zayo = new Zayo((zayo: Zayo) => ({
  // Enable this if you want MQTT support
  // mqtt: new MqttIntegration(zayo, {
  //   brokerUrl: Config.getString('MQTT_BROKER')
  // }),

  cron: new Cron(),

  jsonStorage: new JSONStorage('.data/json-storage')
}));

zayo.start();

zayo.registerSkill(Clock);
