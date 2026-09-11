import {RoomManager} from '../../lib/engine/room-manager.js';
const rm=new RoomManager();
rm.addMessage('dev-team-alpha',{roomId:'dev-team-alpha',sender:{kind:'agent',id:'commander',name:'总指挥'},content:'ok',mentions:[],metadata:{providerUsed:'cpa',modelUsed:'gpt-x',tokensConsumed:{promptTokens:130,completionTokens:70,totalTokens:200},runtimeMetrics:{turnCount:1,stepCount:2,llmMs:9000,toolMs:3000,firstTokenMsTotal:1200,firstTokenCount:1,inputTokens:100,outputTokens:70,cacheReadTokens:20,cacheWriteTokens:10}}});
rm.addMessage('dev-team-alpha',{roomId:'dev-team-alpha',sender:{kind:'agent',id:'commander',name:'总指挥'},content:'ok2',mentions:[],metadata:{providerUsed:'win',modelUsed:'gpt-y',tokensConsumed:{promptTokens:50,completionTokens:50,totalTokens:100},runtimeMetrics:{turnCount:1,stepCount:1,llmMs:1000,toolMs:0,firstTokenMsTotal:300,firstTokenCount:1,inputTokens:50,outputTokens:50,cacheReadTokens:0,cacheWriteTokens:0}}});
const l=rm.getLedger('dev-team-alpha');
console.log(JSON.stringify({totalCalls:l.totalCalls,totalTokens:l.totalTokens,metrics:l.metrics,agent:l.agentStats.commander,models:Object.keys(l.agentStats.commander.modelStats)},null,2));
if(l.totalCalls!==2||l.totalTokens!==300||l.metrics.stepCount!==3||l.metrics.llmMs!==10000||Object.keys(l.agentStats.commander.modelStats).length!==2) process.exit(1);
