const fs=require('fs');const path=require('path');const root=process.argv[2]||'.';
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
const types=read('src/types.ts'), runtime=read('src/engine/agent-runtime.ts'), rm=read('src/engine/room-manager.ts'), side=read('src/client/GroupChatSideDock.tsx'), index=read('src/index.ts');
const result={
  tokenUsageMapped:runtime.includes('usage.inputTokens')&&runtime.includes('cacheReadTokens')&&runtime.includes('outputTokens'),
  firstTokenTiming:runtime.includes('firstTokenMsTotal')&&runtime.includes('assistant/chunk')&&runtime.includes('hasVisibleDelta'),
  ledgerMetricsType:types.includes('AgentRuntimeMetrics')&&types.includes('AgentModelTokenStats')&&types.includes('modelStats'),
  roomAggregates:rm.includes('addRuntimeMetrics')&&rm.includes('modelStats[modelKey]')&&rm.includes('ledger.metrics'),
  messageCarriesMetrics:index.includes('runtimeMetrics,')&&index.includes('tokensConsumed: runtimeMetrics'),
  officialSummaryUi:side.includes('总体运行统计')&&side.includes('官方摘要风格')&&side.includes('metricLine')&&side.includes('首 token 平均')&&side.includes('缓存命中'),
  perAgentCollapse:side.includes('按 Agent / 模型展开')&&side.includes('Object.values(stat.modelStats')
};
console.log(JSON.stringify(result)); if(!Object.values(result).every(Boolean)) process.exit(1);
