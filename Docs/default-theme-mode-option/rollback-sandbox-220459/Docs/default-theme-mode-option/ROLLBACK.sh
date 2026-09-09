@echo off
setlocal
set "ROOT=%~dp0..\.."
set "BASE=%ROOT%\Docs\default-theme-mode-option\original"
copy /Y "%BASE%\src\client\GroupChatSideDock.tsx" "%ROOT%\src\client\GroupChatSideDock.tsx" >nul
copy /Y "%BASE%\src\index.ts" "%ROOT%\src\index.ts" >nul
if exist "%BASE%\lib\index.js" copy /Y "%BASE%\lib\index.js" "%ROOT%\lib\index.js" >nul
if exist "%BASE%\lib\client.js" copy /Y "%BASE%\lib\client.js" "%ROOT%\lib\client.js" >nul
echo ROLLBACK_OK restored default theme/mode option files
endlocal
