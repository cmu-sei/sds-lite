import { registerSdsCombobox } from './elements/combobox.js'
import { registerSdsDialog } from './elements/dialog.js'
import { registerSdsDropdown } from './elements/dropdown.js'
import { registerSdsPopover } from './elements/popover.js'
import { registerSdsSidebar } from './elements/sidebar.js'
import { registerSdsTabs } from './elements/tabs.js'
import { registerSdsTooltip } from './elements/tooltip.js'
import { registerSdsToast } from './elements/toast.js'

export {
  notify,
  type SdsNotifyOptions,
  type SdsToastElement,
  type SdsToastCloseReason,
  type SdsToastTone,
} from './elements/toast.js'
export type {
  SdsComboboxElement,
  SdsComboboxSelectDetail,
} from './elements/combobox.js'
export type { SdsDropdownElement } from './elements/dropdown.js'
export type { SdsPopoverElement } from './elements/popover.js'
export type {
  SdsTabsChangeDetail,
  SdsTabsElement,
} from './elements/tabs.js'
export type { SdsTooltipElement } from './elements/tooltip.js'
export type {
  SdsGap,
  SdsOrientation,
  SdsPlacement,
  SdsSize,
  SdsTabsActivation,
  SdsTabsSize,
  SdsTabsVariant,
  SdsToggleDetail,
  SdsTone,
  SdsWidth,
} from './generated/interface.js'

export function setupSds(): void {
  registerSdsCombobox()
  registerSdsDialog()
  registerSdsDropdown()
  registerSdsPopover()
  registerSdsSidebar()
  registerSdsTabs()
  registerSdsToast()
  registerSdsTooltip()
}
