import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createVerdictCache, type CacheStorage } from './cache';

function fakeStorage() {
  const data = new Map<string, boolean>();
  const calls = { get: 0, set: 0 };
  const storage: CacheStorage = {
    async get(key) {
      calls.get += 1;
      return data.get(key);
    },
    async set(key, value) {
      calls.set += 1;
      data.set(key, value);
    },
  };
  return { storage, calls, data };
}

const failingStorage: CacheStorage = {
  async get() {
    throw new Error('get failed');
  },
  async set() {
    throw new Error('set failed');
  },
};

describe('createVerdictCache', () => {
  it('misses, then hits after set', async () => {
    const { storage, data } = fakeStorage();
    const cache = createVerdictCache(storage);
    assert.equal(await cache.get('abc'), undefined);
    await cache.set('abc', true);
    assert.equal(data.get('abc'), true);
    assert.equal(await cache.get('abc'), true);
  });

  it('does not call storage.get on a memory hit', async () => {
    const { storage, calls } = fakeStorage();
    const cache = createVerdictCache(storage);
    await cache.set('abc', false);
    assert.equal(await cache.get('abc'), false);
    assert.equal(await cache.get('abc'), false);
    assert.equal(calls.get, 0);
  });

  it('reads through to storage and then serves from memory', async () => {
    const { storage, calls, data } = fakeStorage();
    data.set('abc', true);
    const cache = createVerdictCache(storage);
    assert.equal(await cache.get('abc'), true);
    assert.equal(await cache.get('abc'), true);
    assert.equal(calls.get, 1);
  });

  it('keeps working in memory when storage throws', async () => {
    const warn = console.warn;
    console.warn = () => undefined;
    try {
      const cache = createVerdictCache(failingStorage);
      assert.equal(await cache.get('abc'), undefined);
      await cache.set('abc', true);
      assert.equal(await cache.get('abc'), true);
    } finally {
      console.warn = warn;
    }
  });
});
