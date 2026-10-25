import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSlopScore, SLOP_THRESHOLD } from './verdict';

describe('isSlopScore', () => {
  it('does not mark a score equal to the default threshold', () => {
    assert.equal(isSlopScore(0.8), false);
  });

  it('marks a score above the default threshold', () => {
    assert.equal(isSlopScore(0.81), true);
  });

  it('does not mark a low score', () => {
    assert.equal(isSlopScore(0.2), false);
  });

  it('uses a custom threshold when provided', () => {
    assert.equal(isSlopScore(0.65, 0.6), true);
    assert.equal(isSlopScore(0.55, 0.6), false);
  });

  it('exports the default threshold as 0.8', () => {
    assert.equal(SLOP_THRESHOLD, 0.8);
  });
});
