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
export type {
  SdsGap,
  SdsOrientation,
  SdsPlacement,
  SdsRecipeAttribute,
  SdsRecipeClass,
  SdsSize,
  SdsTabsActivation,
  SdsTabsSize,
  SdsTabsVariant,
  SdsToggleDetail,
  SdsTone,
  SdsWidth,
} from './generated/interface.js'

export function defineSds(): void {
  registerSdsDialog()
  registerSdsDropdown()
  registerSdsPopover()
  registerSdsTabs()
  registerSdsToast()
  registerSdsTooltip()
}
