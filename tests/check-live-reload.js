// Requires Photoshop with the installed SCCTLM_Foto panel open on CEP port 9004.
// Temporarily adds an HTML comment; always restores source. Does not touch images.
// Skipped unless DR7_LIVE=1 so the suite can run without Photoshop (e.g. in CI).
if (!process.env.DR7_LIVE) { console.log('SKIP: needs Photoshop with the panel open (set DR7_LIVE=1)'); process.exit(0); }
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'), source=path.join(root,'index.html');
const installed=path.join(process.env.APPDATA,'Adobe/CEP/extensions/SCCTLM_Foto/index.html');
const original=fs.readFileSync(source), marker='MHK_LIVE_RELOAD_CHECK_'+Date.now();
async function cdp(method,params={}) {
    const pages=await (await fetch('http://127.0.0.1:9004/json')).json();
    const page=pages.find(p=>decodeURI(p.url).toLowerCase()==='file:///'+installed.replace(/\\/g,'/').toLowerCase());
    assert.ok(page,'Installed SCCTLM_Foto panel must be open');
    return new Promise((resolve,reject)=>{
        const ws=new WebSocket(page.webSocketDebuggerUrl);
        const timer=setTimeout(()=>{ws.close();reject(Error('CEP timed out'));},5000);
        ws.onopen=()=>ws.send(JSON.stringify({id:1,method,params}));
        ws.onerror=()=>{clearTimeout(timer);ws.close();reject(Error('CEP connection failed'));};
        ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id!==1)return;
            clearTimeout(timer);ws.close();if(m.error||m.result.exceptionDetails)reject(Error(JSON.stringify(m)));else resolve(m.result);};
    });
}
async function evaluate(expression) {return (await cdp('Runtime.evaluate',{expression,returnByValue:true})).result.value;}
async function waitFor(check) {
    const deadline=Date.now()+15000;
    while(Date.now()<deadline){if(await check())return;await new Promise(r=>setTimeout(r,250));}
    throw Error('Timed out waiting for live reload');
}
(async()=>{
    let watcher;
    try {
        await cdp('Page.reload',{ignoreCache:true});
        await waitFor(()=>evaluate('typeof dr7Reload==="function" && typeof dr7IsBusy==="function"'));
        const before=await evaluate('performance.timing.navigationStart');
        await evaluate('document.querySelector(".reload-panel").click()');
        await waitFor(()=>evaluate('performance.timing.navigationStart>'+before+' && typeof dr7IsBusy==="function"'));
        console.log('PASS: manual panel reload');
        watcher=spawn(process.execPath,[path.join(root,'install/watch-plugin.js')],{cwd:root,stdio:['ignore','pipe','pipe'],windowsHide:true});
        watcher.stdout.on('data',chunk=>process.stdout.write(chunk));
        watcher.stderr.on('data',chunk=>process.stderr.write(chunk));
        fs.writeFileSync(source,Buffer.concat([original,Buffer.from('\n<!-- '+marker+' -->\n')]));
        await waitFor(async()=>fs.readFileSync(installed,'utf8').includes(marker)&&await evaluate('document.documentElement.outerHTML.indexOf('+JSON.stringify(marker)+')!==-1'));
        console.log('PASS: source save copied and live panel reloaded');
    } finally {
        fs.writeFileSync(source,original);
        if(watcher){
            try {await waitFor(async()=>fs.readFileSync(installed).equals(original)&&!(await evaluate('document.documentElement.outerHTML.indexOf('+JSON.stringify(marker)+')!==-1')));}
            finally {watcher.kill();}
        }
    }
    const layout=await evaluate('JSON.stringify({height:innerHeight,last:Math.ceil(document.querySelector(".action-grid").getBoundingClientRect().bottom),buttons:document.querySelectorAll(".action-grid button").length})');
    console.log('PASS: source restored; live panel '+layout);
})().catch(error=>{console.error(error);process.exitCode=1;});
