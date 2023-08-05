import { defineCommand, runMain } from 'citty'
import { description, version } from '../package.json'
import commands from './commands'

export const main = defineCommand({
  meta: {
    name: 'aitranslator',
    version,
    description,
  },
  args: {
    words: {
      type: 'positional',
      description: 'words to be translated',
    },
  },
  subCommands: commands,
  run: () => {
    console.log('main')
  },
})

runMain(main)
