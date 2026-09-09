const fs=require('fs');const path=require('path');const root=process.argv[2]||'.';
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
const types=read('src/types.ts'), themes=read('src/engine/themes.ts'), room=read('src/engine/room-manager.ts'), index=read('src/index.ts'), side=read('src/client/GroupChatSideDock.tsx');
const factory=fs.existsSync(path.join(root,'src/engine/theme-factory.ts'))?read('src/engine/theme-factory.ts'):'';
const result={
  memeTheme:types.includes('meme_comedy')&&themes.includes('离谱总导演')&&themes.includes('废话压缩师'),
  humanStyle:factory.includes('先说人话')&&factory.includes('轻微梗')&&factory.includes('不要为了角色扮演水字数'),
  draftFactory:factory.includes('createThemeDraft')&&factory.includes('buildHumanSystemPrompt'),
  roomApply:room.includes('applyGeneratedTheme')&&room.includes('custom_${Date.now()}'),
  apiDraft:index.includes('/theme/draft')&&index.includes('/theme/apply-draft'),
  uiCreator:side.includes('AI 造主题角色')&&side.includes('生成草案')&&side.includes('生成并套用'),
  uiEditable:side.includes('草案预览')&&side.includes('每个角色右侧「编辑」'),
  themeOption:side.includes('value="meme_comedy"')&&side.includes('沙雕整活')
};
console.log(JSON.stringify(result)); if(!Object.values(result).every(Boolean)) process.exit(1);
