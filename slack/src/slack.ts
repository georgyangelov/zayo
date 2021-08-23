import { createEventAdapter } from "@slack/events-api";
import { retryPolicies, WebClient } from "@slack/web-api";
import { createMessageAdapter } from "@slack/interactive-messages";
import { Integration, Skill, StringsScope, Zayo } from "@zayojs/core";
import { EventEmitter } from "events";
import { Router } from "express";
import { SlackHooks } from "./hooks";
import { SlackActions } from "./actions";
import { SlackMessageReceivedEvent } from "./events/message-received";
import { SlackMessage } from "./models/message";
import { SlackAPIEventMessage } from "./types/event-api";
import { WitAI } from "./lib/wit-ai";

export interface SlackWitAIConfig {
  api: WitAI;
  defaultMinConfidence: number;
}

export interface SlackConfig {
  signingSecret: string;
  apiToken: string;
  strings: StringsScope;

  witAi?: SlackWitAIConfig;
}

export class Slack extends Integration {
  name = 'slack' as const;

  private slackEventAdapter = createEventAdapter(this.config.signingSecret);
  private slackActionsAdapter = createMessageAdapter(this.config.signingSecret);

  private logger = this.zayo.logger.child(this.name);

  private webApi = new WebClient(this.config.apiToken, {
    retryConfig: retryPolicies.fiveRetriesInFiveMinutes
  });

  constructor(private zayo: Zayo, private config: SlackConfig) {
    super();
  }

  private get slackEvents() {
    return this.slackEventAdapter as any as EventEmitter;
  }

  expressRouter() {
    const router = Router();

    router.use('/events', this.slackEventAdapter.requestListener());
    router.use('/actions', this.slackActionsAdapter.requestListener());

    return router;
  }

  async start() {
    // See https://api.slack.com/events/app_rate_limited
    this.slackEvents.on('app_rate_limited', event => {
      this.logger.error('App is being rate-limited', { event });
    });

    this.slackEvents.on('tokens_revoked', event => {
      this.logger.error('Tokens were removed for this application', { event });
    });

    this.slackEvents.on('error', error => {
      this.logger.error('Error in slack listener', { error });
    });

    this.slackEvents.on('message', (event: SlackAPIEventMessage) => {
      if (event.type !== 'message' || !event.channel_type) {
        this.logger.error('Received weird event from Slack', { event });
      }

      if (event.bot_id) {
        // Ignore messages sent by bots (ourselves included)
        return;
      }

      if (event.channel_type !== 'im') {
        // Ignore non-direct messages (for now)
        return;
      }

      const message = new SlackMessage(
        event.ts,
        event.channel,
        event.text,
        event.channel_type,
        event.thread_ts,
        event.user
      );

      this.zayo.eventing.handleEvent(new SlackMessageReceivedEvent(message, this.config.witAi?.api));
    });

    // this.slackActionsAdapter.action({}, (payload, respond) => {
    //   console.log('Received action', payload);
    //
    //   const continuationId = payload.action_id;
    //
    //   if (!this.actionContinuations.has(continuationId)) {
    //     this.logger.warn('Received Slack action event but there is no continuation with this id', { continuationId, payload });
    //   }
    //
    //   this.actionContinuations.resolve(continuationId, { payload, respond });
    // });
  }

  async stop() {
    this.slackEvents.removeAllListeners();
  }

  actionsFor<T extends Skill>(skill: T) {
    const logger = skill.logger.child(this.name);

    return {
      hooks: new SlackHooks(skill, logger, this.config.witAi),
      actions: new SlackActions(this.webApi, skill, this.config.strings, logger, this.zayo)
    };
  }
}
