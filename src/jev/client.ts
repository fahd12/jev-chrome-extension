import {
  AuthenticationError,
  BadRequestError,
  RateLimitError,
  TypeSafeClient,
} from '@typesafe-ai/sdk';
import { buildQuestions, buildState, JEV_MODEL } from './questions';
import type { Platform } from '../shared/types';
import type { JevScores } from './verdict';

type SystemOneResponse = {
  model?: string;
  answers: {
    isAi: { noul: number };
    isFake: { noul: number };
    postType?: { choice?: string; confidence?: number };
  };
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function retryAfterMs(error: unknown): number {
  if (error instanceof RateLimitError) {
    const header = (error as { headers?: { get?: (name: string) => string | null } })
      .headers;
    const raw = header?.get?.('retry-after');
    const seconds = raw ? Number(raw) : NaN;
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 15_000);
    }
  }
  return 1500;
}

function toScores(response: SystemOneResponse): JevScores {
  return {
    isAi: response.answers.isAi.noul,
    isFake: response.answers.isFake.noul,
    postType: response.answers.postType?.choice,
    postTypeConfidence: response.answers.postType?.confidence,
    model: response.model,
  };
}

/**
 * Official SDK path. Chrome service workers are a browser context, so
 * `dangerouslyAllowBrowser` is required. The key still never leaves the
 * extension (popup + service worker only).
 */
function createSdkClient(apiKey: string): TypeSafeClient {
  return new TypeSafeClient({
    apiKey,
    defaultModel: JEV_MODEL,
    dangerouslyAllowBrowser: true,
  });
}

/**
 * Fetch fallback if the SDK HTTP client cannot run in the worker.
 * Question objects from `noul()` / `choice()` are sent as-is.
 */
async function systemOneFetch(
  apiKey: string,
  state: ReturnType<typeof buildState>,
): Promise<SystemOneResponse> {
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: JEV_MODEL,
      state,
      questions: buildQuestions(),
    }),
  });

  if (response.status === 401) {
    const error = new Error(
      'Cannot authenticate with the server. Please check your API key and try again.',
    );
    error.name = 'AuthenticationError';
    throw error;
  }

  if (response.status === 429) {
    const error = new Error('Rate limited by TypeSafe.');
    error.name = 'RateLimitError';
    throw error;
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`TypeSafe API ${response.status}: ${detail || response.statusText}`);
  }

  return (await response.json()) as SystemOneResponse;
}

async function systemOneSdk(
  apiKey: string,
  state: ReturnType<typeof buildState>,
): Promise<SystemOneResponse> {
  const client = createSdkClient(apiKey);
  return (await client.systemOne({
    model: JEV_MODEL,
    state,
    questions: buildQuestions(),
  })) as SystemOneResponse;
}

export function describeJevError(error: unknown): { kind: 'auth' | 'other'; message: string } {
  if (error instanceof AuthenticationError || (error instanceof Error && error.name === 'AuthenticationError')) {
    return {
      kind: 'auth',
      message: 'TypeSafe rejected the API key. Check it in the popup.',
    };
  }
  if (error instanceof BadRequestError) {
    return { kind: 'other', message: 'TypeSafe rejected the request.' };
  }
  if (error instanceof RateLimitError || (error instanceof Error && error.name === 'RateLimitError')) {
    return { kind: 'other', message: 'TypeSafe rate limit reached. Retrying shortly.' };
  }
  if (error instanceof Error) {
    return { kind: 'other', message: error.message };
  }
  return { kind: 'other', message: 'Unexpected TypeSafe error.' };
}

export async function evaluatePost(
  apiKey: string,
  input: { platform: Platform; text: string; author?: string },
): Promise<JevScores> {
  const state = buildState(input);
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      try {
        return toScores(await systemOneSdk(apiKey, state));
      } catch (sdkError) {
        // Constructor / Node-only failures fall through to raw fetch.
        if (
          sdkError instanceof AuthenticationError ||
          sdkError instanceof RateLimitError ||
          sdkError instanceof BadRequestError
        ) {
          throw sdkError;
        }
        return toScores(await systemOneFetch(apiKey, state));
      }
    } catch (error) {
      lastError = error;
      const rateLimited =
        error instanceof RateLimitError ||
        (error instanceof Error && error.name === 'RateLimitError');
      if (rateLimited && attempt === 0) {
        await sleep(retryAfterMs(error));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}
