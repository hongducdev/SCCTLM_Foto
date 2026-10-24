// Node 22+: node install/watch-plugin.js [installed extension directory] [--once]
// Watches only runtime files. Start manually; no startup task or service is installed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const target = path.resolve(process.argv[2] && process.argv[2] !== '--once' ? process.argv[2] :
    path.join(process.env.APPDATA, 'Adobe/CEP/extensions/SCCTLM_Foto'));
if (target === root || root.startsWith(target + path.sep)) throw new Error('Target must not contain source');
const once = process.argv.includes('--once');
const folders = ['js', 'jsx', 'css', 'img', 'presets'];
function inventory() {
    const result = new Map();
    function add(relative) {
        const data = fs.readFileSync(path.join(root, relative));
        result.set(relative, { data, hash: crypto.createHash('sha256').update(data).digest('hex') });
    }
    function walk(relative) {
        for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
            const name = path.join(relative, entry.name);
            if (entry.isDirectory()) walk(name);
            else if (entry.isFile()) add(name);
        }
    }
    for (const file of ['index.html','style.css','loader.jsx']) add(file);
    // Optional folders (e.g. an empty presets/) may be absent; a missing one must not stop the sync.
    for (const folder of folders) if (fs.existsSync(path.join(root, folder))) walk(folder);
    return result;
}
async function evaluate(expression) {
    const response = await fetch('http://127.0.0.1:9004/json', { signal: AbortSignal.timeout(2000) });
    const pages = await response.json();
    const expected = 'file:///' + target.replace(/\\/g, '/') + '/index.html';
    const page = pages.find(p => decodeURI(p.url).toLowerCase().split('?')[0] === expected.toLowerCase());
    if (!page) throw new Error('Open SCCTLM_Foto in Photoshop');
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        const timer = setTimeout(() => { ws.close(); reject(new Error('CEP timeout')); }, 3000);
        ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
        ws.onerror = () => { clearTimeout(timer); ws.close(); reject(new Error('CEP connection failed')); };
        ws.onmessage = event => {
            const message = JSON.parse(event.data);
            if (message.id !== 1) return;
            clearTimeout(timer); ws.close();
            if (message.error || message.result.exceptionDetails) reject(new Error('CEP evaluation failed'));
            else resolve(message.result.result.value);
        };
    });
}
let previous = new Map(), candidate = '', reloadPending = false, lastMessage = '';
function status(message) { if (message !== lastMessage) { console.log(message); lastMessage = message; } }
async function sync() {
    const next = inventory();
    const signature = [...next].map(([name,item]) => name + item.hash).join('|');
    // Require identical scans before copying a save that may still be in progress.
    if (!once && candidate !== signature) { candidate = signature; return; }
    const changed = [...next].filter(([name,item]) => {
        if (previous.has(name)) return previous.get(name).hash !== item.hash;
        const installed = path.join(target,name);
        return !fs.existsSync(installed) || crypto.createHash('sha256').update(fs.readFileSync(installed)).digest('hex') !== item.hash;
    });
    const removed = [...previous.keys()].filter(name => !next.has(name));
    if (!changed.length && !removed.length && !reloadPending) { previous = next; return; }
    // Also pause copying while a running handler might still read its resources.
    const allowed = await evaluate('typeof dr7IsBusy === "function" && !dr7IsBusy()');
    if (!allowed) { status('Waiting for the current Photoshop command to finish...'); return; }
    for (const [name,item] of changed) {
        const destination = path.join(target,name);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination,item.data);
    }
    // Only files tracked from this source session are removed; no broad mirror/delete.
    for (const name of removed) fs.rmSync(path.join(target,name), { force: true });
    // The GitHub updater's record no longer matches the copied files; a later update re-checks all.
    fs.rmSync(path.join(target, '.dr7-version.json'), { force: true });
    fs.rmSync(path.join(target, '.dr7-update.json'), { force: true });          // a half-finished GitHub update must not overwrite what was just copied
    fs.rmSync(path.join(target, '.dr7-update'), { recursive: true, force: true });
    previous = next; reloadPending = true;
    const reloaded = await evaluate('dr7Reload()');
    if (!reloaded) { status('Changes copied; waiting to reload after the current command.'); return; }
    reloadPending = false;
    status('Synced ' + changed.length + ' files, removed ' + removed.length + '; SCCTLM_Foto reloaded.');
}
async function main() {
    console.log('SCCTLM_Foto hot reload: ' + root + ' -> ' + target);
    do {
        try { await sync(); }
        catch (error) { status(error.message); if (once) { process.exitCode = 1; return; } }
        if (!once) await new Promise(resolve => setTimeout(resolve,1000));
    } while (!once);
}
if (require.main === module) main();
module.exports = { sync };
