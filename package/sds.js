import { registerSdsDialog as e } from "./dialog.js";
import { registerSdsDropdown as t } from "./dropdown.js";
import { registerSdsPopover as n } from "./popover.js";
import { registerSdsTabs as r } from "./tabs.js";
import { registerSdsTooltip as i } from "./tooltip.js";
import { notify as a, registerSdsToast as o } from "./toast.js";
//#region src/sds.ts
var s = {
	dialog: e,
	dropdown: t,
	popover: n,
	tabs: r,
	toast: o,
	tooltip: i
};
function c(e = {}) {
	let t = e.include ?? Object.keys(s);
	for (let e of t) {
		let t = s[e];
		if (!t) throw RangeError(`Unknown SDS behavior: ${String(e)}`);
		t();
	}
}
//#endregion
export { c as defineSds, a as notify };
