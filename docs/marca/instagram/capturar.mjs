// Pasa los HTML de esta carpeta a PNG de 1080x1350 con Chrome (sin dependencias).
//   node docs/marca/instagram/capturar.mjs
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const perfil = mkdtempSync(join(tmpdir(), "swf-ig-"));
const proc = spawn(chrome, ["--headless=new", "--remote-debugging-port=9334", `--user-data-dir=${perfil}`, "about:blank"], { stdio: "ignore" });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

let tabs;
for (let i = 0; i < 40 && !tabs; i++) {
  await espera(250);
  tabs = await fetch("http://127.0.0.1:9334/json").then((r) => r.json()).catch(() => null);
}
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) pend.get(m.id)(m.result);
};
const send = (method, params = {}) =>
  new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1350, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
for (const f of readdirSync(aqui).filter((f) => f.endsWith(".html")).sort()) {
  await send("Page.navigate", { url: pathToFileURL(join(aqui, f)).href });
  await espera(2500); // deja cargar las fuentes de Google
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  const out = join(aqui, f.replace(/\.html$/, ".png"));
  writeFileSync(out, Buffer.from(data, "base64"));
  console.log("  ", out);
}
ws.close();
proc.kill();
