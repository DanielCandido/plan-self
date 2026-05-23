import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRole } from './index.js';

test('hasRole respects hierarchy', () => {
  assert.equal(hasRole('OWNER', 'ADMIN'), true);
  assert.equal(hasRole('MEMBER', 'MANAGER'), false);
  assert.equal(hasRole('GUEST', 'GUEST'), true);
});
