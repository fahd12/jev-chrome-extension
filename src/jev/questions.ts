import { choice, noul } from '@typesafe-ai/sdk';
import type { Platform } from '../shared/types';

/** Stay well under Jev's 32k-token state budget. */
export const MAX_POST_CHARS = 8000;

export const JEV_MODEL = 'jev-1.13.0';

export type JevState = {
  platform: Platform;
  postText: string;
  author?: string;
};

/**
 * Jev is not generative. These helpers only define typed questions;
 * the model returns calibrated probabilities, never prose.
 */
export function buildQuestions() {
  return {
    // Noul = yes/no probability in [0, 1]. There is no separate confidence field.
    isAi: noul(
      'Is this text likely written by a large language model (AI) based on patterns like unusual uniformity, hedging phrases, or specific AI tells?',
      {
        true: 'The writing shows LLM tells: uniform cadence, generic hedging, or template-like structure.',
        false: 'The writing looks like a human social post: irregular, personal, or informal.',
      },
    ),
    isFake: noul(
      'Does this post contain signs of misinformation, such as sensationalist language, lack of credible sources, or emotionally manipulative phrasing typical of fake news?',
      {
        true: 'Sensational, source-free, or emotionally manipulative phrasing typical of fake news.',
        false: 'Ordinary opinion, personal update, or reasonably sourced information.',
      },
    ),
    // Choice includes a confidence field used only in the tooltip, not the Uncertain gate.
    postType: choice('What type of post is this?', {
      news: 'Claims a factual news event or current-affairs report',
      opinion: 'Commentary, argument, or personal take',
      personal: 'Everyday life update or conversation',
      promotional: 'Marketing, selling, or self-promo',
      other: 'None of the listed types',
    }),
  };
}

export function buildState(input: {
  platform: Platform;
  text: string;
  author?: string;
}): JevState {
  const postText =
    input.text.length > MAX_POST_CHARS
      ? `${input.text.slice(0, MAX_POST_CHARS)}…`
      : input.text;

  const state: JevState = {
    platform: input.platform,
    postText,
  };

  if (input.author?.trim()) {
    state.author = input.author.trim();
  }

  return state;
}
