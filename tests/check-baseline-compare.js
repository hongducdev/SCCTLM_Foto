// Run: node tests/check-baseline-compare.js
const assert = require('node:assert/strict');
const { compare, histogramDistance } = require('./compare-baselines');

const histogram = shift => Array.from({ length: 256 }, (_, i) => (i === 100 + shift ? 900 : 1));
const layer = (extra = {}) => ({ name: 'x', type: 'ArtLayer', kind: 'LayerKind.NORMAL', visible: true, opacity: 100, blend: 'BlendMode.NORMAL', ...extra });
const run = (extra = {}) => ({ command: 'WT', image: 'stripes', ok: true, layers: [layer()], histogram: histogram(0), ...extra });
const recording = (...runs) => ({ format: 1, results: runs });

assert.deepEqual(compare(recording(run()), recording(run({ layers: [layer({ name: 'renamed' })] }))), [], 'layer names are not compared');
assert.equal(histogramDistance(histogram(0), histogram(0)), 0);
assert.ok(histogramDistance(histogram(0), histogram(40)) > 0.5);
assert.match(compare(recording(run()), recording(run({ layers: [layer({ opacity: 80 })] })))[0], /layer structure differs/);
assert.match(compare(recording(run()), recording(run({ layers: [layer({ blend: 'BlendMode.MULTIPLY' })] })))[0], /layer structure differs/);
assert.match(compare(recording(run()), recording(run({ layers: [layer(), layer()] })))[0], /layer structure differs/);
assert.match(compare(recording(run()), recording(run({ histogram: histogram(40) })))[0], /histogram distance/);
assert.deepEqual(compare(recording(run()), recording(run({ histogram: histogram(40) })), 1), [], 'the threshold is configurable');
assert.match(compare(recording(run()), recording(run({ ok: false, error: 'boom' })))[0], /ok true -> false \(boom\)/);
assert.match(compare(recording(run()), recording())[0], /missing from the new recording/);
assert.match(compare(recording(), recording(run()))[0], /not in the baseline/);
assert.match(compare(recording(run()), recording(run({ histogram: [] })))[0], /histogram distance Infinity/);
assert.deepEqual(compare(recording(run({ ok: false, error: 'a' })), recording(run({ ok: false, error: 'b' }))), [], 'a command failing in both is not a regression');
console.log('PASS: baseline comparison (structure, blend/opacity, histogram threshold, missing/extra runs)');
