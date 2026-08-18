import { spawnSync } from 'node:child_process'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const src = join(root, 'src')
const out = join(root, 'lib')
const files = (await readdir(src)).filter((f) => f.endsWith('.ts'))
for (const f of files) {
  const entry = join(src, f)
  const outfile = join(out, f.replace(/\.ts$/, '.js'))
  const result = spawnSync(
    'npx',
    ['--yes', 'esbuild', entry, `--outfile=${outfile}`, '--format=esm', '--platform=node'],
    { cwd: root, shell: true, encoding: 'utf8' },
  )
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    process.exit(result.status ?? 1)
  }
}
for (const f of files) {
  const p = join(out, f.replace(/\.ts$/, '.js'))
  const text = await readFile(p, 'utf8')
  await writeFile(p, text.replaceAll('.ts"', '.js"').replaceAll(".ts'", ".js'"), 'utf8')
}
console.log('compiled', files.length, 'files')
