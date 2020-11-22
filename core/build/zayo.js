"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Zayo = exports.ListenerAction = exports.isErrorEvent = void 0;
const uuid_1 = require("uuid");
const continuation_locals_1 = require("./lib/continuation-locals");
const logger_1 = require("./logger");
function isErrorEvent(event) {
    return event.integration === 'internal' && event.name === 'error';
}
exports.isErrorEvent = isErrorEvent;
var ListenerAction;
(function (ListenerAction) {
    ListenerAction["Stop"] = "stop";
    ListenerAction["Next"] = "next";
})(ListenerAction = exports.ListenerAction || (exports.ListenerAction = {}));
class Zayo {
    constructor(integrations) {
        this.logger = new logger_1.Logger(this, 'zayo');
        this.skills = [];
        this.interactionContext = new continuation_locals_1.ContinuationLocal();
        this.integrations = integrations(this);
    }
    registerSkill(skillConstructor) {
        const skill = new skillConstructor(this);
        this.skills.push(skill);
        if (this.started) {
            this.started
                .then(() => skill.initialize())
                .catch(error => {
                this.logger.error('Could not initialize skill', {
                    error,
                    skill: skill.name
                });
            });
        }
    }
    get inInteraction() {
        return this.interactionContext.get() !== undefined;
    }
    get context() {
        const context = this.interactionContext.get();
        if (!context) {
            throw new Error('Cannot call Zayo#context from outside of an interaction');
        }
        return context;
    }
    async start() {
        if (this.started) {
            return;
        }
        this.logger.info('Hello zayo', { version: '2.0' });
        // Doing this to prevent any skill registrations while this is going on
        // to affect it. Otherwise, this may cause some skills to be initialized twice.
        const skills = [...this.skills];
        this.started = (async () => {
            await Promise.all(Object.values(this.integrations).map(i => i.start()));
            for (const skill of skills) {
                await skill.initialize();
            }
        })();
        await this.started;
    }
    interact(skill, callback) {
        return this.interactionContext.set({
            interactionId: uuid_1.v4(),
            skill
        }, callback);
    }
    integration(klass) {
        const instances = Object.values(this.integrations).filter(integration => integration.constructor === klass);
        if (instances.length === 0) {
            throw new Error(`No ${klass.name} integrations configured`);
        }
        if (instances.length === 2) {
            throw new Error(`More than one ${klass.name} integration configured`);
        }
        return instances[0];
    }
    async handleEvent(event) {
        if (!isErrorEvent(event)) {
            this.logger.debug('Handling event', { event });
        }
        const handlers = this.listenersForEvent(event);
        for (const handler of handlers) {
            try {
                const result = await handler.listener.handle(event);
                if (!result || result === ListenerAction.Stop) {
                    return;
                }
                else if (result === ListenerAction.Next) {
                    continue;
                }
                else {
                    this.logger.error('Unknown result returned by a handler', {
                        result
                    });
                }
            }
            catch (err) {
                if (isErrorEvent(event)) {
                    this.logger.error('Error happened while handling another error', {
                        originalError: event.error.toString(),
                        error: err.toString()
                    });
                }
                const errorEvent = {
                    integration: 'internal',
                    name: 'error',
                    originalEvent: event,
                    skill: handler.skill,
                    error: err
                };
                return this.handleEvent(errorEvent);
            }
        }
        if (isErrorEvent(event)) {
            this.logger.error('Error handling event', {
                event: event.originalEvent,
                skill: event.skill.name,
                error: {
                    name: event.error.name,
                    message: event.error.message,
                    stack: event.error.stack
                }
            });
        }
        else {
            this.logger.debug('No listeners can handle event', { event });
        }
    }
    listenersForEvent(event) {
        return this.skills
            .flatMap(skill => skill.listenersFor(event).map(listener => ({ listener, skill })))
            .sort((a, b) => b.listener.priority - a.listener.priority);
    }
}
exports.Zayo = Zayo;
