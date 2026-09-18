import { FloatingHoverController as e, FloatingPositioner as t } from "./floating.js";
import { a as n, c as r, i, n as a, r as o, s, t as c } from "./internals-BLPvKvsH.js";
//#region src/elements/tooltip.ts
var l = typeof HTMLElement > "u" ? class {} : HTMLElement, u = class extends l {
	static observedAttributes = ["placement", "offset"];
	content = null;
	positioner = null;
	hoverController = null;
	connection = new c();
	get placement() {
		return this.getAttribute("placement") ?? "block-start";
	}
	set placement(e) {
		r(this, "placement", e);
	}
	get offset() {
		return n(this, "offset", 6);
	}
	set offset(e) {
		s(this, "offset", e);
	}
	connectedCallback() {
		this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
		let n = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), r = o(this), a = r.find((e) => e.matches("[role=\"tooltip\"], .sds-tooltip-content, [popover]")) ?? (r.length === 2 ? r[1] : null) ?? null, s = r.find((e) => e !== a) ?? null;
		if (!s || !a) {
			console.warn("<sds-tooltip> requires one direct child trigger and one direct child text element.");
			return;
		}
		let c = i(a, "sds-tooltip"), l = new Set((s.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
		l.add(c), a.classList.add("sds-tooltip-content"), a.setAttribute("role", "tooltip"), a.setAttribute("popover", "manual"), s.setAttribute("aria-describedby", [...l].join(" ")), this.content = a, this.positioner = new t(s, a, () => this.placement, () => this.getAttribute("offset") ?? void 0, 6), this.hoverController = new e(s, a, this.positioner, {
			closeDelay: 0,
			hoverOpenDelay: 0
		}), this.hoverController.observe(n), this.positioner.observe(n);
	}
	disconnectedCallback() {
		this.connection.disconnect(), this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
	}
	attributeChangedCallback(e, t, n) {
		t !== n && this.isConnected && this.content?.matches(":popover-open") && (this.positioner?.reset(), this.positioner?.position());
	}
};
function d() {
	a("sds-tooltip", u);
}
//#endregion
export { u as SdsTooltipElement, d as registerSdsTooltip };
