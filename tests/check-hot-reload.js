// Real temporary source/installation files; only the CEP transport is substituted.
// Run: node tests/check-hot-reload.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mhk-reload-'));
const source = path.join(base, 'source'), target = path.join(base, 'installed');
for (const folder of ['js','jsx','css','img','assets','install']) fs.mkdirSync(path.join(source,folder), {recursive:true});
fs.mkdirSync(target);
for (const file of ['index.html','style.css','loader.jsx']) fs.writeFileSync(path.join(source,file),'original');
fs.writeFileSync(path.join(target,'user-file.txt'),'keep');
let busy = false, race = false, reloads = 0;
const context = vm.createContext({
    require, module: {exports:{}}, __dirname: path.join(source,'install'),
    process: {argv:['node','watch-plugin.js',target],env:process.env}, console,
    setTimeout, clearTimeout, AbortSignal,
    fetch: async () => ({json:async () => [{url:'file:///'+target.replace(/\\/g,'/')+'/index.html',webSocketDebuggerUrl:'ws://cep-test'}]}),
    WebSocket: class {
        constructor() { queueMicrotask(() => this.onopen()); }
        send(message) {
            const expression = JSON.parse(message).params.expression;
            let value = !busy;
            if (expression === 'scctlmFotoReload()') { value = !race; if (value) reloads++; }
            queueMicrotask(() => this.onmessage({data:JSON.stringify({id:1,result:{result:{value}}})}));
        }
        close() {}
    }
});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../install/watch-plugin.js'),'utf8'),context);
const sync = context.module.exports.sync;
(async () => {
    try {
        await sync(); assert.equal(fs.existsSync(path.join(target,'index.html')),false,'wait for stable save');
        busy = true; await sync(); assert.equal(reloads,0,'busy command blocks copying');
        assert.equal(fs.existsSync(path.join(target,'index.html')),false);
        busy = false; await sync(); assert.equal(reloads,1);
        assert.equal(fs.readFileSync(path.join(target,'index.html'),'utf8'),'original');
        await sync(); assert.equal(reloads,1,'unchanged source does not reload');
        fs.writeFileSync(path.join(source,'js/new.js'),'new-code');
        await sync(); race = true; await sync(); assert.equal(reloads,1,'command starting before reload defers it');
        race = false; await sync(); assert.equal(reloads,2,'pending reload retries without another save');
        fs.unlinkSync(path.join(source,'js/new.js')); await sync(); await sync();
        assert.equal(reloads,3); assert.equal(fs.existsSync(path.join(target,'js/new.js')),false);
        assert.equal(fs.readFileSync(path.join(target,'user-file.txt'),'utf8'),'keep');
        console.log('PASS: stable saves, busy guard, sync, reload retry, scoped removal');
    } finally { fs.rmSync(base,{recursive:true,force:true}); }
})().catch(error => { console.error(error); process.exitCode=1; });
