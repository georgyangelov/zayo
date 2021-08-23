import { WebClient } from "@slack/web-api";
import { Logger, Skill, StringsScope, Zayo } from "@zayojs/core";
import NodeCache from "node-cache";
import { SlackMessageReceivedEvent } from "./events/message-received";
import { SlackMessage } from "./models/message";
import { SlackPostMessageResponse } from "./types/event-api";

// See https://api.slack.com/methods/users.list
interface User {
  id: string;
  name: string;
  real_name: string;

  is_bot: boolean;

  profile: {
    real_name_normalized: string;
    email: string;
  }
}

interface UserListResponse {
  members: User[];
}

export class SlackActions {
  private userCache = new NodeCache({
    deleteOnExpire: true,
    stdTTL: 1 * 60 // 1 hour
  });

  constructor(
    public api: WebClient,
    private skill: Skill,
    private strings: StringsScope,
    private logger: Logger,
    private zayo: Zayo
  ) {}

  private async getUsers() {
    const users = this.userCache.get('users') as User[] | undefined;

    if (users) {
      return users;
    }

    const { members } = (await this.api.users.list()) as any as UserListResponse;
    this.userCache.set('users', members);

    return members;
  }

  private async findUserByHandle(handle: string): Promise<User | undefined> {
    const users = await this.getUsers();

    return users.find(user => user.name === handle);
  }

  async findUserById(id: string) {
    return (await this.getUsers()).find(user => user.id === id);
  }

  async findUserByIdOrHandle(idOrHandle: string): Promise<User | undefined> {
    if (idOrHandle.startsWith('@')) {
      return this.findUserByHandle(idOrHandle.replace(/^\@/, ''));
    }

    return this.findUserById(idOrHandle);
  }

  async sendDirectMessage(userIdOrHandleWithAtSign: string, text: string): Promise<SlackMessage> {
    const user = await this.findUserByIdOrHandle(userIdOrHandleWithAtSign);

    if (!user) {
      throw new Error(`Cannot find user '${userIdOrHandleWithAtSign}'. Pass user ID or a handle starting with @`);
    }

    const response = (await this.api.chat.postMessage({
      channel: user.id,
      text
    })) as any as SlackPostMessageResponse;

    return new SlackMessage(
      response.message.ts,
      response.channel,
      response.message.text,
      'im',
      response.message.thread_ts,
      response.message.user
    );
  }

  async reply(replyTo: SlackMessage, text: string): Promise<SlackMessage> {
    const response = (await this.api.chat.postMessage({
      channel: replyTo.channelId,
      text
    })) as any as SlackPostMessageResponse;

    return new SlackMessage(
      response.message.ts,
      response.channel,
      response.message.text,
      replyTo.channelType,
      response.message.thread_ts,
      response.message.user
    );
  }

  async askForString(replyTo: SlackMessage, questionText: string) {
    const question = await this.reply(replyTo, questionText);
    const reply = await this.awaitReply(question);

    return {
      answer: reply.message.text.trim(),
      reply: reply.message
    };
  }

  async askForBool(replyTo: SlackMessage, questionText: string) {
    let attempts = 0;

    let question = await this.reply(replyTo, questionText);

    do {
      attempts++;

      const replyEvent = await this.awaitReply(question);
      const intent = (await replyEvent.analyze())?.firstIntent;

      // TODO: Unhardcode this intent name
      const isYes = intent && intent.name === 'yes';
      const isNo = intent && intent.name === 'no';

      if (!isYes && !isNo) {
        question = await this.reply(replyEvent.message, this.strings.get('cannot-understand-bool'));
        continue;
      }

      return {
        answer: isYes,
        reply: replyEvent.message
      };
    } while (attempts < 3);

    throw new Error('Could not figure out a boolean response after 3 tries');
  }

  private awaitReply(message: SlackMessage) {
    const context = this.zayo.context;

    // TODO: Continuation cancellation
    return new Promise<SlackMessageReceivedEvent>((resolve, reject) => {
      const removeListener = this.skill.addListener<SlackMessageReceivedEvent>({
        priority: 1000,
        canHandle: event => {
          return (
            event instanceof SlackMessageReceivedEvent &&
            event.message.channelId === message.channelId &&
            (
              event.message.threadId === message.threadId ||
              event.message.threadId === message.id
            )
          );
        },
        handle: async event => {
          removeListener();

          this.zayo.interactionContext.set(context, () => {
            this.logger.debug('Handling reply', { event })

            resolve(event);
          });
        }
      });
    });
  }
}
