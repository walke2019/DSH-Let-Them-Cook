const fs = require('fs');
const path = require('path');
const root = process.cwd();
function read(p){ return fs.readFileSync(path.join(root,p),'utf8'); }
function assert(cond,msg){ if(!cond){ console.error('FAIL '+msg); process.exitCode=1; } else { console.log('PASS '+msg); } }
const types = read('src/types.ts');
const workflow = read('src/engine/workflow-orchestrator.ts');
const index = read('src/index.ts');
const projection = read('src/engine/projection.ts');
assert(types.includes('export interface WorkflowTask'), 'types define WorkflowTask');
assert(types.includes('qualityContract?: WorkflowTaskQualityContract'), 'WorkflowTask supports qualityContract');
assert(types.includes('verifyCommand?: string'), 'WorkflowTask supports verifyCommand');
assert(types.includes('workflowTaskId?: string'), 'AssignmentEnvelope links workflowTaskId');
assert(workflow.includes('public static stageGate'), 'workflow exposes stageGate');
assert(workflow.includes('public static getReadyTasks'), 'workflow exposes ready task selector');
assert(workflow.includes('public static updateTaskStatus'), 'workflow exposes task status updater');
assert(workflow.includes('public static ensureTaskDag'), 'workflow migrates old stages to task DAG');
assert(workflow.includes('阶段质量门禁阻断'), 'advanceStage blocks on quality gate');
assert(workflow.includes("this.task('qa.typecheck'") && workflow.includes("verifyCommand: 'npm run typecheck && npm run build:all'"), 'standard QA task includes verifyCommand');
assert(index.includes('WorkflowOrchestrator.getReadyTasks') && index.includes('workflowTaskId: task?.taskId'), 'assignments bind ready workflow tasks');
assert(index.includes("pathname === '/workflow/task'"), 'API exposes workflow task update endpoint');
assert(projection.includes('workflowTask='), 'projection shows workflowTaskId to agent');
assert(read('src/engine/room-manager.ts').includes('WorkflowOrchestrator.ensureTaskDag'), 'room manager hydrates missing task DAGs');
if(process.exitCode){ process.exit(process.exitCode); }
console.log('P2_WORKFLOW_TASK_DAG_TEST_EXIT:0');
