import { IClientPublishOptions } from 'mqtt';
import { Integration } from '../integration';
import { Skill } from '../skill';
import { Event, HandleResult, Zayo } from '../zayo';
export interface MqttConfig {
    brokerUrl: string;
}
export declare abstract class MqttEvent implements Event {
    name: string;
    integration: 'mqtt';
    constructor(name: string);
}
export declare class MqttMessageEvent extends MqttEvent {
    topic: string;
    message: any;
    constructor(topic: string, message: any);
}
export declare class MqttIntegration extends Integration {
    private zayo;
    private config;
    name: "mqtt";
    private mqttClient;
    constructor(zayo: Zayo, config: MqttConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    actionsFor<T extends Skill>(skill: T): {
        hooks: {
            onMessage: (topic: string, handler: (event: MqttMessageEvent) => HandleResult) => void;
        };
        publish: (topic: string, message: any, options?: IClientPublishOptions) => Promise<unknown>;
    };
    private canHandleEvent;
    private escapeRegExp;
}
