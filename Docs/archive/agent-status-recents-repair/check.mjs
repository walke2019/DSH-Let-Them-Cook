import {readFileSync} from 'node:fs';
const root=process.argv[2]||'.';
const panel=readFileSync(root+'/src/client/GroupChatPanel.tsx','utf8');
const model=readFileSync(root+'/src/client/GroupChatModelSettings.tsx','utf8');
const store=readFileSync(root+'/src/engine/model-settings.ts','utf8');
const index=readFileSync(root+'/src/index.ts','utf8');
const result={draggableStatus:panel.includes('onPointerDown={startDrag}')&&panel.includes('dsh-group-chat.status-pos')&&panel.includes('gc-agent-drag'),recentDeleteUi:model.includes('gc-model-delete')&&model.includes('删除最近模型'),recentDeleteApi:index.includes("'/models/recent/delete'")&&store.includes('forget(model:ModelRef)'),positionPersistence:panel.includes("localStorage.setItem('dsh-group-chat.status-pos'"),singleDeletePreservesCurrent:!model.includes('onPrimary({provider:\'\',model:\'\'})删除')};
console.log(JSON.stringify(result));process.exit(Object.values(result).every(Boolean)?0:1);
