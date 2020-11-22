"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZayoSeed = void 0;
const util_1 = require("util");
const glob_1 = require("glob");
const promises_1 = require("fs/promises");
const ejs_1 = require("ejs");
const path_1 = __importDefault(require("path"));
const run_1 = require("./run");
const glob = util_1.promisify(glob_1.glob);
class ZayoSeed {
    constructor(templateDir, targetDir, options) {
        this.templateDir = templateDir;
        this.targetDir = targetDir;
        this.options = options;
    }
    async seedProject() {
        const templateFiles = await glob('**/*', {
            cwd: this.templateDir,
            dot: true,
            nonull: false,
            nodir: true,
            absolute: false,
        });
        for (const templateFile of templateFiles) {
            await this.renderFile(templateFile, this.targetDir);
        }
    }
    async npmInstall() {
        await run_1.run(this.targetDir, 'npm install');
    }
    async renderFile(templateFileName, targetDir, newFileName) {
        const templateFilePath = path_1.default.join(this.templateDir, templateFileName);
        const isTemplate = /\.ejs$/.test(templateFileName);
        const targetFileName = newFileName !== null && newFileName !== void 0 ? newFileName : templateFileName.replace(/\.ejs$/, '');
        const targetFilePath = path_1.default.join(targetDir, targetFileName);
        const templateContent = await promises_1.readFile(templateFilePath, {
            encoding: 'utf-8',
        });
        let content = templateContent;
        if (isTemplate) {
            content = ejs_1.render(templateContent, { project: this.options }, {
                beautify: false,
                escape: undefined,
            });
        }
        await promises_1.mkdir(path_1.default.dirname(targetFilePath), { recursive: true });
        await promises_1.writeFile(targetFilePath, content, { encoding: 'utf-8', flag: 'w' });
        console.log(`Created ${targetFileName}`);
    }
}
exports.ZayoSeed = ZayoSeed;
