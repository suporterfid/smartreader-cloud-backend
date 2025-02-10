@echo off
echo Executando comando do Nest CLI...
nest %*
if %ERRORLEVEL% neq 0 (
    echo Erro ao executar o comando do Nest CLI.
    pause
    exit /b %ERRORLEVEL%
)
pause
