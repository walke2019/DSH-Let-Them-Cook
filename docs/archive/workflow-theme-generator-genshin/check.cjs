const fs=require('fs');const path=require('path');const root=process.argv[2]||'.';
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
const types=read('src/types.ts'), themes=read('src/engine/themes.ts'), factory=read('src/engine/theme-factory.ts'), room=read('src/engine/room-manager.ts'), index=read('src/index.ts'), side=read('src/client/GroupChatSideDock.tsx');
const result={
  genshinTheme:types.includes("'genshin'")&&themes.includes('琴 · 代理团长')&&themes.includes('派蒙 · 应急文案'),
  defaultMeme:room.includes("createDefaultFleet('meme_comedy')")&&room.includes("activeTheme: 'meme_comedy'"),
  workflowFactory:factory.includes('createWorkflowDraft')&&factory.includes('AI 定制工作流')&&factory.includes('收口交付别烂尾'),
  draftReturnsWorkflow:index.includes('const workflow = createWorkflowDraft(brief)')&&index.includes('members, workflow'),
  applyUsesWorkflow:index.includes('body.workflow || createWorkflowDraft')&&room.includes('if (workflow) room.workflow'),
  uiOptions:side.includes('原神提瓦特')&&side.includes('沙雕整活')&&side.indexOf('meme_comedy')<side.indexOf('genshin'),
  uiWorkflow:side.includes('AI 造主题角色 + 工作流')&&side.includes('工作流：')&&side.includes('workflowDraft.stages?.length'),
  uiApply:side.includes('套用原神')&&side.includes('生成并套用')
};
console.log(JSON.stringify(result)); if(!Object.values(result).every(Boolean)) process.exit(1);

