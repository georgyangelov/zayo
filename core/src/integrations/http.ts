import { Skill } from '../skill';
import { Integration } from '../integration';
import { Zayo } from '../zayo';
import fetch, { BodyInit, FetchError, HeadersInit, RequestInfo, RequestInit, RequestRedirect, Response } from 'node-fetch';
import { AbortSignal } from 'node-fetch/externals';
import { Agent } from 'http';
import { URL } from 'url';

export { RequestInfo, RequestInit, Response };

export interface RequestConfig {
  // zayo additional props
  url: string;
  query?: Record<string, string | number | undefined>;
  ignoreStatusCodeErrors?: boolean;

  // fetch properties
  body?: BodyInit;
  headers?: HeadersInit;
  method?: string;
  redirect?: RequestRedirect;
  signal?: AbortSignal | null;

  // node-fetch extensions
  agent?: Agent | ((parsedUrl: URL) => Agent);
  compress?: boolean;
  follow?: number;
  size?: number;
  timeout?: number;
}

export class HTTPStatusCodeError extends FetchError {
  constructor(public readonly response: Response) {
    super(`Non-successful status code: ${response.status}`, 'http-status-code');
  }
}

export class HTTP extends Integration {
  name = 'http' as const;

  constructor(private zayo: Zayo) {
    super();
  }

  actionsFor<T extends Skill>(skill: T) {
    const logger = skill.logger.child(this.name);

    return {
      fetch: async ({
        url,
        query = {},
        ignoreStatusCodeErrors = false,
        ...fetchConfig
      }: RequestConfig): Promise<Response> => {
        const urlWithQuery = new URL(url);

        Object.entries(query).forEach(([name, value]) => {
          if (value === undefined) {
            return;
          }

          urlWithQuery.searchParams.set(name, value.toString());
        });

        try {
          const response = await fetch(urlWithQuery, fetchConfig);

          if (!response.ok) {
            throw new HTTPStatusCodeError(response);
          }

          return response;
        } catch (error) {
          if (error.name === 'AbortError') {
            logger.info('HTTP request aborted', { url, query, ignoreStatusCodeErrors, error });
          } else {
            logger.error('HTTP request error', { url, query, ignoreStatusCodeErrors, error });
          }

          throw error;
        }
      }
    };
  }
}
