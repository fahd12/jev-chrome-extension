import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isLongEnough } from './hash';

function words(n: number): string {
  return Array.from({ length: n }, (_, i) => `word${i}`).join(' ');
}

describe('isLongEnough', () => {
  it('is false at 11 words', () => {
    assert.equal(isLongEnough(words(11)), false);
  });

  it('is true at 12 words', () => {
    assert.equal(isLongEnough(words(12)), true);
  });

  it('does not count extra whitespace or newlines as words', () => {
    const padded = `  \n${words(11).split(' ').join('   \n\n ')}\t \n  `;
    assert.equal(isLongEnough(padded), false);
  });
});
