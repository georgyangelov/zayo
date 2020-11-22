"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cron = exports.cronTime = void 0;
const node_cron_1 = require("node-cron");
const cron_time_generator_1 = __importDefault(require("cron-time-generator"));
exports.cronTime = cron_time_generator_1.default;
const integration_1 = require("../integration");
class Cron extends integration_1.Integration {
    constructor() {
        super(...arguments);
        this.name = 'cron';
    }
    actionsFor(skill) {
        const logger = skill.logger.child(this.name);
        return {
            scheduleRepeated(cron, action, options) {
                logger.info('Scheduled cron action (repeated)', { cron, options });
                return node_cron_1.schedule(cron, async () => {
                    try {
                        await action();
                    }
                    catch (error) {
                        logger.error('Error in scheduled action', { cron, options, error, once: false });
                    }
                }, { ...options, scheduled: true });
            },
            scheduleOnce(cron, action, options) {
                logger.info('Scheduled cron action (once)', { cron, options });
                const task = node_cron_1.schedule(cron, async () => {
                    task.stop();
                    try {
                        await action();
                    }
                    catch (error) {
                        logger.error('Error in scheduled action', { cron, options, error, once: true });
                    }
                }, { ...options, scheduled: true });
            }
        };
    }
}
exports.Cron = Cron;
