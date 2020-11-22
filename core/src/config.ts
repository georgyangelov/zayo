export class Config {
  static getOptionalString(name: string): string | undefined {
    return process.env[name] || undefined;
  }

  static getOptionalNumber(name: string): number | undefined {
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

  static getOptionalBoolean(name: string): boolean | undefined {
    const stringValue = this.getOptionalString(name);

    return stringValue?.toLowerCase() === 'true' || stringValue === '1';
  }

  static getString(name: string, defaultValue?: string): string {
    const value = this.getOptionalString(name) || defaultValue;

    if (!value) {
      throw new Error(`Environment variable not set but is required: ${name}`);
    }

    return value;
  }

  static getNumber(name: string, defaultValue?: number): number {
    const value = this.getOptionalNumber(name) ?? defaultValue;

    if (!value) {
      throw new Error(`Environment variable not set but is required: ${name}`);
    }

    return value;
  }

  static getBoolean(name: string, defaultValue?: boolean): boolean {
    const value = this.getOptionalBoolean(name) ?? defaultValue;

    if (value === undefined) {
      throw new Error(`Environment variable not set but is required: ${name}`);
    }

    return value;
  }
}
