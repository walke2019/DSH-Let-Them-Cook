from pathlib import Path
p=Path('src/client/GroupChatSideDock.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace("await fetch('/dsh-group-chat/api/workflow/advance', {", "await fetch('/dsh-group-chat/api/workflow/action', {")
s=s.replace("""approverRoleId: 'commander',
          summary: '指挥官审核通过，批准进入下一阶段',""", """action: 'advance',
          approverRoleId: 'commander',
          summary: '指挥官审核通过，批准进入下一阶段',""")
p.write_text(s,encoding='utf-8')
