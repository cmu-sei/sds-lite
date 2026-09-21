//#region src/elements/sidebar.ts
var e = !1, t = /* @__PURE__ */ new WeakMap();
function n(e) {
	let n = t.get(e);
	n !== void 0 && window.clearTimeout(n), t.delete(e), e.removeAttribute("sds-closing");
}
function r() {
	e || typeof document > "u" || (e = !0, document.addEventListener("beforetoggle", (e) => {
		if (!(e instanceof ToggleEvent) || e.oldState !== "open" || e.newState !== "closed" || !(e.target instanceof HTMLElement) || !e.target.matches(".sds-sidebar[popover]")) return;
		let r = e.target;
		n(r), r.setAttribute("sds-closing", ""), t.set(r, window.setTimeout(() => n(r), 500));
	}, !0), document.addEventListener("transitionend", (e) => {
		e.propertyName === "transform" && e.target instanceof HTMLElement && e.target.matches(".sds-sidebar[sds-closing]") && n(e.target);
	}, !0));
}
//#endregion
export { r as registerSdsSidebar };
