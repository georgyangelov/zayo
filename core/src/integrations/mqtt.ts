import { isPlainObject } from 'lodash';
import { Client, connect, IClientPublishOptions } from 'mqtt';
import { Integration } from '../integration';
import { Skill } from '../skill';
import { Event, HandleResult, Zayo } from '../zayo';

export interface MqttConfig {
  brokerUrl: string;
}

export abstract class MqttEvent implements Event {
  integration: 'mqtt' = 'mqtt';

  constructor(public name: string) {}
}

export class MqttMessageEvent extends MqttEvent {
  constructor(public topic: string, public message: any) {
    super('message');
  }
}

export class MqttIntegration extends Integration {
  name = 'mqtt' as const;

  private mqttClient: Client | undefined;

  constructor(private zayo: Zayo, private config: MqttConfig) {
    super();
  }

  async start() {
    await new Promise((resolve, reject) => {
      this.mqttClient = connect(this.config.brokerUrl);
      this.mqttClient.once('connect', resolve);
      this.mqttClient.once('error', reject);

      this.mqttClient.on('message', (topic, message) => {
        try {
          message = JSON.parse(message.toString());
        } catch {}

        this.zayo.handleEvent(new MqttMessageEvent(topic, message));
      });
    });
  }

  async stop() {
    // TODO
  }

  actionsFor<T extends Skill>(skill: T) {
    const logger = skill.logger.child(this.name);

    return {
      hooks: {
        onMessage: (
          topic: string,
          handler: (event: MqttMessageEvent) => HandleResult
        ) => {
          if (!this.mqttClient) {
            throw new Error('Not connected to mqtt');
          }

          this.mqttClient.subscribe(topic);

          skill.addListener({
            priority: 0,

            canHandle: event => this.canHandleEvent(event, topic),

            handle: async (event: MqttMessageEvent) =>
              this.zayo.interact(skill, () => handler(event))
          });
        }
      },

      publish: (
        topic: string,
        message: any,
        options: IClientPublishOptions = {}
      ) => {
        logger.debug('Sending MQTT message', { topic, data: message });

        if (isPlainObject(message)) {
          message = JSON.stringify(message);
        }

        return new Promise((resolve, reject) => {
          if (!this.mqttClient) {
            throw new Error('Not connected to mqtt');
          }

          this.mqttClient.publish(topic, message, options, error => {
            if (error) {
              logger.debug('Could not send MQTT message', {
                topic,
                options,
                error
              });
              return reject(error);
            }

            resolve(error);
          });
        });
      }
    };
  }

  private canHandleEvent(event: Event, topicPattern: string) {
    if (!(event instanceof MqttMessageEvent)) {
      return false;
    }

    const topicRegexString = this.escapeRegExp(topicPattern)
      .replace(/\#/g, '.*')
      .replace(/\+/, '[^/]*');
    const topicRegex = new RegExp(`^${topicRegexString}$`);

    return topicRegex.test(event.topic);
  }

  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  private escapeRegExp(string: string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
}
