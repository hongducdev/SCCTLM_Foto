// Read-only inventory comparison; run: node tests/compare-dr6.js [original directory]
// NOTE: since the 2026-09-16 trim the panel intentionally keeps only 26 working commands,
// so missingCommands is an expected inventory difference, not a failure. Only missing
// shared resources (jsx/pj/*) fail this check.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const original = process.argv[2] || 'D:/DR6 MHK-20260915T042335Z-1-001/DR6 MHK';
function files(dir, prefix = '') {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const name = prefix + entry.name;
        return entry.isDirectory() ? files(path.join(dir, entry.name), name + '/') : [name];
    });
}
const oldFiles = files(original);
const currentFiles = files(path.join(root, 'jsx'));
const read = file => fs.readFileSync(file, 'utf8');
function commands(html) {
    return [...new Set([...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/(?:doa|onClickButton|onClickButtzon)\('([^']+)'\)/g)].map(m => m[1]))];
}
const html = read(path.join(root, 'index.html'));
const oldCommands = commands(read(path.join(original, 'index.html')));
const newCommands = commands(html);
// OL is the old startup hook, not an image-editing button (see original body onload).
const omittedStartupHooks = oldCommands.filter(name => name === 'OL' && !newCommands.includes(name));
const missingCommands = oldCommands.filter(name => !newCommands.includes(name) && !omittedStartupHooks.includes(name));
const missingJsx = oldFiles.filter(name => /^jsx\/.+\.(jsx|jsxbin)$/i.test(name) && !currentFiles.includes(name.slice(4)));
const resources = oldFiles.filter(name => /^jsx\/pj\//.test(name));
const missingResources = resources.filter(name => !fs.existsSync(path.join(root, name)));
const patterns = oldFiles.filter(name => /\.(pat|atn|abr)$/i.test(name));
const disabled = [...html.matchAll(/<button\b([^>]*\bdisabled\b[^>]*)>([^<]*)<\/button>/g)].map(m => ({
    label: m[2], command: (m[1].match(/doa\('([^']+)'\)/) || [])[1] || null,
    reason: (m[1].match(/title="([^"]*)"/) || [])[1]
}));
const main = ['main.jsx'].concat(fs.readdirSync(path.join(root, 'jsx')).filter(name => /^skin-.*\.jsx$/.test(name)))
    .map(name => read(path.join(root, 'jsx', name))).join('\n');
const patternIds = [...new Set([...main.matchAll(/putString\(cTID\("Idnt"\), "([^"]+)"\)/g)].map(m => m[1]))];
const report = { original, originalCommandCount: oldCommands.length, currentCommandCount: newCommands.length,
    missingCommands, omittedStartupHooks, missingJsx, originalResourceCount: resources.length, missingResources,
    patternFilesInOriginal: patterns, ppJsInOriginal: oldFiles.filter(name => /(^|\/)pp\.js$/i.test(name)),
    referencedPatternIds: patternIds, disabled };
console.log(JSON.stringify(report, null, 2));
if (missingResources.length) process.exitCode = 1;
