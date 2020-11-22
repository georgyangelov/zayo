"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
class Config {
    static getOptionalString(name) {
        return process.env[name] || undefined;
    }
    static getOptionalNumber(name) {
        const stringValue = this.getOptionalString(name);
        if (!stringValue) {
            return undefined;
        }
        const value = Number(stringValue);
        if (isNaN(value)) {
            throw new Error(`Environment variable is not a number: ${name}`);
        }
        return value;
    }
    static getOptionalBoolean(name) {
        const stringValue = this.getOptionalString(name);
        return (stringValue === null || stringValue === void 0 ? void 0 : stringValue.toLowerCase()) === 'true' || stringValue === '1';
    }
    static getString(name, defaultValue) {
        const value = this.getOptionalString(name) || defaultValue;
        if (!value) {
            throw new Error(`Environment variable not set but is required: ${name}`);
        }
        return value;
    }
    static getNumber(name, defaultValue) {
        var _a;
        const value = (_a = this.getOptionalNumber(name)) !== null && _a !== void 0 ? _a : defaultValue;
        if (!value) {
            throw new Error(`Environment variable not set but is required: ${name}`);
        }
        return value;
    }
    static getBoolean(name, defaultValue) {
        var _a;
        const value = (_a = this.getOptionalBoolean(name)) !== null && _a !== void 0 ? _a : defaultValue;
        if (value === undefined) {
            throw new Error(`Environment variable not set but is required: ${name}`);
        }
        return value;
    }
}
exports.Config = Config;
