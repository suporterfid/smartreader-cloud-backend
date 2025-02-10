@echo off
echo Iniciando o processo de build do projeto...
pnpm run build
if %ERRORLEVEL% neq 0 (
    echo Erro durante o build do projeto.
    pause
    exit /b %ERRORLEVEL%
)
echo Build realizado com sucesso.
pause
