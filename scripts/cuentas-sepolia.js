/**
 * Muestra el saldo de las billeteras del prototipo en Sepolia antes de desplegar.
 * Uso: npm run cuentas:sepolia
 */
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const docentes = (process.env.DOCENTE_WALLETS || "").split(",").map((a) => a.trim()).filter(Boolean);
  const estudiante = (process.env.ESTUDIANTE_WALLET || "").trim();
  const filas = [["Secretaría (PRIVATE_KEY)", deployer.address]];
  docentes.forEach((d, i) => filas.push([`Docente ${i + 1}`, d]));
  if (estudiante) filas.push(["Graduado", estudiante]);
  console.log("Saldos en Sepolia:");
  for (const [rol, dir] of filas) {
    const wei = await hre.ethers.provider.getBalance(dir);
    console.log(`  ${rol.padEnd(26)} ${dir}  ${hre.ethers.formatEther(wei)} ETH`);
  }
  console.log("\nPara desplegar hacen falta unos 0,02 ETH en Secretaría; cada docente y el graduado necesitan unos 0,005 ETH.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
