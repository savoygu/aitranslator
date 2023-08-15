import Conf from 'conf'
import type { Conversation } from './chatgpt.js'

const conversations = new Conf<Record<string, Conversation>>({ projectName: 'aitranslator:conversation' })

export default conversations
