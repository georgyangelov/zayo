import { SlackEvent } from "../event";
import { WitAI, WitAIAnalysis } from "../lib/wit-ai";
import { SlackMessage } from "../models/message";

export class SlackMessageReceivedEvent extends SlackEvent {
  private _analysis?: WitAIAnalysis;

  constructor(public message: SlackMessage, private witAi: WitAI | undefined) {
    super('message-received');
  }

  public get analysis(): WitAIAnalysis | undefined {
    return this._analysis;
  }

  public async analyze(): Promise<WitAIAnalysis | undefined> {
    this._analysis ||= await this.witAi?.analyze(this.message.text);

    return this._analysis;
  }
}

export interface SlackMessageReceivedEventWithAnalysis extends SlackMessageReceivedEvent {
  analysis: WitAIAnalysis;
}
