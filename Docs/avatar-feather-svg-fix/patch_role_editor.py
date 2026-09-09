from pathlib import Path
p=Path('src/client/GroupChatRoleEditor.tsx')
s=p.read_text(encoding='utf-8')
if "import {AvatarBadge}" not in s:
    s=s.replace("import {GroupChatModelSettings}", "import {AvatarBadge} from './AvatarBadge.js'\nimport {GroupChatModelSettings}",1)
old="""{agentForm.avatar.startsWith('data:') ? (
                  <img src={agentForm.avatar} alt=\"avatar\" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  agentForm.avatar
                )}"""
new="""<AvatarBadge avatar={agentForm.avatar} alt=\"avatar\" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }} />"""
s=s.replace(old,new)
p.write_text(s, encoding='utf-8')
