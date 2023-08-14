import { cac } from 'cac'
import { red } from 'kolorist'
import { version } from '../package.json'
import type { TranslatorCLIOptions } from './commands/aitranslator.js'
import aitranslator from './commands/aitranslator.js'
import type { ConfigCLIOptions } from './commands/aiconfig.js'
import aiconfig from './commands/aiconfig.js'
import aicache from './commands/aicache.js'

const cli = cac('aitranslator')

cli.command('[...words]', 'words to be translated')
  .option('-c, --continue [continue]', '[boolean] continue last conversion', { default: false })
  .option('-d, --debug [debug]', '[boolean] enables debug logging', { default: false })
  .option('-s, --stream [stream]', '[boolean] streams the response', { default: false })
  .option('-s, --store [store]', '[boolean] enable the local message cache', { default: true })
  .option('-n, --conversationName [conversationName]', '[string] unique name for the conversation')
  .option('-l, --locale [locale]', '[string] location (default: en)')
  .option('-m, --model [model]', '[string] openai model (default: gpt-3.5-turbo)')
  .action((words: string[], options: TranslatorCLIOptions) => {
    if (!words.length) {
      console.error(`${red('✖')} Please provide words to be translated\n`)
      cli.outputHelp()
      process.exit(1)
    }

    aitranslator({ words, options })
  })

cli.command('config [mode] [...key=value]', '[string] set | get, set or get config')
  .option('--hostname [hostname]', '[string] api service hostname (default: api.openai.com)')
  .option('--locale [locale]', '[string] location (default: en)')
  .option('--model [model]', '[string] openai model (default: gpt-3.5-turbo)')
  .option('--api-key [apiKey]', '[string] openai api key')
  .option('--api-org [apiOrg]', '[string] openai api organization')
  .option('--proxy [proxy]', '[string] web request proxy')
  .option('--timeout [timeout]', '[number] request timeout (default: 10_000)')
  .action(async (mode: string, keyValue: string[], options: ConfigCLIOptions) => {
    if (!mode)
      return aitranslator({ words: ['config'] })

    aiconfig({ mode, keyValue, options })
  })

cli.command('cache [mode]', '[string] ls | rm, list or remove local message cache')
  .action((mode: string) => {
    if (!mode)
      return aitranslator({ words: ['cache'] })

    aicache({ mode })
  })

cli.help()
cli.version(version)
cli.parse()
