// Offline structural checks only: never load application modules or environment files.
const fs = require('node:fs');
const path = require('node:path');
const { builtinModules } = require('node:module');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const builtins = new Set(builtinModules.map(n => n.replace(/^node:/, '')));
const failures = [];
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.isDirectory() && ['node_modules', 'dist', '.git'].includes(e.name)) return [];
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) throw new Error('Refusing symbolic link: ' + p);
    return e.isDirectory() ? walk(p) : [p];
  });
}
let references = 0;
let syntaxChecks = 0;
for (const area of ['frontend', 'backend']) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, area, 'package.json'), 'utf8'));
  const declared = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const file of walk(path.join(root, area, 'src'))) {
    if (!/\.(js|jsx|ts|tsx|cjs|mjs)$/.test(file)) continue;
    // Strip standalone comment lines; this is a structural scan, not a compiler.
    const text = fs.readFileSync(file, 'utf8').split('\n')
      .filter(line => !/^\s*(\/\/|\/\*|\*)/.test(line)).join('\n');
    const imports = text.matchAll(/(?:from\s+|import\s*\(|require\s*\(|import\s+)["']([^"']+)["']/g);
    for (const match of imports) {
      references++;
      const name = match[1];
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(file), name);
        const candidates = [base, ...['.js','.jsx','.ts','.tsx','.json','.css','.cjs','.mjs'].map(e => base+e),
          ...['index.js','index.jsx','index.ts','index.tsx'].map(e => path.join(base,e))];
        if (!candidates.some(p => fs.existsSync(p) && fs.statSync(p).isFile())) {
          failures.push(path.relative(root,file) + ': unresolved ' + name);
        }
      } else if (!name.startsWith('@/')) {
        const dep = name.startsWith('@') ? name.split('/').slice(0,2).join('/') : name.split('/')[0];
        if (!name.startsWith('node:') && !builtins.has(dep) && !declared[dep]) {
          failures.push(path.relative(root,file) + ': undeclared ' + dep);
        }
      }
    }
    if (area === 'backend' && /\.(js|cjs|mjs)$/.test(file)) {
      const result = spawnSync(process.execPath, ['--check', file], {
        encoding: 'utf8', timeout: 10000,
        env: { SystemRoot: process.env.SystemRoot || '', NODE_ENV: 'test' }
      });
      syntaxChecks++;
      if (result.status !== 0) failures.push(path.relative(root,file) + ': syntax check failed ' + (result.stderr || result.error || ''));
    }
  }
}
const envFiles = walk(root).filter(p => /^\.env(?:\.|$)/.test(path.basename(p)) && !p.endsWith('.example'));
if (envFiles.length) failures.push('Environment files present in baseline');
console.log(JSON.stringify({ mode:'offline structural checks; application not loaded', references, syntaxChecks, failures },null,2));
process.exitCode = failures.length ? 1 : 0;
