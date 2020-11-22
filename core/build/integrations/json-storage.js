"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONStorage = exports.JSONStorageInstance = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const integration_1 = require("../integration");
class JSONStorageInstance {
    constructor(logger, filePath, defaultValue) {
        this.logger = logger;
        this.filePath = filePath;
        this.defaultValue = defaultValue;
    }
    async store(value) {
        await promises_1.writeFile(this.filePath, JSON.stringify(value), { encoding: 'utf-8', flag: 'w' });
    }
    async load() {
        let jsonString;
        try {
            jsonString = await promises_1.readFile(this.filePath, { encoding: 'utf-8' });
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return this.defaultValue;
            }
            throw error;
        }
        try {
            return JSON.parse(jsonString);
        }
        catch (error) {
            this.logger.error('Cannot read JSON storage file', {
                filePath: this.filePath,
                jsonString
            });
            throw error;
        }
    }
}
exports.JSONStorageInstance = JSONStorageInstance;
class JSONStorage extends integration_1.Integration {
    constructor(directoryPath) {
        super();
        this.directoryPath = directoryPath;
        this.name = 'jsonStorage';
    }
    actionsFor(skill) {
        const logger = skill.logger.child(this.name);
        return {
            storage: (key, defaultValue) => {
                // TODO: Validate skill name
                const skillDirectory = path_1.default.join(this.directoryPath, skill.name);
                fs_1.mkdirSync(skillDirectory, { recursive: true });
                // TODO: Validate key name
                const filePath = path_1.default.join(skillDirectory, `${key}.json`);
                return new JSONStorageInstance(logger, filePath, defaultValue);
            }
        };
    }
}
exports.JSONStorage = JSONStorage;
