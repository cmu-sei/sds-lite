import { registerSdsDialog as e } from "./dialog.js";
import { registerSdsDropdown as t } from "./dropdown.js";
import { registerSdsPopover as n } from "./popover.js";
import { registerSdsTabs as r } from "./tabs.js";
import { registerSdsTooltip as i } from "./tooltip.js";
import { notify as a, registerSdsToast as o } from "./toast.js";
//#region src/sds.ts
function s() {
	e(), t(), n(), r(), o(), i();
}
//#endregion
export { s as defineSds, a as notify };
