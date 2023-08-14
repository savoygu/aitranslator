import { cac } from 'cac'
import { red } from 'kolorist'
import { version } from '../package.json'
import type { TranslatorOptions } from './translator.js'
import type { ConfigOptions } from './config.js'

const cli = cac('aitranslator')

cli.command('[...words]', 'words to be translated')
  .option('-c, --continue', '[boolean] continue last conversion', { default: false })
  .option('-d, --debug', '[boolean] enables debug logging', { default: false })
  .option('-s, --stream', '[boolean] streams the response', { default: false })
  .option('-S, --store', '[boolean] enable the local message cache', { default: true })
  .option('-n, --conversationName <conversationName>', '[string] unique name for the conversation')
  .option('-l, --locale <locale>', '[string] location (default: en)')
  .option('-m, --model <model>', '[string] openai model (default: gpt-3.5-turbo)')
  .option('-t, --style [style]', '[string] simple | detailed, prompt style (default: simple)')
  .option('-p, --prompt [prompt]', '[string] custom prompt')
  .action(async (words: string[], options: TranslatorOptions) => {
    if (!words.length) {
      console.error(`${red('✖')} Please provide words to be translated\n`)
      cli.outputHelp()
      process.exit(1)
    }

    const { translator } = await import('./translator.js')
    translator(words, options)
  })

cli.command('config [mode] [...key=value]', '[string] set | get, set or get config')
  .option('--hostname [hostname]', '[string] api service hostname (default: api.openai.com)')
  .option('--locale [locale]', '[string] location (default: en)')
  .option('--model [model]', '[string] openai model (default: gpt-3.5-turbo)')
  .option('--api-key [apiKey]', '[string] openai api key')
  .option('--api-org [apiOrg]', '[string] openai api organization')
  .option('--proxy [proxy]', '[string] web request proxy')
  .option('--timeout [timeout]', '[number] request timeout (default: 10_000)')
  .option('--style [style]', '[string] simple | detailed, prompt style (default: simple)')
  .option('--prompt [prompt]', '[string] custom prompt')
  .action(async (mode: string, keyValue: string[], options: ConfigOptions) => {
    if (!mode) {
      const { translator } = await import('./translator.js')
      return translator(['config'], options)
    }

    const { config, resolveConfig } = await import('./config.js')
    const keyValues = await resolveConfig(keyValue, options)
    config(mode, keyValues)
  })

cli.command('cache [mode]', '[string] ls | rm, list or remove local message cache')
  .action(async (mode: string, options) => {
    if (!mode) {
      const { translator } = await import('./translator.js')
      return translator(['cache'], options)
    }

    const { cache } = await import('./cache.js')
    cache(mode)
  })

cli.help()
cli.version(version)
cli.parse()
