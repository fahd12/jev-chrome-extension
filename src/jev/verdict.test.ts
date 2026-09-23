import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSlopScore } from './verdict';

describe('isSlopScore', () => {
  it('does not mark a score equal to the threshold', () => {
    assert.equal(isSlopScore(0.8), false);
  });

  it('marks a score above the threshold', () => {
    assert.equal(isSlopScore(0.81), true);
  });

  it('does not mark a low score', () => {
    assert.equal(isSlopScore(0.2), false);
  });
});
