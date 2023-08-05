import { defineCommand } from 'citty'

export default defineCommand({
  meta: {
    name: 'config',
  },
  run: () => {
    console.log('config')
  },
})
