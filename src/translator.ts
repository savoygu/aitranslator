import { intro, outro, spinner } from '@clack/prompts'
import { bgCyan, black, green, red } from 'kolorist'
import gradient from 'gradient-string'
import { omit } from 'lodash-es'
import { createChatCompletion } from './chatgpt.js'
import { getConfig } from './config.js'

export interface TranslatorOptions {
  '--'?: string[]
  c?: boolean
  continue?: boolean
  d?: boolean
  debug?: boolean
  s?: boolean
  stream?: boolean
  S?: boolean
  store?: boolean
  n?: string
  conversationName?: string
  l?: string
  locale?: string
  m?: string
  model?: string
  p?: string
  prompt?: string
}

export function translator(words: string[], inlineConfig: TranslatorOptions = {}) {
  return (async () => {
    intro(bgCyan(black(' aitranslator ')))

    const { env } = process
    const globalConfig = await getConfig({
      apiKey: env.OPENAI_KEY || env.OPENAI_API_KEY,
      proxy: env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY,
    })

    if (inlineConfig.stream) {
      await createChatCompletion(words, { ...globalConfig, ...omit(inlineConfig, ['--']) })
    }
    else {
      const s = spinner()
      s.start('The AI is translating your words')

      let result: string[] = []
      try {
        result = await createChatCompletion(words, { ...globalConfig, ...omit(inlineConfig, ['--']) })
      }
      finally {
        s.stop(result.length ? 'Words translated' : 'Words not translated')
      }

      if (result.length === 0)
        throw new Error('No words were translated. Try again.')

      console.log()
      result.forEach((line) => {
        console.log(`    ${gradient.atlas(line)}`)
      })
      console.log()
    }

    outro(`${green('✔')} Successfully translated!`)
  })().catch((error) => {
    outro(`${red('✖')} ${error.message}`)
    process.exit(1)
  })
}
