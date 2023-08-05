import type { CommandDef } from 'citty'

const _rDefault = (r: any) => (r.default || r) as Promise<CommandDef>

export default {
  config: () => import('./config').then(_rDefault),
}
