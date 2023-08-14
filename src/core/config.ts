import { readUser, writeUser } from 'rc9'
import { has, omit } from 'lodash-es'
import type { ConfigCLIOptions } from '../commands/aiconfig.js'
import { KnownError } from './error.js'

function parseAssert(name: string, condition: any, message: string) {
  if (!condition)
    throw new KnownError(`Invalid config property ${name}: ${message}`)
}

const configParser = {
  hostname(hostname?: string) {
    if (!hostname)
      return 'api.openai.com'

    parseAssert('hostname', /^([a-zA-Z\d-]+\.)*[a-zA-Z\d-]+\.[a-zA-Z]+$/.test(hostname), 'Must be an hostname')

    return hostname
  },
  locale(locale?: string) {
    if (!locale)
      return 'en'

    parseAssert('locale', locale, 'Cannot be empty')
    parseAssert('locale', /^[a-z-]+$/i.test(locale), 'Must be a valid locale (letters and dashes/underscores). You can consult the list of codes in: https://wikipedia.org/wiki/List_of_ISO_639-1_codes')

    return locale
  },
  model(model?: string) {
    if (!model || model.length === 0)
      return 'gpt-3.5-turbo'

    return model
  },
  apiKey(key?: string) {
    if (!key)
      throw new KnownError('Please set you OpenAI API Key via `aitranslator config set apiKey=<your token>`')

    parseAssert('OPENAI_API_KEY', key.startsWith('sk-'), 'Must start width "sk-"')

    return key
  },
  apiOrg(org?: string) {
    // TODO
    return org
  },
  proxy(url?: string) {
    if (!url || url.length === 0)
      return undefined

    parseAssert('proxy', /^https?:\/\//.test(url), 'Must be a valid URL')

    return url
  },
  timeout(timeout?: string) {
    if (!timeout)
      return 10_000

    parseAssert('timeout', /^\d+$/.test(timeout), 'Must be an integer')

    const parsed = Number(timeout)
    parseAssert('timeout', parsed >= 500, 'Must be greater than 500ms')

    return parsed
  },
} as const

export type ConfigKeys = keyof typeof configParser
export type RawConfig = { [K in ConfigKeys]?: string }
export type ValidConfig = { [K in ConfigKeys]: ReturnType<typeof configParser[K]> }

const CONFIG_FILE = '.aitranslatorrc'

export async function getConfig(cliConfig?: RawConfig, suppressErrors?: boolean) {
  const globalConfig = await readUser<RawConfig>(CONFIG_FILE)
  const parsedConfig: Record<string, unknown> = {}

  for (const [key, parser] of Object.entries(configParser)) {
    const configKey = key as ConfigKeys
    const value = cliConfig?.[configKey] ?? globalConfig[configKey]

    if (suppressErrors) {
      try {
        parsedConfig[configKey] = parser(value)
      }
      catch {}
    }
    else {
      parsedConfig[configKey] = parser(value)
    }
  }
  return parsedConfig as ValidConfig
}

export async function setConfigs(keyValues: [string, string][]) {
  const config = await readUser<RawConfig>(CONFIG_FILE)

  for (const [key, value] of keyValues) {
    if (!has(configParser, key))
      throw new KnownError(`Invalid config property: ${key}`)

    const parsedValue = configParser[key as ConfigKeys](value)
    config[key as ConfigKeys] = parsedValue as any
  }

  await writeUser(config, CONFIG_FILE)
}

export function resolveConfig(keyValues: string[], options: ConfigCLIOptions) {
  return keyValues.map(kv => kv.split('=') as [string, string | number])
    .concat(Object.entries(omit(options, ['--'])))
}
