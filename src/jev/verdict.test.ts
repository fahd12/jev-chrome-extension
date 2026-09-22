import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_SETTINGS } from '../shared/types';
import { mapVerdict } from './verdict';

const bothOn = DEFAULT_SETTINGS;

describe('mapVerdict', () => {
  it('flags likely AI above 0.8', () => {
    const verdict = mapVerdict({ isAi: 0.81, isFake: 0.1 }, bothOn);
    assert.equal(verdict.kind, 'likely_ai');
    assert.equal(verdict.tone, 'red');
  });

  it('flags potential misinfo above 0.7', () => {
    const verdict = mapVerdict({ isAi: 0.1, isFake: 0.71 }, bothOn);
    assert.equal(verdict.kind, 'misinfo');
    assert.equal(verdict.tone, 'red');
  });

  it('combines both hard flags', () => {
    const verdict = mapVerdict({ isAi: 0.9, isFake: 0.8 }, bothOn);
    assert.equal(verdict.kind, 'likely_ai_misinfo');
  });

  it('treats AI mid-band as uncertain when nothing is flagged', () => {
    const verdict = mapVerdict({ isAi: 0.5, isFake: 0.1 }, bothOn);
    assert.equal(verdict.kind, 'uncertain');
    assert.equal(verdict.tone, 'amber');
  });

  it('treats misinfo mid-band as uncertain when nothing is flagged', () => {
    const verdict = mapVerdict({ isAi: 0.1, isFake: 0.5 }, bothOn);
    assert.equal(verdict.kind, 'uncertain');
  });

  it('does not hide a hard AI flag behind a mid-band misinfo score', () => {
    const verdict = mapVerdict({ isAi: 0.95, isFake: 0.5 }, bothOn);
    assert.equal(verdict.kind, 'likely_ai');
  });

  it('returns authentic when both nouls are clearly low', () => {
    const verdict = mapVerdict({ isAi: 0.2, isFake: 0.15 }, bothOn);
    assert.equal(verdict.kind, 'authentic');
    assert.equal(verdict.tone, 'green');
  });

  it('ignores disabled checks', () => {
    const verdict = mapVerdict(
      { isAi: 0.95, isFake: 0.9 },
      { ...bothOn, checkAi: false, checkMisinfo: true },
    );
    assert.equal(verdict.kind, 'misinfo');
  });

  it('labels human-only mode when misinfo is off', () => {
    const verdict = mapVerdict(
      { isAi: 0.1, isFake: 0.9 },
      { ...bothOn, checkMisinfo: false },
    );
    assert.equal(verdict.kind, 'authentic');
    assert.equal(verdict.label, 'Likely human');
  });
});
