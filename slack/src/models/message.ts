import dayjs from "dayjs";

export class SlackMessage {
  // TODO: Object as parameter
  constructor(
    public id: string,
    public channelId: string,
    public text: string,
    public channelType: 'im' | 'group',
    public threadId: string | undefined,
    public userId: string
  ) {}

  public get inThread() {
    return !!this.threadId;
  }

  public get date() {
    const date = dayjs.unix(parseFloat(this.id));

    if (!date.isValid()) {
      throw new Error(`Got invalid date from a Slack message\'s ts value: ${this.id}`);
    }

    return date;
  }
}
