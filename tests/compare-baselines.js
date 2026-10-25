// Run: node tests/compare-baselines.js <before.json> <after.json> [--max-histogram 0.02]
// Compares two files written by tests/photoshop-baseline-record.jsx: same runs, same layer structure
// (type, kind, visibility, opacity, blend mode, child count; names are not compared), and a composite
// histogram within the threshold (half the L1 distance between the normalised histograms, 0..1).
// --samples [mean=1.5 over4=0.05 max=20] also checks the `samples` grids (recorded with $.dr7BaselineSamples): mean of the
// per-point max channel difference, share of points differing by more than 4 levels, and the largest difference.
const fs = require('node:fs');

function structure(layers) {
    return layers.map(layer => ({ type: layer.type, kind: layer.kind, visible: layer.visible, opacity: layer.opacity,
        blend: layer.blend, children: layer.children ? structure(layer.children) : undefined }));
}

function histogramDistance(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return Infinity;
    const sum = list => list.reduce((x, y) => x + y, 0) || 1, sa = sum(a), sb = sum(b);
    return a.reduce((total, value, index) => total + Math.abs(value / sa - b[index] / sb), 0) / 2;
}

const SAMPLE_LIMITS = { mean: 1.5, over4: 0.05, max: 20 };

function sampleStats(a, b) {
    const diffs = a.map((point, i) => Math.max(...point.map((v, k) => Math.abs(v - b[i][k]))));
    return { mean: diffs.reduce((x, y) => x + y, 0) / diffs.length, over4: diffs.filter(d => d > 4).length / diffs.length, max: Math.max(...diffs) };
}

function compare(before, after, maxHistogram = 0.02, sampleLimits = null) {
    const problems = [];
    const key = run => run.command + ' / ' + run.image;
    const afterRuns = new Map(after.results.map(run => [key(run), run]));
    for (const run of before.results) {
        const other = afterRuns.get(key(run));
        if (!other) { problems.push(key(run) + ': missing from the new recording'); continue; }
        afterRuns.delete(key(run));
        if (run.ok !== other.ok) { problems.push(key(run) + ': ok ' + run.ok + ' -> ' + other.ok + (other.error ? ' (' + other.error + ')' : '')); continue; }
        if (!run.ok) continue;
        if (JSON.stringify(structure(run.layers)) !== JSON.stringify(structure(other.layers))) problems.push(key(run) + ': layer structure differs');
        const distance = histogramDistance(run.histogram, other.histogram);
        if (!(distance <= maxHistogram)) problems.push(key(run) + ': histogram distance ' + distance.toFixed(4) + ' > ' + maxHistogram);
        if (sampleLimits) {
            if (!run.samples || !other.samples || run.samples.length !== other.samples.length) { problems.push(key(run) + ': samples missing'); continue; }
            const s = sampleStats(run.samples, other.samples);
            for (const name of Object.keys(sampleLimits)) if (!(s[name] <= sampleLimits[name])) problems.push(key(run) + ': samples ' + name + ' ' + s[name].toFixed(3) + ' > ' + sampleLimits[name]);
        }
    }
    for (const name of afterRuns.keys()) problems.push(name + ': not in the baseline');
    return problems;
}

module.exports = { compare, histogramDistance, structure, sampleStats, SAMPLE_LIMITS };

if (require.main === module) {
    const [beforeFile, afterFile] = process.argv.slice(2).filter(arg => !arg.startsWith('--') && !/^[\d.]+$/.test(arg) && !arg.includes('='));
    const flag = process.argv.indexOf('--max-histogram');
    const limits = process.argv.includes('--samples') ? { ...SAMPLE_LIMITS } : null;
    if (limits) for (const arg of process.argv) { const m = /^(mean|over4|max)=([\d.]+)$/.exec(arg); if (m) limits[m[1]] = Number(m[2]); }
    if (!beforeFile || !afterFile) { console.error('usage: node tests/compare-baselines.js <before.json> <after.json> [--max-histogram 0.02] [--samples [mean=1.5 over4=0.05 max=20]]'); process.exit(2); }
    const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
    const problems = compare(read(beforeFile), read(afterFile), flag > 0 ? Number(process.argv[flag + 1]) : undefined, limits);
    if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
    console.log('PASS: structure and histograms match');
}
