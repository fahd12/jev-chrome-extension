import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createMockDetector, MOCK_DELAY_MS, MOCK_SLOP_PERCENT, mockVerdict } from './mock';

const noDelay = async (): Promise<void> => undefined;

describe('mockVerdict', () => {
  it('returns the same result for the same text', () => {
    const text = 'The same post text, checked twice in a row by the mock detector.';
    assert.equal(mockVerdict(text), mockVerdict(text));
  });

  it('marks about MOCK_SLOP_PERCENT of distinct texts', () => {
    const total = 2000;
    let marked = 0;
    for (let i = 0; i < total; i += 1) {
      if (mockVerdict(`Post number ${i} about topic ${i * 7} with some filler words`)) {
        marked += 1;
      }
    }
    const ratio = marked / total;
    const expected = MOCK_SLOP_PERCENT / 100;
    assert.ok(Math.abs(ratio - expected) <= 0.05, `ratio was ${ratio}`);
  });
});

describe('createMockDetector', () => {
  it('waits within the delay range for random = 0 and random close to 1', async () => {
    for (const value of [0, 0.999999]) {
      const delays: number[] = [];
      const detector = createMockDetector(
        async (ms) => {
          delays.push(ms);
        },
        () => value,
      );
      await detector('some post text');
      assert.equal(delays.length, 1);
      assert.ok(delays[0] >= MOCK_DELAY_MS.min && delays[0] <= MOCK_DELAY_MS.max);
    }
  });

  it('resolves to mockVerdict(text)', async () => {
    const detector = createMockDetector(noDelay, () => 0.5);
    for (let i = 0; i < 50; i += 1) {
      const text = `Sample post ${i} for the detector`;
      assert.equal(await detector(text), mockVerdict(text));
    }
  });
});
