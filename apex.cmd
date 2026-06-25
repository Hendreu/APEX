@echo off
setlocal
set "first=%~1"
set "BIN=%~dp0packages\opencode\dist\apex-windows-x64\bin\apex.exe"

if /I "%first%"=="" goto tui
if /I "%first%"=="run" goto noagent
if /I "%first%"=="agent" goto noagent
if /I "%first%"=="debug" goto noagent
if /I "%first%"=="mcp" goto noagent
if /I "%first%"=="providers" goto noagent
if /I "%first%"=="upgrade" goto noagent
if /I "%first%"=="uninstall" goto noagent
if /I "%first%"=="serve" goto noagent
if /I "%first%"=="web" goto noagent
if /I "%first%"=="models" goto noagent
if /I "%first%"=="stats" goto noagent
if /I "%first%"=="export" goto noagent
if /I "%first%"=="import" goto noagent
if /I "%first%"=="completion" goto noagent
if /I "%first%"=="acp" goto noagent
if "%first:~0,1%"=="-" goto noagent

:tui
"%BIN%" --agent "forger" %*
goto end

:noagent
"%BIN%" %*

:end
endlocal
