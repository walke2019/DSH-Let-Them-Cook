const fs=require('fs');const path=require('path');const root=process.argv[2]||'.';
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
const side=read('src/client/GroupChatSideDock.tsx'), panel=read('src/client/GroupChatPanel.tsx'), composer=read('src/client/GroupChatComposer.tsx'), editor=read('src/client/GroupChatRoleEditor.tsx');
const hasAvatar=fs.existsSync(path.join(root,'src/client/AvatarBadge.tsx')) ? read('src/client/AvatarBadge.tsx') : '';
const result={
  avatarComponent:hasAvatar.includes('data-avatar-svg="feather-fan"')&&hasAvatar.includes("value === '🪶'"),
  sideDockUses:side.includes('AvatarBadge')&&side.includes('gc-roster-avatar'),
  panelUses:panel.includes('AvatarBadge avatar={message.sender.avatar}')&&panel.includes('AvatarBadge avatar={item.avatar}'),
  composerUses:composer.includes('AvatarBadge avatar={m.avatar}'),
  editorUses:editor.includes('AvatarBadge avatar={agentForm.avatar}')
};
console.log(JSON.stringify(result)); if(!Object.values(result).every(Boolean)) process.exit(1);
