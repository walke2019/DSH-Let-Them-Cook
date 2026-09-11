@echo off
setlocal
set "ROOT=%~dp0..\.."
set "BASE=%ROOT%\Docs\orchestrator-policy-skill-sync\original"
copy /Y "%BASE%\AGENTS.md" "%ROOT%\AGENTS.md" >nul
copy /Y "%BASE%\README.md" "%ROOT%\README.md" >nul
copy /Y "%BASE%\src\types.ts" "%ROOT%\src\types.ts" >nul
copy /Y "%BASE%\src\engine\projection.ts" "%ROOT%\src\engine\projection.ts" >nul
copy /Y "%BASE%\src\engine\auto-setup.ts" "%ROOT%\src\engine\auto-setup.ts" >nul
copy /Y "%BASE%\Docs\dispatch-engine.md" "%ROOT%\Docs\dispatch-engine.md" >nul
copy /Y "%BASE%\Docs\workflow-and-role-personas.md" "%ROOT%\Docs\workflow-and-role-personas.md" >nul
copy /Y "%BASE%\Docs\standards-and-extensibility.md" "%ROOT%\Docs\standards-and-extensibility.md" >nul
if exist "%ROOT%\src\engine\orchestrator-skill.ts" del /F /Q "%ROOT%\src\engine\orchestrator-skill.ts"
if exist "%ROOT%\src\skills\dsh-group-chat-orchestrator\SKILL.md" del /F /Q "%ROOT%\src\skills\dsh-group-chat-orchestrator\SKILL.md"
if exist "%ROOT%\Docs\orchestrator-skill-and-policy.md" del /F /Q "%ROOT%\Docs\orchestrator-skill-and-policy.md"
echo ROLLBACK_OK restored orchestrator policy docs/source and removed runtime skill additions
endlocal
