import {readFileSync,existsSync} from 'node:fs'
const panel=readFileSync(process.argv[2],'utf8')
const component=existsSync(process.argv[3])?readFileSync(process.argv[3],'utf8'):''
const checks={compact:!panel.includes('快速@:')&&panel.includes('<GroupChatComposer'),multiline:component.includes('<textarea'),picker:component.includes('aria-haspopup="dialog"')&&component.includes('搜索角色'),ime:component.includes('isComposing'),cursor:component.includes('setSelectionRange')}
console.log((Object.values(checks).every(Boolean)?'PASS':'FAIL')+': '+JSON.stringify(checks))
process.exitCode=Object.values(checks).every(Boolean)?0:1
