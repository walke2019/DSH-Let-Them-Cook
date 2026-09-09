@echo off
setlocal
set "ROOT=%~dp0..\.."
set "BASE=%ROOT%\Docs\full-small-task-test\original"
copy /Y "%BASE%\src\client\GroupChatSideDock.tsx" "%ROOT%\src\client\GroupChatSideDock.tsx" >nul
copy /Y "%BASE%\lib\client.js" "%ROOT%\lib\client.js" >nul
copy /Y "%BASE%\lib\client.js.map" "%ROOT%\lib\client.js.map" >nul
echo ROLLBACK_OK restored GroupChatSideDock.tsx, lib/client.js, lib/client.js.map
endlocal
