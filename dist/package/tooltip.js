import { FloatingHoverController as e, FloatingPositioner as t } from "./floating.js";
import { a as n, c as r, i, l as a, o, r as s, t as c } from "./internals-CEyyQZKd.js";
//#region src/elements/tooltip.ts
var l = typeof HTMLElement > "u" ? class {} : HTMLElement, u = class extends l {
	static observedAttributes = [
		"placement",
		"offset",
		"size"
	];
	content = null;
	positioner = null;
	hoverController = null;
	connection = new c();
	get placement() {
		return this.getAttribute("placement") ?? "block-start";
	}
	set placement(e) {
		a(this, "placement", e);
	}
	get offset() {
		return o(this, "offset", 6);
	}
	set offset(e) {
		r(this, "offset", e);
	}
	get size() {
		return this.getAttribute("size") ?? "sm";
	}
	set size(e) {
		a(this, "size", e);
	}
	connectedCallback() {
		this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
		let r = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), a = i(this), o = a.find((e) => e.matches("[role=\"tooltip\"], .sds-tooltip-content, [popover]")) ?? (a.length === 2 ? a[1] : null) ?? null, s = a.find((e) => e !== o) ?? null;
		if (!s || !o) {
			console.warn("<sds-tooltip> requires one direct child trigger and one direct child text element.");
			return;
		}
		let c = n(o, "sds-tooltip"), l = new Set((s.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
		l.add(c), o.classList.add("sds-tooltip-content"), o.setAttribute("role", "tooltip"), o.setAttribute("popover", "manual"), s.setAttribute("aria-describedby", [...l].join(" ")), this.content = o, this.positioner = new t(s, o, () => this.placement, () => this.getAttribute("offset") ?? void 0, 6), this.hoverController = new e(s, o, this.positioner, {
			closeDelay: 0,
			hoverOpenDelay: 0
		}), this.hoverController.observe(r), this.positioner.observe(r);
	}
	disconnectedCallback() {
		this.connection.disconnect(), this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
	}
	attributeChangedCallback(e, t, n) {
		t !== n && this.isConnected && this.content?.matches(":popover-open") && (this.positioner?.reset(), this.positioner?.position());
	}
};
function d() {
	s("sds-tooltip", u);
}
//#endregion
export { u as SdsTooltipElement, d as registerSdsTooltip };
