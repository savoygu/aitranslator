import { red } from 'kolorist'
import cache from '../core/cache.js'
import { KnownError } from '../core/error.js'

export interface AICacheOptions {
  mode: string
}

export default function aicache({ mode }: AICacheOptions) {
  return (async () => {
    if (mode === 'rm') {
      cache.clear()
      console.log(`${red('✔')} cleared cache`, cache.path)
    }

    if (mode === 'ls') {
      console.log(cache.path)
      return
    }

    throw new KnownError(`Invalid mode: ${mode}`)
  })().catch((error) => {
    console.error(`${red('✖')} ${error.message}`)
    process.exit(1)
  })
}
