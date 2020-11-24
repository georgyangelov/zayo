import { Skill } from '../skill';
import { Integration } from '../integration';
import { Zayo } from '../zayo';
import { SentMessageInfo, Transporter, createTransport } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

interface EmailConfig {
  transport: Transporter;
}

export type EmailOptions = Mail.Options;

export class Email extends Integration {
  name = 'email' as const;

  constructor(private zayo: Zayo, private config: EmailConfig) {
    super();
  }

  static createTransport = createTransport;

  actionsFor<T extends Skill>(skill: T) {
    const logger = skill.logger.child(this.name);

    return {
      send: async (email: EmailOptions): Promise<SentMessageInfo> => {
        try {
          const emailResult = await new Promise<SentMessageInfo>((resolve, reject) => {
            this.config.transport.sendMail(email, (error, info) => {
              if (error) {
                reject(error);
              } else {
                resolve(info);
              }
            });
          });

          logger.info('Sent email', {
            email: {
              subject: email.subject,
              to: email.to,
              bcc: email.bcc
            }
          });

          return emailResult;
        } catch (error) {
          logger.error('Could not send email', { email, error });

          throw error;
        }
      }
    };
  }
}
