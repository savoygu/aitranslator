import crypto from 'node:crypto'
import { HttpsProxyAgent } from 'https-proxy-agent'
import type { ChatMessage } from 'chatgpt'
import { ChatGPTAPI, ChatGPTError } from 'chatgpt'
import type { FetchOptions, FetchRequest } from 'ohmyfetch'
import { fetch } from 'ohmyfetch'
import ISO6391 from 'iso-639-1'
import { bgYellow, yellow } from 'kolorist'
import type { ValidConfig } from './config.js'
import cache from './conversation.js'
import type { TranslatorOptions } from './translator.js'

export interface _Conversation {
  lastMessageId?: string
}

export type Conversation = _Conversation & {
  [messageId: string]: ChatMessage | undefined
}

export async function createChatCompletion(words: string[], options: ValidConfig & Omit<TranslatorOptions, '--'>) {
  const apiKeyHash = hash(options.apiKey)
  const conversationName = options.conversationName ?? 'default'
  const conversationKey = `${conversationName}:${apiKeyHash}`
  const conversation
        = (options.continue && options.store
          ? cache.get(conversationKey, {})
          : {}) as Conversation

  let conversationId: string | undefined
  let parentMessageId: string | undefined
  if (conversation.lastMessageId) {
    const lastMessage = conversation[conversation.lastMessageId]
    if (lastMessage) {
      conversationId = lastMessage.conversationId
      parentMessageId = lastMessage.id
    }
  }

  if (options.debug)
    console.log(bgYellow(' using cache '), yellow(cache.path), '\n')

  try {
    const api = new ChatGPTAPI({
      apiKey: options.apiKey,
      debug: options.debug,
      apiOrg: options.apiOrg,
      apiBaseUrl: `https://${options.hostname}/v1`,
      completionParams: {
        model: options.model,
      },
      fetch: (url: FetchRequest, _options: FetchOptions) => {
        if (options.proxy)
          _options.agent = new HttpsProxyAgent(options.proxy)

        return fetch(url, _options)
      },
      getMessageById: options.store
        ? async (id) => {
          return conversation[id] as ChatMessage
        }
        : undefined,
      upsertMessage: async (message) => {
        if (options.store) {
          conversation[message.id] = message
          conversation.lastMessageId = message.id
          cache.set(conversationKey, conversation)
        }
      },
    })

    const result = await api.sendMessage(words.join(' '), {
      conversationId,
      parentMessageId,
      systemMessage: options.prompt || (options.style === 'detailed'
        ? `Now that you are a language translator, please translate what I have typed into ${ISO6391.getName(options.locale)}. Also give the phonetic symbols or pinyin of the words, and relevant example sentences.`
        : `Translate the given content into ${ISO6391.getName(options.locale)}.`),
      timeoutMs: options.timeout,
      onProgress: options.stream
        ? (progress) => {
            if (progress.delta)
              process.stdout.write(progress.delta)
          }
        : undefined,
    })

    if (options.stream)
      process.stdout.write('\n')

    return sanitizeMessage(result.text)
  }
  catch (error: any) {
    if (error.name === 'TimeoutError' || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT')
      throw new Error(`Time out error: request took over ${options.timeout}ms. Try increasing the \`timeout\` config, or checking the OpenAI API status https://status.openai.com`)

    if (error.cause?.code === 'ENOTFOUND')
      throw new Error(`Error connecting to ${options.hostname} (${error.cause.syscall}). Are you connected to the internet?`)

    if (error instanceof ChatGPTError) {
      const matched = error.message.match(/({\s*"error":\s*{[\s\S]+?}\s*})/)
      if (matched) {
        try {
          const reason = JSON.parse(matched[1])
          throw new Error(reason.error)
        }
        catch {}
      }
    }

    throw error
  }
}

function sanitizeMessage(message: string) {
  return message.trim().split('\n')
}

function hash(d: string) {
  const buffer = Buffer.isBuffer(d) ? d : Buffer.from(d.toString())
  return crypto.createHash('sha256').update(buffer).digest('hex')
}
