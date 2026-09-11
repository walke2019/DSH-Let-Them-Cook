import {readFileSync} from 'node:fs';
const root=process.argv[2]||'.';
const ui=readFileSync(root+'/src/client/GroupChatModelSettings.tsx','utf8');
const store=readFileSync(root+'/src/engine/model-settings.ts','utf8');
const side=readFileSync(root+'/src/client/GroupChatSideDock.tsx','utf8');
const result={svgChevron:ui.includes('gc-model-chevron')&&ui.includes('<svg className="gc-model-chevron"')&&!ui.includes('>⌄</span>'),svgDelete:ui.includes('gc-model-delete')&&ui.includes('M4 4l8 8M12 4l-8 8'),visibleRecentPanel:ui.includes('最近使用的模型 ID（最多 6 条）')&&ui.includes('gc-recent-panel'),maxSixStore:store.includes('MAX_RECENT_MODELS = 6')&&!store.includes('slice(0,20)'),suggestionChips:ui.includes('gc-suggestion-panel')&&ui.includes('gc-suggestion-chip'),sideOneLine:side.includes("gridTemplateColumns:'auto minmax(86px,1fr) auto minmax(86px,1fr)'")&&side.includes("whiteSpace:'nowrap'"),recentDeleteInside:ui.includes('gc-recent-chip-row')&&ui.includes('gc-recent-delete')&&!ui.includes('role="button" tabIndex={0} className="gc-model-delete"')};
console.log(JSON.stringify(result));process.exit(Object.values(result).every(Boolean)?0:1);
