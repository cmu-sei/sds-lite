import { registerSdsDialog } from './elements/dialog.js'
import { registerSdsDropdown } from './elements/dropdown.js'
import { registerSdsPopover } from './elements/popover.js'
import { registerSdsTabs } from './elements/tabs.js'
import { registerSdsTooltip } from './elements/tooltip.js'
import { registerSdsToast } from './elements/toast.js'

export {
  notify,
  type SdsNotifyOptions,
  type SdsToastCloseReason,
  type SdsToastTone,
} from './elements/toast.js'
export type { SdsTabsChangeDetail } from './elements/tabs.js'

export type SdsBehavior =
  | 'dialog'
  | 'dropdown'
  | 'popover'
  | 'tabs'
  | 'toast'
  | 'tooltip'

export interface DefineSdsOptions {
  include?: readonly SdsBehavior[]
}

const registrations: Record<SdsBehavior, () => void> = {
  dialog: registerSdsDialog,
  dropdown: registerSdsDropdown,
  popover: registerSdsPopover,
  tabs: registerSdsTabs,
  toast: registerSdsToast,
  tooltip: registerSdsTooltip,
}

export function defineSds(options: DefineSdsOptions = {}): void {
  const behaviors =
    options.include ?? (Object.keys(registrations) as SdsBehavior[])
  for (const behavior of behaviors) {
    const register = registrations[behavior]
    if (!register) {
      throw new RangeError(`Unknown SDS behavior: ${String(behavior)}`)
    }
    register()
  }
}
