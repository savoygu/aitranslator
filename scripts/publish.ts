import { $ } from 'execa'
import { gray, green } from 'kolorist'
import { name, version } from '../package.json'

const $$ = $({ stdio: 'inherit' })

console.log(gray('📦 Build'))
await $$`nr build`

console.log(gray('🚀 Publish'))
await $$`npm publish${version.includes('beta') ? ' --tag beta' : ''}`

console.log(green(`Published ${name}`))
