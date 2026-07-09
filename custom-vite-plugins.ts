import fs from 'fs';
import { resolve } from 'path';
import type { PluginOption } from 'vite';

// plugin to copy the onnxruntime-web runtime (.mjs glue + .wasm binaries) into
// public/ort so the transcription worker can load them from the extension
// origin. transformers.js v3+ has onnxruntime-web fetch these via a dynamic
// import(); inside a blob-URL module worker that would otherwise resolve
// against the blob and fail. Serving them as static assets + pointing
// env.backends.onnx.wasm.wasmPaths at them makes the URLs absolute.
export function copyOrtRuntime (): PluginOption {
  const srcDir = resolve(__dirname, 'node_modules/onnxruntime-web/dist')
  const destDir = resolve(__dirname, 'public/ort')
  const KEEP = [
    'ort-wasm-simd-threaded.mjs',
    'ort-wasm-simd-threaded.wasm',
    'ort-wasm-simd-threaded.asyncify.mjs',
    'ort-wasm-simd-threaded.asyncify.wasm',
  ]

  return {
    name: 'copy-ort-runtime',
    buildStart () {
      if (!fs.existsSync(srcDir)) return
      fs.mkdirSync(destDir, { recursive: true })

      // Remove any previously-copied variants we no longer ship (e.g. jsep/jspi).
      for (const existing of fs.readdirSync(destDir)) {
        if (existing.startsWith('ort-wasm-simd-threaded.') && !KEEP.includes(existing)) {
          fs.rmSync(resolve(destDir, existing))
        }
      }

      for (const file of KEEP) {
        const src = resolve(srcDir, file)
        const dest = resolve(destDir, file)
        if (!fs.existsSync(src)) continue
        // copy only when missing or changed to keep dev rebuilds fast
        if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
          fs.copyFileSync(src, dest)
        }
      }
    },

    // The bundler statically emits an ort-wasm-*.wasm into assets/ from a
    // `new URL(...)` inside onnxruntime-web. At runtime ORT loads from our
    // public/ort copy via env.backends.onnx.wasm.wasmPaths, so that emitted
    // asset is dead weight (~22 MB). Drop it from the output bundle.
    generateBundle (_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (/ort-wasm-.*\.wasm$/.test(fileName)) {
          delete bundle[fileName]
        }
      }
    }
  }
}

// plugin to remove dev icons from prod build
export function stripDevIcons (isDev: boolean) {
  if (isDev) return null

  return {
    name: 'strip-dev-icons',
    resolveId (source: string) {
      return source === 'virtual-module' ? source : null
    },
    renderStart (outputOptions: any, inputOptions: any) {
      const outDir = outputOptions.dir
      fs.rm(resolve(outDir, 'dev-icon-32.png'), () => console.log(`Deleted dev-icon-32.png from prod build`))
      fs.rm(resolve(outDir, 'dev-icon-128.png'), () => console.log(`Deleted dev-icon-128.png from prod build`))
    }
  }
}

// plugin to support i18n 
export function crxI18n (options: { localize: boolean, src: string }): PluginOption {
  if (!options.localize) return null

  const getJsonFiles = (dir: string): Array<string> => {
    const files = fs.readdirSync(dir, {recursive: true}) as string[]
    return files.filter(file => !!file && file.endsWith('.json'))
  }
  const entry = resolve(__dirname, options.src)
  const localeFiles = getJsonFiles(entry)
  const files = localeFiles.map(file => {
    return {
      id: '',
      fileName: file,
      source: fs.readFileSync(resolve(entry, file))
    }
  })
  return {
    name: 'crx-i18n',
    enforce: 'pre',
    buildStart: {
      order: 'post',
      handler() {
        files.forEach((file) => {
            const refId = this.emitFile({
              type: 'asset',
              source: file.source,
              fileName: '_locales/'+file.fileName
            })
            file.id = refId
        })
      }
    }
  }
}