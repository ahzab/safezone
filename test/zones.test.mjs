import test from 'node:test';
import assert from 'node:assert/strict';
import { ZONES, isMeasured, resolveZone, safePolygon, coveredEdges } from '../src/zones.js';

const allZones = Object.entries(ZONES).flatMap(([platform, p]) =>
  ['app', 'ads'].filter((mode) => p[mode]).map((mode) => [`${platform}.${mode}`, p[mode]]),
);

test('every zone is a valid rectangle inside the frame', () => {
  for (const [name, z] of allZones) {
    for (const key of ['x0', 'x1', 'y0', 'y1']) {
      assert.ok(z[key] >= 0 && z[key] <= 1, `${name}.${key} is outside 0..1`);
    }
    assert.ok(z.x0 < z.x1, `${name}: x0 must be left of x1`);
    assert.ok(z.y0 < z.y1, `${name}: y0 must be above y1`);
  }
});

test('a button column sits inside its zone', () => {
  for (const [name, z] of allZones) {
    if (!z.cut) continue;
    assert.ok(z.cut.w > 0 && z.cut.w < z.x1 - z.x0, `${name}: column is wider than the zone`);
    assert.ok(z.cut.y > z.y0 && z.cut.y < z.y1, `${name}: column starts outside the zone`);
  }
});

test('every platform has an ad zone and a source', () => {
  for (const [platform, p] of Object.entries(ZONES)) {
    assert.ok(p.ads, `${platform} has no ad zone`);
    assert.match(p.source, /^https:\/\//, `${platform} has no source link`);
  }
});

test('an unmeasured platform falls back to its ad zone', () => {
  assert.equal(isMeasured('shorts'), false);
  assert.equal(resolveZone('shorts', 'app'), ZONES.shorts.ads);
  assert.equal(resolveZone('tiktok', 'app'), ZONES.tiktok.app);
  assert.equal(resolveZone('tiktok', 'ads'), ZONES.tiktok.ads);
});

test('the right-to-left polygon mirrors the button column', () => {
  const z = ZONES.tiktok.app;
  const ltr = safePolygon(z, 'ltr');
  const rtl = safePolygon(z, 'rtl');
  assert.equal(ltr.length, 6);
  assert.equal(rtl.length, 6);
  // left to right: the notch is on the right, so the bottom edge stops short of x1
  assert.ok(ltr.some(([x, y]) => x === z.x1 - z.cut.w && y === z.y1));
  // right to left: the notch is on the left, so the bottom edge starts after x0
  assert.ok(rtl.some(([x, y]) => x === z.x0 + z.cut.w && y === z.y1));
});

test('a zone without a column is a plain rectangle', () => {
  assert.equal(safePolygon(ZONES.reels.ads).length, 4);
});

test('covered edges add up with the safe area', () => {
  const z = ZONES.reels.ads;
  const e = coveredEdges(z);
  assert.ok(Math.abs(e.top - 0.14) < 1e-9);
  assert.ok(Math.abs(e.bottom - 0.35) < 1e-9);
  assert.ok(Math.abs(e.left - 0.06) < 1e-9 && Math.abs(e.right - 0.06) < 1e-9);
});
