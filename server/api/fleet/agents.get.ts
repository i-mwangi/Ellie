import { usePlatform } from '../../platform'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const { registry, mode } = usePlatform()

  return {
    mode,
    agents: await registry.list(session),
  }
})
