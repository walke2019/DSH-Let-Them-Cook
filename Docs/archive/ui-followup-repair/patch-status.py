from pathlib import Path
p=Path('src/types.ts');s=p.read_text(encoding='utf-8-sig')
s=s.replace("  | 'error:notice'", "  | 'error:notice'\n  | 'agent:status'")
p.write_text(s,encoding='utf-8')
p=Path('src/index.ts');s=p.read_text(encoding='utf-8-sig')
needle="    const member = room.members.find(m => m.id === targetAgentId)\n    if (!member) return\n\n    // 检查互动轮次"
s=s.replace(needle,"""    const member = room.members.find(m => m.id === targetAgentId)
    if (!member) return

    roomManager.broadcast({type:'agent:status',roomId,payload:{agentId:member.id,name:member.name,avatar:member.avatar,title:member.title,status:'running',startedAt:Date.now()},timestamp:Date.now()})

    // 检查互动轮次""")
s=s.replace("      roomManager.addMessage(roomId, {\n        roomId, sender: { kind: 'system'", "      roomManager.broadcast({type:'agent:status',roomId,payload:{agentId:member.id,name:member.name,avatar:member.avatar,title:member.title,status:'error',message},timestamp:Date.now()})\n      roomManager.addMessage(roomId, {\n        roomId, sender: { kind: 'system'")
s=s.replace("    if (lifetime.signal.aborted) return\n\n    // 检查是否为静默标记", "    if (lifetime.signal.aborted) return\n    roomManager.broadcast({type:'agent:status',roomId,payload:{agentId:member.id,name:member.name,avatar:member.avatar,title:member.title,status:'complete',modelUsed,providerUsed,finishedAt:Date.now()},timestamp:Date.now()})\n\n    // 检查是否为静默标记")
p.write_text(s,encoding='utf-8')
p=Path('src/client/group-chat-view-types.ts');s=p.read_text(encoding='utf-8-sig')
s=s.replace('export interface AgentProfile {',"export interface AgentStatus {agentId:string;name:string;avatar:string;title?:string;status:'running'|'complete'|'error';message?:string;modelUsed?:string;providerUsed?:string;startedAt?:number;finishedAt?:number}\n\nexport interface AgentProfile {")
p.write_text(s,encoding='utf-8')
