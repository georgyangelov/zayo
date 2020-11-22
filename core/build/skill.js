"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skill = void 0;
class Skill {
    constructor(zayo) {
        this.zayo = zayo;
        this.logger = this.zayo.logger.child(this.name);
        this.listeners = [];
    }
    get name() {
        return this.constructor.name;
    }
    addListener(listener) {
        this.listeners.push(listener);
    }
    listenersFor(event) {
        return this.listeners.filter(listener => listener.canHandle(event));
    }
    integration(klass) {
        return this.zayo.integration(klass);
    }
}
exports.Skill = Skill;
