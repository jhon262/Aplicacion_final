@echo off
title Nodo Local Hardhat - Tesis UPEC
cd /d "%~dp0"
echo ============================================================
echo   INICIANDO NODO BLOCKCHAIN HARDHAT (UPEC)
echo ============================================================
npx hardhat node --hostname 0.0.0.0 --port 8545
pause
