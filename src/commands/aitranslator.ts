import { intro, outro, spinner } from '@clack/prompts'
import { bgCyan, black, green, red } from 'kolorist'
import gradient from 'gradient-string'
import { omit } from 'lodash-es'
import { createChatCompletion } from '../core/openai.js'
import { getConfig } from '../core/config.js'
import { KnownError } from '../core/error.js'

export interface TranslatorCLIOptions {
  '--'?: string[]
  continue?: boolean
  debug?: boolean
  stream?: boolean
  store?: boolean
  conversationName?: string
  locale?: string
  model?: string
}

export interface AITranslatorOptions {
  words: string[]
  options?: TranslatorCLIOptions
}

export default function aitranslator({ words, options = {} }: AITranslatorOptions) {
  return (async () => {
    intro(bgCyan(black(' aitranslator ')))

    const { env } = process
    const config = await getConfig({
      apiKey: env.OPENAI_KEY || env.OPENAI_API_KEY,
      proxy: env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY,
    })

    if (options.stream) {
      await createChatCompletion({ words, options: { ...config, ...omit(options, ['--']) } })
      return outro(`${green('✔')} Successfully translated!`)
    }

    const s = spinner()
    s.start('The AI is translating your words')

    let result: string[]
    try {
      result = await createChatCompletion({ words, options: { ...config, ...omit(options, ['--']) } })
    }
    finally {
      s.stop('Words translated')
    }

    if (result.length === 0)
      throw new KnownError('No words were translated. Try again.')

    outro(`${green('✔')} Successfully translated!`)

    result.forEach((line) => {
      console.log(gradient.atlas(line))
    })

    console.log('\n')
  })().catch((error) => {
    outro(`${red('✖')} ${error.message}`)
    process.exit(1)
  })
}
