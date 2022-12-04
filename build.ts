#!/usr/bin/env ts-node

import consola from 'consola'
import esbuild from 'esbuild'
import { nodeBuiltin } from 'esbuild-node-builtin'
import fse from 'fs-extra'
import { homedir } from 'os'
import { join } from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import Info from './Info.json'

const argv = yargs(hideBin(process.argv))
  .options({
    watch: {
      alias: ['w'],
      type: 'boolean',
      description: 'watch source file',
    },
    unlink: {
      type: 'boolean',
      default: false,
      description: 'unlink all symlinks',
    },
    prod: {
      type: 'boolean',
      default: false,
      description: 'use NODE_ENV=production for build',
    },
  })
  .parseSync()

main().catch(console.error)

async function main() {
  processSymlinks()
  await build()
}

function processSymlinks() {
  const IINA_PLUGINS_DIR = join(
    homedir(),
    'Library/Application Support/com.colliderli.iina/plugins'
  )

  const devSuffix = '.iinaplugin-dev'
  const pluginSubdir = Info.identifier + devSuffix

  // prune existing  symlinks
  fse
    .readdirSync(IINA_PLUGINS_DIR)
    .filter((item) => item.endsWith(devSuffix))
    .forEach((name) => {
      const fullname = join(IINA_PLUGINS_DIR, name)
      const stat = fse.lstatSync(fullname) // do not follow symlinks
      if (!stat.isSymbolicLink()) return

      if (fse.realpathSync(fullname) === __dirname && name !== pluginSubdir) {
        consola.info('symlink prune legacy symlink: %s', fullname)
        fse.removeSync(fullname)
      }
    })

  // create
  const symlinkFrom = join(IINA_PLUGINS_DIR, pluginSubdir)
  const symlinkTo = __dirname

  if (argv.unlink) {
    fse.removeSync(symlinkFrom)
    consola.success('symlink unlink success %s', symlinkFrom)
  } else {
    fse.ensureSymlinkSync(symlinkTo, symlinkFrom)
    consola.success('symlink success %s -> %s', symlinkFrom, symlinkTo)
  }
}

async function build() {
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
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        argv.prod ? 'production' : process.env.NODE_ENV || 'development'
      ),
    },
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
