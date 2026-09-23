import { registerSdsCombobox as e } from "./combobox.js";
import { registerSdsDialog as t } from "./dialog.js";
import { registerSdsDropdown as n } from "./dropdown.js";
import { registerSdsPopover as r } from "./popover.js";
import { registerSdsSidebar as i } from "./sidebar.js";
import { registerSdsTabs as a } from "./tabs.js";
import { registerSdsTooltip as o } from "./tooltip.js";
import { notify as s, registerSdsToast as c } from "./toast.js";
//#region src/sds.ts
function l() {
	e(), t(), n(), r(), i(), a(), c(), o();
}
//#endregion
export { s as notify, l as setupSds };
