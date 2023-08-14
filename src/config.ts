import { red } from 'kolorist'
import { has, omit } from 'lodash-es'
import { readUser, writeUser } from 'rc9'
import { CONFIG_FILE } from './constants.js'

export interface ConfigOptions {
  '--'?: string[]
  hostname?: string
  locale?: string
  model?: string
  apiKey?: string
  apiOrg?: string
  proxy?: string
  timeout?: string
  style?: string // simple or detailed
  prompt?: string
}

export function config(mode: string, keyValues: [string, string | number][]) {
  return (async () => {
    if (mode === 'get') {
      const globalConfig = await getConfig({}, true)
      // print all global configs
      if (!keyValues.length) {
        Object.entries(globalConfig).forEach(([key, value]) => {
          console.log(`${key}=${value ?? ''}`)
        })
        return
      }

      for (const [_key] of keyValues) {
        const key = _key as ConfigKeys
        if (has(globalConfig, key))
          console.log(`${key}=${globalConfig[key]}`)
      }
      return
    }

    if (mode === 'set') {
      await setConfigs(keyValues as [string, string][])
      return
    }

    throw new Error(`Invalid mode: ${mode}`)
  })().catch((error) => {
    console.error(`${red('✖')} ${error.message}`)
    process.exit(1)
  })
}

function parseAssert(name: string, condition: any, message: string) {
  if (!condition)
    throw new Error(`Invalid config property ${name}: ${message}`)
}

export const configParser = {
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
      throw new Error('Please set you OpenAI API Key via `aitranslator config set apiKey=<your token>`')

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
  style(style?: string) {
    if (!style)
      return 'simple'

    parseAssert('style', ['simple', 'detailed'].includes(style), 'Must be simple or detailed')

    return style
  },
  prompt(prompt?: string) {
    // TODO
    return prompt
  },
} as const

export type ConfigKeys = keyof typeof configParser
export type RawConfig = { [K in ConfigKeys]?: string }
export type ValidConfig = { [K in ConfigKeys]: ReturnType<typeof configParser[K]> }

export async function getConfig(cliConfig?: RawConfig, suppressErrors?: boolean) {
  const globalConfig = await readUser<RawConfig>(CONFIG_FILE)
  const parsedConfig: Record<string, unknown> = {}

  for (const [_key, parser] of Object.entries(configParser)) {
    const key = _key as ConfigKeys
    const value = cliConfig?.[key] ?? globalConfig[key]

    if (suppressErrors) {
      try {
        parsedConfig[key] = parser(value)
      }
      catch {}
    }
    else {
      parsedConfig[key] = parser(value)
    }
  }
  return parsedConfig as ValidConfig
}

export async function setConfigs(keyValues: [string, string][]) {
  const globalConfig = await readUser<RawConfig>(CONFIG_FILE)

  for (const [_key, value] of keyValues) {
    const key = _key as ConfigKeys
    if (!has(configParser, key))
      throw new Error(`Invalid config property: ${key}`)

    const parsedValue = configParser[key](value)
    globalConfig[key] = parsedValue as any
  }

  await writeUser(globalConfig, CONFIG_FILE)
}

export function resolveConfig(keyValueConfig: string[], inlineConfig: ConfigOptions) {
  return keyValueConfig.map(kv => kv.split('=') as [string, string])
    .concat(Object.entries(omit(inlineConfig, ['--'])))
}
