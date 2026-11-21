@echo off
chcp 65001 > nul
title Reiniciar la cadena local UPEC
cd /d "%~dp0"
echo ============================================================
echo   REINICIAR LA CADENA LOCAL
echo   Se borran las tesis, votos y certificados de la red local.
echo   Antes cierra la ventana "1. Nodo local UPEC" si esta abierta.
echo ============================================================
echo.
set /p RESP=Escribe SI para confirmar: 
if /I not "%RESP%"=="SI" (
  echo Cancelado. No se borro nada.
  pause
  exit /b 0
)
if exist "cadena-local.json" del /q "cadena-local.json"
echo.
echo Listo. Abre iniciar_todo.bat para crear una cadena nueva.
echo Despues, en MetaMask, usa UNA VEZ por cuenta:
echo   Configuracion ^> Avanzado ^> Borrar datos de actividad
pause
