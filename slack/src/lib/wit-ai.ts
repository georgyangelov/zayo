import { HTTPStatusCodeError } from '@zayojs/core';
import fetch from 'node-fetch';

export interface WitAIConfig {
  serverAccessToken: string;
}

export interface WitAIIntent {
  id: string;
  name: string;
  confidence: number;
}

export interface WitAIEntity {
  id: string;
  name: string;
  role: 'metric' | 'datetime' | string;

  start: number;
  end: number;
  // The text that matches
  body: string;

  value: string;
  confidence: number;

  entities: [];
  type?: 'interval' | 'string';
}

interface WitAIAnalysisResponse {
  text: string;
  intents: WitAIIntent[];
  entities: Record<string, WitAIEntity[]>;
  traits: any[];
}

export class WitAIAnalysis {
  constructor(private data: WitAIAnalysisResponse) {}

  get text() {
    return this.data.text;
  }

  get intents() {
    return this.data.intents;
  }

  get firstIntent(): WitAIIntent | undefined {
    return this.data.intents[0];
  }

  get entities() {
    return this.data.entities;
  }
}

export class WitAI {
  private API_VERSION = '20201201';
  private BASE_URL = 'https://api.wit.ai';

  constructor(private config: WitAIConfig) {}

  public async analyze(text: string): Promise<WitAIAnalysis> {
    const response = await fetch(`${this.BASE_URL}/message?v=${this.API_VERSION}&q=${encodeURIComponent(text)}`, {
      headers: {
        Authorization: `Bearer ${this.config.serverAccessToken}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new HTTPStatusCodeError(response);
    }

    const data = await response.json();

    return new WitAIAnalysis(data);
  }
}
