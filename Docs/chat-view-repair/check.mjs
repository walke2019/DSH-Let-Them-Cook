import {readFileSync} from 'node:fs'
const p=readFileSync(process.argv[2],'utf8');const s=readFileSync(process.argv[3],'utf8')
const checks={cleanCenter:!p.includes('顶部作战大厅')&&!p.includes('Workflow Stage Stepper')&&!p.includes('setActiveTab'),nativeMarkdown:p.includes("from '@deepseek-ai/dsh-client-ui-primitives'"),lightMessages:p.includes('gc-message-agent'),sidebarControls:s.includes('角色主题')&&s.includes('调度模式'),sidebarEditor:s.includes('GroupChatRoleEditor')}
const ok=Object.values(checks).every(Boolean);console.log((ok?'PASS':'FAIL')+': '+JSON.stringify(checks));process.exitCode=ok?0:1
