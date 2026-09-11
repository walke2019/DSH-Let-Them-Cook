import {readFileSync} from 'node:fs';
const root=process.argv[2]||'.';
const editor=readFileSync(root+'/src/client/GroupChatRoleEditor.tsx','utf8');
const host=readFileSync(root+'/src/index.ts','utf8');
const panel=readFileSync(root+'/src/client/GroupChatPanel.tsx','utf8');
const result={modelEditor:editor.includes('GroupChatModelSettings'),fallbackSave:host.includes('resiliencePolicy: body.resiliencePolicy'),fullHeightScroll:panel.includes('gc-scroll-content'),smallerFont:panel.includes('font-size:13px;line-height:1.7')};
console.log(JSON.stringify(result));process.exit(Object.values(result).every(Boolean)?0:1);
