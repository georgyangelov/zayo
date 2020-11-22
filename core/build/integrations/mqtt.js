"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttIntegration = exports.MqttMessageEvent = exports.MqttEvent = void 0;
const lodash_1 = require("lodash");
const mqtt_1 = require("mqtt");
const integration_1 = require("../integration");
class MqttEvent {
    constructor(name) {
        this.name = name;
        this.integration = 'mqtt';
    }
}
exports.MqttEvent = MqttEvent;
class MqttMessageEvent extends MqttEvent {
    constructor(topic, message) {
        super('message');
        this.topic = topic;
        this.message = message;
    }
}
exports.MqttMessageEvent = MqttMessageEvent;
class MqttIntegration extends integration_1.Integration {
    constructor(zayo, config) {
        super();
        this.zayo = zayo;
        this.config = config;
        this.name = 'mqtt';
    }
    async start() {
        await new Promise((resolve, reject) => {
            this.mqttClient = mqtt_1.connect(this.config.brokerUrl);
            this.mqttClient.once('connect', resolve);
            this.mqttClient.once('error', reject);
            this.mqttClient.on('message', (topic, message) => {
                try {
                    message = JSON.parse(message.toString());
                }
                catch { }
                this.zayo.handleEvent(new MqttMessageEvent(topic, message));
            });
        });
    }
    async stop() {
        // TODO
    }
    actionsFor(skill) {
        const logger = skill.logger.child(this.name);
        return {
            hooks: {
                onMessage: (topic, handler) => {
                    if (!this.mqttClient) {
                        throw new Error('Not connected to mqtt');
                    }
                    this.mqttClient.subscribe(topic);
                    skill.addListener({
                        priority: 0,
                        canHandle: event => this.canHandleEvent(event, topic),
                        handle: async (event) => this.zayo.interact(skill, () => handler(event))
                    });
                }
            },
            publish: (topic, message, options = {}) => {
                logger.debug('Sending MQTT message', { topic, data: message });
                if (lodash_1.isPlainObject(message)) {
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
    canHandleEvent(event, topicPattern) {
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
    escapeRegExp(string) {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
}
exports.MqttIntegration = MqttIntegration;
