import { red } from 'kolorist'
import conversations from './conversation.js'

export function cache(mode: string) {
  return (async () => {
    if (mode === 'rm') {
      conversations.clear()
      console.log(`${red('✔')} cleared cache`, conversations.path)
    }

    if (mode === 'ls') {
      console.log(conversations.path)
      return
    }

    throw new Error(`Invalid mode: ${mode}`)
  })().catch((error) => {
    console.error(`${red('✖')} ${error.message}`)
    process.exit(1)
  })
}
