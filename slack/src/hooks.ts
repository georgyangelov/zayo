import { ErrorEvent, Logger, Skill, ZayoEventHandler } from "@zayojs/core";
import { SlackMessageReceivedEvent, SlackMessageReceivedEventWithAnalysis } from "./events/message-received";
import { SlackWitAIConfig } from "./slack";

export class SlackHooks {
  constructor(
    private skill: Skill,
    private logger: Logger,
    private witAiConfig?: SlackWitAIConfig
  ) {}

  onUnhandledMessage(
    handler: ZayoEventHandler<SlackMessageReceivedEvent>
  ) {
    this.skill.addListener({
      priority: -1000,

      // TODO: Don't match non-zayo addressed messages
      canHandle: event => event instanceof SlackMessageReceivedEvent,

      handle: handler
    });
  }

  onErrorHandlingMessage(
    handler: ZayoEventHandler<ErrorEvent<SlackMessageReceivedEvent>>
  ) {
    this.skill.addListener({
      priority: 1,

      // TODO: Don't match non-zayo addressed messages
      canHandle: event =>
        event instanceof ErrorEvent &&
        event.originalEvent instanceof SlackMessageReceivedEvent,

      handle: handler
    })
  }

  onMessage(
    pattern: string | RegExp,
    handler: ZayoEventHandler<SlackMessageReceivedEvent>
  ) {
    // TODO: Extract as class
    this.skill.addListener({
      priority: 1,

      // TODO: Don't match non-zayo addressed messages
      canHandle: event => {
        return (
          event instanceof SlackMessageReceivedEvent &&
          this.matchText(pattern, event.message.text)
        );
      },

      handle: handler
    });
  }

  onIntent(
    intent: string,
    options: { minConfidence?: number },
    handler: ZayoEventHandler<SlackMessageReceivedEventWithAnalysis>
  ) {
    if (!this.witAiConfig) {
      throw new Error('Cannot attach intent listeners because Wit.Ai integration is not configured');
    }

    this.skill.addListener<SlackMessageReceivedEventWithAnalysis>({
      priority: 1,

      // TODO: Don't match non-zayo addressed messages
      canHandle: async event => {
        if (!(event instanceof SlackMessageReceivedEvent)) {
          return false;
        }

        const analysis = await event.analyze();

        if (!analysis || !analysis.firstIntent) {
          return false;
        }

        const requiredConfidence = options.minConfidence ?? this.witAiConfig!.defaultMinConfidence;

        return (
          analysis.firstIntent.confidence > requiredConfidence &&
          analysis.firstIntent.name === intent
        );
      },

      handle: handler
    });
  }

  private matchText(pattern: string | RegExp, text: string) {
    if (pattern instanceof RegExp) {
      return pattern.test(text);
    }

    return pattern === text;
  }
}
