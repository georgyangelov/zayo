export interface SlackPostMessageResponse {
  ok: true;
  channel: string;
  ts: string;
  message: {
    bot_id: string;
    type: 'message';

    // TODO: This may have blocks
    text: string;

    user: string;
    ts: string;
    thread_ts?: string;
    team: string;
    bot_profile?: object;
  }
}

export interface SlackAPIMessage {
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

export interface SlackAPIEventMessageBot {
  type: 'message';
  subtype: 'bot_message',
  channel: string;
  ts: string;
  text: string;
  bot_id: string;
  username: string;
  icons: object;
}

export interface SlackAPIEventMessageMe {
  type: 'message';
  subtype: 'me_message';
  channel: string;
  user: string;
  ts: string;
  text: string;
}

export interface SlackAPIEventMessageChanged {
  type: 'message';
  subtype: 'message_changed';
  hidden: boolean;
  channel: string;
  ts: string;
  message: SlackAPIMessage;
}

export interface SlackAPIEventMessageDeleted {
  type: 'message';
  subtype: 'message_deleted';
  hidden: boolean;
  channel: string;
  ts: string;
  deleted_ts: string; // The timestamp of the message that was deleted
}

export interface SlackAPIEventMessageReplied {
  type: 'message';

  // This is missing because of a bug
  // subtype: 'message_replied';

  hidden: boolean;
  channel: string;
  event_ts: string;
  ts: string;

  message: SlackAPIMessage;
}

export interface SlackAPIEventThreadBroadcast {
  type: 'message';
  subtype: 'thread_broadcast';

  message: SlackAPIMessage;
}

export interface SlackAPIEventMessage {
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
  thread_ts?: string;
  event_ts: string;
}

export interface SlackAPIEventMessageGroupJoin {
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

export type SlackEventApiEvent =
  SlackAPIEventMessageBot |
  SlackAPIEventMessageMe |
  SlackAPIEventMessageChanged |
  SlackAPIEventMessageDeleted |
  SlackAPIEventMessageReplied |
  SlackAPIEventThreadBroadcast |
  SlackAPIEventMessageGroupJoin;
