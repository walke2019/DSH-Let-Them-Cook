# P74 Session-scoped room binding

## Problem
The central `Agent 群聊` panel and HUD used the hard-coded room ID `dev-team-alpha`. When the user opened a new official DSH conversation from the left sidebar, the extension still fetched and rendered the old workspace room's messages, making a fresh official conversation look like it inherited the previous task history.

## Fix
- The client resolves the current official DSH session from `localStorage['dsh.sessions.current'].sessionId` and maps it to a plugin room ID (`dsh-<sessionId>`).
- `GroupChatPanel` and `GroupChatSideDock` refetch when the current session changes and filter SSE events by the active room ID.
- `GET /dsh-group-chat/api/room?id=...&ensure=1` creates an empty session-scoped room when the current official session has no group-chat history yet.

## Guard
`npm run test:session-room-binding` checks the client room resolver, panel/HUD dynamic room usage, backend ensure path, and AGENTS guardrails.
