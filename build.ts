import consola from 'consola'
import esbuild from 'esbuild'
import { nodeBuiltin } from 'esbuild-node-builtin'
import path, { join } from 'path'
import pc from 'picocolors'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { homedir } from 'os'
import fse from 'fs-extra'
import Info from './Info.json'

const IINA_PLUGINS_DIR = join(homedir(), 'Library/Application Support/com.colliderli.iina/plugins')
const pluginSubdir = Info.identifier + '.iinaplugin-dev'

const symlinkFrom = join(IINA_PLUGINS_DIR, pluginSubdir)
const symlinkTo = __dirname
fse.ensureSymlinkSync(symlinkTo, symlinkFrom)
consola.success('symlink success %s -> %s', symlinkFrom, symlinkTo)

const argv = yargs(hideBin(process.argv))
  .option('watch', {
    alias: ['w'],
    type: 'boolean',
  })
  .parseSync()

main().catch(console.error)

async function main() {
  const outdir = join(__dirname, 'dist')
  await esbuild.build({
    entryPoints: [
      //
      __dirname + '/src/index.ts',
      __dirname + '/src/global.ts',
    ],
    bundle: true,
    outdir,
    charset: 'utf8',
    platform: 'neutral',
    plugins: [nodeBuiltin()],
    mainFields: ['module', 'browser', 'main'],
    watch: argv.watch
      ? {
          onRebuild(error, result) {
            if (error) consola.error('watch build failed:', error)
            else consola.success('watch build success')
          },
        }
      : false,
  })

  consola.success('bundled success')
}
