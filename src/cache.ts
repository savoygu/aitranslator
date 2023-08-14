import { red } from 'kolorist'
import conversation from './conversation.js'

export function cache(mode: string) {
  return (async () => {
    if (mode === 'rm') {
      conversation.clear()
      console.log(`${red('✔')} cleared cache`, conversation.path)
    }

    if (mode === 'ls') {
      console.log(conversation.path)
      return
    }

    throw new Error(`Invalid mode: ${mode}`)
  })().catch((error) => {
    console.error(`${red('✖')} ${error.message}`)
    process.exit(1)
  })
}
