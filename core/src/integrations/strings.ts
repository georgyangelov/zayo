import { get, isArray, isPlainObject, isString, sample } from "lodash";
import ejs, { Options as EJSOptions } from 'ejs';
import { Integration } from "../integration";
import { Skill } from "../skill";

export type StringsValue = string | string[];
export type StringsObject = { [key: string]: StringsObject | StringsValue };

export interface StringsConfig {
  strings: StringsObject;
}

export class StringsScope {
  constructor(private strings: StringsObject) {}

  get(path: string, params: Record<string, any> = {}, options: { type: 'text' | 'html' } = { type: 'text' }) {
    const value = get(this.strings, path);

    if (!isString(value) && !isArray(value)) {
      throw new Error(`String at path ${path} is not a leaf value (string | string[])`);
    }

    const pickedValue = this.pickValueAtRandom(path, value);

    const ejsOptions: EJSOptions | undefined = options.type === 'text' ? {
      // We're rendering text (not HTML), so this should be fine
      escape: (text) => text
    } : undefined;

    const renderedValue = ejs.render(pickedValue, params, { ...ejsOptions, async: false });

    return renderedValue;
  }

  scope(path: string) {
    const object = get(this.strings, path);

    if (!isPlainObject(object)) {
      // TODO: More info about the current path
      throw new Error(`Tried to scope to path ${path} but it's not an object`);
    }

    return new StringsScope(object as StringsObject);
  }

  private pickValueAtRandom(path: string, value: string | string[]) {
    if (isString(value)) {
      return value;
    }

    if (value.length === 0) {
      throw new Error(`String at path ${path} is an empty array`);
    }

    return sample(value) as string;
  }
}

export class Strings extends Integration {
  name = 'strings';

  constructor(private config: StringsConfig) {
    super();
  }

  scope(path: string) {
    return new StringsScope(this.config.strings).scope(path);
  }

  actionsFor(_skill: Skill) {
    return {
      scope: (path: string) => new StringsScope(this.config.strings).scope(path)
    };
  }
}
