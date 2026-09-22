import { registerSdsDialog as e } from "./dialog.js";
import { registerSdsDropdown as t } from "./dropdown.js";
import { registerSdsPopover as n } from "./popover.js";
import { registerSdsSidebar as r } from "./sidebar.js";
import { registerSdsTabs as i } from "./tabs.js";
import { registerSdsTooltip as a } from "./tooltip.js";
import { notify as o, registerSdsToast as s } from "./toast.js";
//#region src/sds.ts
function c() {
	e(), t(), n(), r(), i(), s(), a();
}
//#endregion
export { o as notify, c as setupSds };
