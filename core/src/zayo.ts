import { v4 as uuidV4 } from 'uuid';
import { ContinuationLocal } from './lib/continuation-locals';
import { Logger } from './logger';
import { Skill } from './skill';
import { Integration } from "./integration";
import { Eventing } from "./eventing";

export type SkillConstructor<T> = new (zayo: Zayo) => T;
export type Newable<T> = new (...args: any[]) => T;
type IntegrationConstructor = (zayo: Zayo) => Record<string, Integration>;

export interface Context {
  interactionId: string;
  skill: Skill;
}

export class Zayo {
  public readonly logger = new Logger(this, 'zayo');

  private skills: Skill[] = [];
  private integrations: Record<string, Integration>;
  private started?: Promise<void>;

  public readonly interactionContext = new ContinuationLocal<Context>();
  public readonly eventing = new Eventing(this, this.logger);

  constructor(integrations: IntegrationConstructor) {
    this.integrations = integrations(this);
  }

  registerSkill(skillConstructor: SkillConstructor<Skill>) {
    const skill = new skillConstructor(this);

    this.skills.push(skill);

    if (this.started) {
      this.started
        .then(() => skill.initialize())
        .catch(error => {
          this.logger.error('Could not initialize skill', {
            error,
            skill: skill.name
          });
        });
    }
  }

  get _internal_skills(): Skill[] {
    return this.skills;
  }

  get inInteraction(): boolean {
    return this.interactionContext.get() !== undefined;
  }

  get context(): Context {
    const context = this.interactionContext.get();

    if (!context) {
      throw new Error(
        'Cannot call Zayo#context from outside of an interaction'
      );
    }

    return context;
  }

  async start() {
    if (this.started) {
      return;
    }

    this.logger.info('Hello Zayo', { version: '2.0' });

    // Doing this to prevent any skill registrations while this is going on
    // to affect it. Otherwise, this may cause some skills to be initialized twice.
    const skills = [...this.skills];

    this.started = (async () => {
      await Promise.all(Object.values(this.integrations).map(i => i.start()));

      for (const skill of skills) {
        await skill.initialize();
      }
    })();

    await this.started;
  }

  async interact<T>(skill: Skill, callback: () => T | Promise<T>, info: Record<string, any> = {}): Promise<T> {
    const parentContext = this.interactionContext.get();
    const context = parentContext && parentContext.skill === skill ? parentContext : {
      interactionId: parentContext?.interactionId ?? uuidV4(),
      skill
    };

    try {
      if (context === parentContext) {
        return await callback();
      }

      return await this.interactionContext.set(
        {
          interactionId: parentContext?.interactionId ?? uuidV4(),
          skill
        },
        callback
      );
    } catch (error) {
      this.logger.error('Error during interaction', {
        error,
        context: {
          skill: context.skill.name,
          interactionId: context.interactionId
        },
        parentContext: parentContext && {
          skill: parentContext.skill.name,
          interactionId: parentContext.interactionId
        },
        info
      });

      throw error;
    }
  }

  async interactHandlingErrors(skill: Skill, callback: () => unknown, info: Record<string, any> = {}): Promise<void> {
    try {
      await this.interact(skill, callback, info);
    } catch (_error) {
      // Relying on the handler in `interact` to log the error
    }
  }

  integration<T extends Integration>(klass: Newable<T>): T {
    const instances = Object.values(this.integrations).filter(
      integration => integration.constructor === klass
    ) as T[];

    if (instances.length === 0) {
      throw new Error(`No ${klass.name} integrations configured`);
    }

    if (instances.length === 2) {
      throw new Error(`More than one ${klass.name} integration configured`);
    }

    return instances[0];
  }
}
