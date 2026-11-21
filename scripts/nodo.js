/**
 * Nodo local persistente (Anvil) para el prototipo.
 *
 * A diferencia de "hardhat node", Anvil guarda la cadena en cadena-local.json cada 3 segundos.
 * Al volver a abrirlo, los contratos, las tesis, los votos y el contador de transacciones
 * de cada cuenta siguen igual, así que MetaMask no necesita "Borrar datos de actividad".
 *
 * Las cuentas y claves son las mismas de Hardhat (misma frase semilla de prueba),
 * con 10 000 ETH cada una, y el ID de cadena es 1337.
 *
 * Uso:  npm run nodo            (o iniciar_todo.bat)
 *       npm run nodo -- --reiniciar   borra la cadena guardada y empieza de cero
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const estado = path.join(raiz, "cadena-local.json");

const paquetes = {
  "win32-x64": "@foundry-rs/anvil-win32-amd64",
  "linux-x64": "@foundry-rs/anvil-linux-amd64",
  "linux-arm64": "@foundry-rs/anvil-linux-arm64",
  "darwin-x64": "@foundry-rs/anvil-darwin-amd64",
  "darwin-arm64": "@foundry-rs/anvil-darwin-arm64",
};
const clave = `${process.platform}-${process.arch}`;
const paquete = paquetes[clave];
if (!paquete) {
  console.error(`Anvil no está disponible para ${clave}. Usa "npm run nodo:hardhat".`);
  process.exit(1);
}

let binario;
try {
  const dir = path.dirname(require.resolve(`${paquete}/package.json`, { paths: [raiz] }));
  binario = path.join(dir, "bin", process.platform === "win32" ? "anvil.exe" : "anvil");
  if (!fs.existsSync(binario)) throw new Error("sin binario");
} catch {
  console.error(`No se encontró ${paquete}. Ejecuta "npm install" en la carpeta del proyecto.`);
  process.exit(1);
}

if (process.argv.includes("--reiniciar") && fs.existsSync(estado)) {
  fs.unlinkSync(estado);
  console.log("Cadena guardada eliminada: el nodo empieza de cero.");
  console.log("Recuerda: después de reiniciar la cadena, en MetaMask usa una vez 'Borrar datos de actividad'.\n");
}

console.log(fs.existsSync(estado)
  ? "Cargando la cadena guardada en cadena-local.json..."
  : "No hay cadena guardada: se crea una nueva en cadena-local.json.");

const args = [
  "--host", "127.0.0.1",
  "--port", "8545",
  "--chain-id", "1337",
  "--balance", "10000",
  "--state", estado,
  "--state-interval", "3",
];
const hijo = spawn(binario, args, { stdio: "inherit" });
const salir = () => hijo.kill("SIGINT");
process.on("SIGINT", salir);
process.on("SIGTERM", salir);
hijo.on("exit", (code) => process.exit(code ?? 0));
