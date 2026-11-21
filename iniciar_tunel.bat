@echo off
chcp 65001 > nul
title Tunel publico al nodo Hardhat - NO CERRAR
cd /d "%~dp0"
echo ============================================================
echo   TUNEL PUBLICO AL NODO HARDHAT
echo   Antes: iniciar_todo.bat debe estar corriendo en esta PC.
echo.
echo   En unos segundos aparecera una direccion como:
echo     https://algo-algo.trycloudflare.com
echo   Copiala y usala asi:
echo   1. En la pagina de Vercel, en el aviso rojo, pegala y pulsa "Usar este RPC"
echo      o abre: https://TU-APP.vercel.app/?rpc=https://algo-algo.trycloudflare.com
echo   2. En MetaMask, edita la red Hardhat: URL de RPC = esa direccion, ID 1337
echo.
echo   La direccion cambia cada vez que abres este archivo.
echo ============================================================
echo.
npx --yes cloudflared tunnel --url http://localhost:8545
pause
