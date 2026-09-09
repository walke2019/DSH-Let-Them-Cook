@echo off
setlocal
set "ROOT=%~dp0..\.."
set "BASE=%ROOT%\Docs\auto-setup-confirmation\original"
copy /Y "%BASE%\src\types.ts" "%ROOT%\src\types.ts" >nul
copy /Y "%BASE%\src\index.ts" "%ROOT%\src\index.ts" >nul
copy /Y "%BASE%\src\engine\room-manager.ts" "%ROOT%\src\engine\room-manager.ts" >nul
copy /Y "%BASE%\src\engine\theme-factory.ts" "%ROOT%\src\engine\theme-factory.ts" >nul
if exist "%ROOT%\src\engine\auto-setup.ts" del /F /Q "%ROOT%\src\engine\auto-setup.ts"
if exist "%BASE%\lib\index.js" copy /Y "%BASE%\lib\index.js" "%ROOT%\lib\index.js" >nul
if exist "%BASE%\lib\client.js" copy /Y "%BASE%\lib\client.js" "%ROOT%\lib\client.js" >nul
echo ROLLBACK_OK restored auto setup confirmation source files
endlocal
