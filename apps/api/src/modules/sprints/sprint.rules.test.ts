import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCapacity,
  calculateVelocity,
  canMoveTask,
  computeSprintMetrics,
} from './sprint.rules.ts';

test('calculateCapacity sums member capacity using availability', () => {
  assert.equal(
    calculateCapacity(10, [
      { dailyCapacity: 8, availabilityPercent: 100 },
      { dailyCapacity: 8, availabilityPercent: 50 },
    ]),
    120,
  );
});

test('calculateVelocity averages historical completed points', () => {
  assert.equal(calculateVelocity([20, 30, 40]), 30);
  assert.equal(calculateVelocity([]), 0);
});

test('canMoveTask respects member ownership and guest readonly access', () => {
  assert.equal(canMoveTask('OWNER', false), true);
  assert.equal(canMoveTask('MEMBER', true), true);
  assert.equal(canMoveTask('MEMBER', false), false);
  assert.equal(canMoveTask('GUEST', true), false);
});

test('computeSprintMetrics calculates warnings and health score', () => {
  const metrics = computeSprintMetrics(
    [
      { state: 'DONE', storyPoints: 8, isBlocked: false },
      { state: 'IN_PROGRESS', storyPoints: 13, isBlocked: true },
    ],
    15,
    18,
  );

  assert.equal(metrics.totalStoryPoints, 21);
  assert.equal(metrics.completedPoints, 8);
  assert.equal(metrics.remainingPoints, 13);
  assert.equal(metrics.blockedPoints, 13);
  assert.equal(metrics.warnings.length, 2);
  assert.ok(metrics.healthScore < 100);
});
