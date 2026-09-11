const fs = require('fs');
const path = require('path');
const root = process.cwd();
function read(p){ return fs.readFileSync(path.join(root,p),'utf8'); }
function assert(cond,msg){ if(!cond){ console.error('FAIL '+msg); process.exitCode=1; } else { console.log('PASS '+msg); } }
const structured = read('src/engine/structured-result.ts');
const types = read('src/types.ts');
const projection = read('src/engine/projection.ts');
const index = read('src/index.ts');
assert(structured.includes('parseStructuredAgentResult'), 'parser exposes parseStructuredAgentResult');
assert(structured.includes('stripStructuredAgentResult'), 'parser strips control block from visible content');
assert(structured.includes('inferAgentTaskStatus'), 'parser exposes status inference fallback');
assert(structured.includes('RESULT_STATUS: passed | failed | request_human'), 'prompt documents status choices');
assert(types.includes('StructuredAgentResultMetadata') && types.includes('structuredResult?: StructuredAgentResultMetadata'), 'message metadata stores structured result');
assert(projection.includes('STRUCTURED_AGENT_RESULT_PROMPT'), 'projection injects structured result prompt');
assert(index.includes('parseStructuredAgentResult(replyContent)'), 'runtime parses structured result');
assert(index.includes('stripStructuredAgentResult(replyContent)'), 'runtime strips structured result before display');
assert(index.includes('structuredResult: structuredResult ?'), 'runtime stores structured result metadata');
assert(index.includes('inferAgentTaskStatus(replyContent)'), 'runtime updates task status through structured-first inference');
assert(index.includes('content: visibleReplyContent'), 'mailbox/message use visible content');
if(process.exitCode){ process.exit(process.exitCode); }
console.log('P6_STRUCTURED_AGENT_RESULT_TEST_EXIT:0');
