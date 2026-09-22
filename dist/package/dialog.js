//#region src/elements/dialog.ts
var e = !1;
function t(e) {
	let t = e.getAttribute("commandfor");
	if (t) {
		let e = document.getElementById(t);
		return e instanceof HTMLDialogElement && e.matches(".sds-dialog, .sds-panel") ? e : null;
	}
	return e.closest("dialog.sds-dialog, dialog.sds-panel");
}
function n(e, t) {
	e.open || (t ? e.showModal() : e.show());
}
function r(e) {
	if (!(e.target instanceof Element)) return;
	let r = e.target.closest("[commandfor], dialog.sds-dialog [command], dialog.sds-panel [command]");
	if (r) {
		let i = t(r);
		if (!i) return;
		let a = r.getAttribute("command");
		if ((a === "show-modal" || a === "close" || a === "request-close") && e.preventDefault(), a === "show-modal") n(i, !0);
		else if (a === "close") i.close(r.getAttribute("data-sds-return-value") ?? "");
		else if (a === "request-close") {
			let e = Reflect.get(i, "requestClose");
			if (typeof e == "function") e.call(i, r.getAttribute("data-sds-return-value") ?? "");
			else {
				let e = new Event("cancel", { cancelable: !0 });
				i.dispatchEvent(e) && i.close(r.getAttribute("data-sds-return-value") ?? "");
			}
		}
		return;
	}
	let i = e.target.closest("dialog.sds-dialog[open], dialog.sds-panel[open]");
	if (!i || e.target !== i) return;
	let a = i.getBoundingClientRect();
	(e.clientX < a.left || e.clientX > a.right || e.clientY < a.top || e.clientY > a.bottom) && i.getAttribute("closedby") === "any" && i.close();
}
function i() {
	e || typeof document > "u" || (e = !0, document.addEventListener("click", r));
}
//#endregion
export { i as registerSdsDialog };
