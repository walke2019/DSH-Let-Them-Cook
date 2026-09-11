import {readFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
const source=readFileSync(process.argv[2],'utf8');const css=source.split('export const LAYOUT_PUSH_CSS = `')[1].split('`')[0]
const fn=`() => {
 const f=document.createElement('iframe');document.body.append(f);
 try {const d=f.contentDocument;d.open();d.write('<html><head><style>'+${JSON.stringify(css)}+'</style></head><body data-dsh-group-chat-active="true"><div id="root"><div data-conversation-scroll style="height:400px"><div class="viewArea"><div data-panel>Group chat panel</div></div><div data-composer-seat>Native composer</div></div></div></body></html>');d.close();
 const scroll=d.querySelector('[data-conversation-scroll]');const seat=d.querySelector('[data-composer-seat]');
 const visible=f.contentWindow.getComputedStyle(scroll).display!=='none';
 const hidden=f.contentWindow.getComputedStyle(seat).display==='none';
 d.body.removeAttribute('data-dsh-group-chat-active');const restored=f.contentWindow.getComputedStyle(seat).display!=='none';
 return {visible,hidden,restored};} finally {f.remove()}
}`
const r=spawnSync(process.execPath,[process.env.APPDATA+'/npm/node_modules/mcporter/dist/cli.js','call','mcp-chrome-devtools.evaluate_script','--args',JSON.stringify({pageId:8,function:fn,args:[]})],{encoding:'utf8'})
const m=r.stdout.match(/```json\s*([\s\S]*?)```/);if(!m)throw Error(r.stdout+r.stderr)
const result=JSON.parse(m[1]);const ok=Object.values(result).every(Boolean)
console.log((ok?'PASS':'FAIL')+': '+JSON.stringify(result));process.exitCode=ok?0:1
