/**
 * Toda peticion al servidor pasa por api.client, que es quien adjunta la sesion (Authorization)
 * y avisa cuando el servidor la rechaza. Un `fetch` directo en una pantalla o en un servicio sale
 * sin sesion y el servidor lo responde con 401: asi se rompieron las pantallas de vinculo cuando
 * el servidor empezo a exigir el JWT (nexus-SEC-04).
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const FOLDERS = ['app', 'services', 'context', 'hooks', 'utils'];

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    const isSource = /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name);
    return isSource ? [full] : [];
  });
}

describe('peticiones al servidor', () => {
  it('ninguna pantalla ni servicio llama a fetch directamente', () => {
    const offenders = FOLDERS.flatMap((folder) => sourceFiles(path.join(ROOT, folder)))
      .filter((file) => /\bfetch\(/.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(ROOT, file).replace(/\\/g, '/'));

    expect(offenders).toEqual([]);
  });
});
