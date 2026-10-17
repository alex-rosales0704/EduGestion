@echo off
chcp 65001 >nul
title EduGestion Web - Sprint II
cd /d "%~dp0"
echo.
echo  =====================================
echo      EduGestion Web - Fase 2
 echo  =====================================
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No esta instalado Node.js. Instala Node.js LTS antes de continuar.
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se encontro npm. Reinstala Node.js LTS.
  pause
  exit /b 1
)
if not exist "node_modules\express" (
  echo Instalando librerias del proyecto por primera vez...
  call npm install
  if errorlevel 1 (echo No se pudieron instalar las dependencias. & pause & exit /b 1)
)
if not exist ".env" (
  echo Configuracion inicial de MySQL...
  call npm run setup
  if errorlevel 1 (echo Revisa los datos de MySQL y vuelve a ejecutar este archivo. & pause & exit /b 1)
)
echo.
echo Abre http://localhost:3000 en tu navegador.
echo Para detener, presiona CTRL+C.
echo.
call npm start
pause
