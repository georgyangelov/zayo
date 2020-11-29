import { createEventAdapter } from "@slack/events-api";
import { retryPolicies, WebClient } from "@slack/web-api";
import { Event, Integration, Skill, Zayo, ZayoEventHandler } from "@zayojs/core";
import dayjs from "dayjs";
import { EventEmitter } from "events";

interface SlackConfig {
  signingSecret: string;
  apiToken: string;
}

export abstract class SlackEvent implements Event {
  integration = 'slack' as const;

  constructor(public name: string) {}
}

export class SlackMessage {
  constructor(
    public id: string,
    public channel_id: string,
    public text: string,
    public channelType: 'im' | 'group'
  ) {}

  public get date() {
    const date = dayjs.unix(parseFloat(this.id));

    if (!date.isValid()) {
      throw new Error(`Got invalid date from a Slack message\'s ts value: ${this.id}`);
    }

    return date;
  }
}

export class SlackMessageReceivedEvent extends SlackEvent {
  constructor(public message: SlackMessage) {
    super('message-received');
  }
}

const HANDLED_EVENTS = [
  // 'channel_archive',
  // 'channel_created',
  // 'channel_deleted',

  // 'channel_left',
  // 'channel_rename',
  // 'channel_shared',
  // 'channel_unarchive',
  // 'channel_unshared',

  // 'emoji_changed',

  // 'file_change',
  // 'file_comment_added',
  // 'file_comment_deleted',
  // 'file_comment_edited',
  // 'file_created',
  // 'file_deleted',
  // 'file_public',
  // 'file_shared',
  // 'file_unshared',

  // 'group_archive',
  // 'group_close',
  // 'group_deleted',
  // 'group_history_changed',
  // 'group_left',
  // 'group_open',
  // 'group_rename',
  // 'group_unarchive',

  // 'im_close',
  // 'im_created',
  // 'im_history_changed',
  // 'im_open',

  // 'member_joined_channel',
  // 'member_left_channel',

  'message',
  'message.app_home',
  'message.channels',
  'message.groups',
  'message.im',
  'message.mpim',

  // 'pin_added',
  // 'pin_removed',

  'reaction_added',
  'reaction_removed',

  // 'star_added',
  // 'star_removed',
] as const;

export class Slack extends Integration {
  name = 'slack' as const;

  private slackEventAdapter = createEventAdapter(this.config.signingSecret);
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

  expressRequestHandler() {
    return this.slackEventAdapter.requestListener();
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

    // const eventHandler = this.handleEvent.bind(this);
    //
    // HANDLED_EVENTS.forEach(eventName => this.slackEvents.on(eventName, eventHandler));

    this.slackEvents.on('message', (event: SlackAPIEventMessage) => {
      if (event.type !== 'message' || !event.channel_type) {
        this.logger.error('Received weird event from Slack', { event });
      }

      if (event.bot_id) {
        // Ignore messages sent by bots (ourselves included)
        return;
      }

      const message = new SlackMessage(event.ts, event.channel, event.text, event.channel_type);

      this.zayo.eventing.handleEvent(new SlackMessageReceivedEvent(message));
    });
  }

  async stop() {
    this.slackEvents.removeAllListeners();
  }

  actionsFor<T extends Skill>(skill: T) {
    const logger = skill.logger.child(this.name);

    return {
      hooks: {
        listenFor: (
          pattern: string | RegExp,
          handler: ZayoEventHandler<SlackMessageReceivedEvent>
        ) => {
          skill.addListener({
            priority: 1,
            canHandle: event => {
              logger.debug('canHandle', { event });

              return (
                event instanceof SlackMessageReceivedEvent &&
                this.matchText(pattern, event.message.text)
              );
            },
            handle: handler
          })
        }
      },

      actions: {
        api: this.webApi,

        reply: async (message: SlackMessage, text: string) => {
          await this.webApi.chat.postMessage({
            channel: message.channel_id,
            text
          });
        }
      }
    };
  }

  private handleEvent(event: SlackEventApiEvent) {

  }

  private matchText(pattern: string | RegExp, text: string) {
    if (pattern instanceof RegExp) {
      return pattern.test(text);
    }

    return pattern === text;
  }
}

interface SlackAPIMessage {
  type: 'message';
  subtype?: 'thread_broadcast'; // TODO: Is this correct?
  ts: string;

  user: string; // user id
  text: string;
  edited?: {
    user: string;
    ts: string;
  };

  thread_ts?: string;
  reply_count?: number;
  replies?: { user: string, ts: string }[]
}

interface SlackAPIEventMessageBot {
  type: 'message';
  subtype: 'bot_message',
  channel: string;
  ts: string;
  text: string;
  bot_id: string;
  username: string;
  icons: object;
}

interface SlackAPIEventMessageMe {
  type: 'message';
  subtype: 'me_message';
  channel: string;
  user: string;
  ts: string;
  text: string;
}

interface SlackAPIEventMessageChanged {
  type: 'message';
  subtype: 'message_changed';
  hidden: boolean;
  channel: string;
  ts: string;
  message: SlackAPIMessage;
}

interface SlackAPIEventMessageDeleted {
  type: 'message';
  subtype: 'message_deleted';
  hidden: boolean;
  channel: string;
  ts: string;
  deleted_ts: string; // The timestamp of the message that was deleted
}

interface SlackAPIEventMessageReplied {
  type: 'message';

  // This is missing because of a bug
  // subtype: 'message_replied';

  hidden: boolean;
  channel: string;
  event_ts: string;
  ts: string;

  message: SlackAPIMessage;
}

interface SlackAPIEventThreadBroadcast {
  type: 'message';
  subtype: 'thread_broadcast';

  message: SlackAPIMessage;
}

interface SlackAPIEventMessage {
  type: 'message';
  channel_type: 'im' | 'group';

  bot_id?: string;
  bot_profile?: {
    id: string;
    deleted: boolean;
    name: string;
    updated: number;
    app_id: string;
    icons: object;
    team_id: string;
  };

  channel: string;
  user: string;
  text: string;
  ts: string;
  event_ts: string;
}

interface SlackAPIEventMessageGroupJoin {
  type: 'message';
  subtype: 'group_join';
  channel_type: 'group';

  ts: string;
  user: string;
  text: string;
  inviter: string; // user id
  channel: string;
  event_ts: string;
}

type SlackEventApiEvent =
  SlackAPIEventMessageBot |
  SlackAPIEventMessageMe |
  SlackAPIEventMessageChanged |
  SlackAPIEventMessageDeleted |
  SlackAPIEventMessageReplied |
  SlackAPIEventThreadBroadcast |
  SlackAPIEventMessageGroupJoin;
