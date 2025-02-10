@echo off
echo Instalando dependências...
pnpm install
if %ERRORLEVEL% neq 0 (
    echo Erro ao instalar as dependências.
    pause
    exit /b %ERRORLEVEL%
)
echo Dependências instaladas com sucesso.
pause
