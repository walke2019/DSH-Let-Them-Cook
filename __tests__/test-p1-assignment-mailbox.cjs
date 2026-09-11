const fs = require('fs');
const path = require('path');
const root = process.cwd();
function read(p){ return fs.readFileSync(path.join(root,p),'utf8'); }
function assert(cond,msg){ if(!cond){ console.error('FAIL '+msg); process.exitCode=1; } else { console.log('PASS '+msg); } }
const types = read('src/types.ts');
const room = read('src/engine/room-manager.ts');
const projection = read('src/engine/projection.ts');
const index = read('src/index.ts');
assert(types.includes('export interface AssignmentEnvelope'), 'types define AssignmentEnvelope');
assert(types.includes('export interface AgentMailboxMessage'), 'types define AgentMailboxMessage');
assert(types.includes('assignments?: AssignmentEnvelope[]'), 'room stores assignments');
assert(types.includes('mailboxes?: Record<string, AgentMailboxMessage[]>'), 'room stores mailboxes');
assert(types.includes("| 'assignment:updated'") && types.includes("| 'mailbox:new'"), 'event bus includes assignment/mailbox events');
assert(room.includes('public createAssignment('), 'room manager creates assignments');
assert(room.includes('public addMailboxMessage('), 'room manager writes mailbox messages');
assert(room.includes('room.assignments ||= []') && room.includes('room.mailboxes ||= {}'), 'room manager migrates existing rooms');
assert(projection.includes('formatAssignmentsForAgent') && projection.includes('Your Active Assignments') && projection.includes('Mailbox to You'), 'projection injects assignment and mailbox context');
assert(index.includes('createTurnAssignment') && index.includes('markAssignmentRunning') && index.includes('completeAssignment') && index.includes('addMailboxMessage'), 'index wires assignment lifecycle into agent turns');
assert(index.includes('persistRoomState(roomId)') && index.includes('workspaceStore.saveSnapshot(current'), 'assignment lifecycle persists full room snapshot to workspace store');
if(process.exitCode){ process.exit(process.exitCode); }
console.log('P1_ASSIGNMENT_MAILBOX_TEST_EXIT:0');
