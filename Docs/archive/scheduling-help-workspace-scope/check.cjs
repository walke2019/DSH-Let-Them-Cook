const fs=require('fs');
const path=require('path');
const root=process.argv[2]||'.';
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
const index=read('src/index.ts');
const side=read('src/client/GroupChatSideDock.tsx');
const model=read('src/engine/model-settings.ts');
const hasWorkspaceStore=fs.existsSync(path.join(root,'src/engine/workspace-settings.ts'));
const result={
  noGlobalHomedir:!index.includes('homedir()')&&!index.includes("from 'node:os'"),
  modelSettingsWorkspace:index.includes("process.cwd(), '.pm-workflow', 'dsh-group-chat', 'model-settings.json'"),
  roomsWorkspace:index.includes("process.cwd(), '.pm-workflow', 'dsh-group-chat', 'rooms.json'"),
  workspaceStore:hasWorkspaceStore&&read('src/engine/workspace-settings.ts').includes('WorkspaceRoomStateStore'),
  persistsAgentUpdate:index.includes('workspaceStore.saveRoom(roomManager.getRoom(roomId)!)'),
  exposesScope:index.includes('scope:{type:\'workspace\''),
  qaDialog:side.includes('调度模式 QA 速查')&&side.includes('仅 @ 角色')&&side.includes('主持人调度')&&side.includes('自由讨论'),
  workspaceText:side.includes('.pm-workflow/dsh-group-chat/')&&side.includes('不是全局配置'),
  qaButton:side.includes('查看调度模式 QA 说明'),
  modelStoreLocation:model.includes('location(){return this.path}')
};
console.log(JSON.stringify(result));
if(!Object.values(result).every(Boolean))process.exit(1);
