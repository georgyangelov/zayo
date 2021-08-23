interface Continuation<Context, Result> {
  context: Context;
  addTime: Date;

  resolve: (value: Result) => void;
  reject: (error: any) => void;
}

export class ContinuationCancelled implements Error {
  name = 'ContinuationCancelled';
  stack = new Error().stack;
  message = `Continuation cancelled ${this.continuationKey}`;

  constructor(public readonly continuationKey: string) {}
}

// TODO: Would this pass the continuation-local values?
export class Continuations<Context, Result> {
  private continuations = new Map<string, Continuation<Context, Result>>();

  has(id: string): boolean {
    return this.continuations.has(id);
  }

  cancelOldContinuations(olderThanMs: number) {
    Array.from(this.continuations.entries()).forEach(([key, continuation]) => {
      if (new Date().getTime() - continuation.addTime.getTime() > olderThanMs) {
        continuation.reject(new ContinuationCancelled(key));
      }
    });
  }

  cancel(predicate: (key: string, context: Context) => boolean) {
    Array.from(this.continuations.entries()).forEach(([key, continuation]) => {
      if (predicate(key, continuation.context)) {
        continuation.reject(new ContinuationCancelled(key));
      }
    });
  }

  await(key: string, context: Context): Promise<Result> {
    return new Promise<any>((resolve, reject) => {
      this.continuations.set(key, {
        addTime: new Date(),
        context,

        resolve: value => {
          this.continuations.delete(key);
          resolve(value);
        },

        reject: error => {
          this.continuations.delete(key);
          reject(error);
        }
      });
    });
  }

  resolve(key: string, value: Result) {
    const continuation = this.continuations.get(key);

    if (!continuation) {
      throw new Error(`No continuation for id ${key}`);
    }

    continuation.resolve(value);
  }

  reject(key: string, error: any) {
    const continuation = this.continuations.get(key);

    if (!continuation) {
      throw new Error(`No continuation for id ${key}`);
    }

    continuation.reject(error);
  }
}
