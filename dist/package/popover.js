import { FloatingHoverController as e, FloatingPositioner as t } from "./floating.js";
import { a as n, c as r, i, n as a, o, r as s, s as c, t as l } from "./internals-BLPvKvsH.js";
//#region src/elements/popover.ts
var u = typeof HTMLElement > "u" ? class {} : HTMLElement, d = class extends u {
	static observedAttributes = [
		"open",
		"placement",
		"offset"
	];
	content = null;
	positioner = null;
	hoverController = null;
	connection = new l();
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		o(this, "open", e);
	}
	get placement() {
		return this.getAttribute("placement") ?? "block-end-start";
	}
	set placement(e) {
		r(this, "placement", e);
	}
	get offset() {
		return n(this, "offset", 9);
	}
	set offset(e) {
		c(this, "offset", e);
	}
	get width() {
		return this.getAttribute("width") ?? "md";
	}
	set width(e) {
		r(this, "width", e);
	}
	connectedCallback() {
		this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
		let n = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), r = s(this), a = r.find((e) => e instanceof HTMLButtonElement), o = a?.getAttribute("popovertarget"), c = r.filter((e) => e !== a), l = r.find((e) => e.id === o) ?? c.find((e) => e.matches("[popover], .sds-popover-content")) ?? (c.length === 1 ? c[0] : null) ?? null;
		if (!a || !l) {
			console.warn("<sds-popover> requires one direct child button and one direct child content element.", this);
			return;
		}
		let u = i(l, "sds-popover");
		l.classList.add("sds-popover-content"), l.setAttribute("popover", l.getAttribute("popover") || "auto"), a.setAttribute("popovertarget", u), this.content = l, this.positioner = new t(a, l, () => this.placement, () => this.getAttribute("offset") ?? void 0, 9), this.hoverController = new e(a, l, this.positioner, {
			focusOpenDelay: 500,
			hoverOpenDelay: 500
		}), this.hoverController.observe(n), this.positioner.observe(n), l.addEventListener("toggle", this.handleToggle, { signal: n }), this.open && this.show();
	}
	disconnectedCallback() {
		this.connection.disconnect(), this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
	}
	attributeChangedCallback(e, t, n) {
		if (t !== n && this.isConnected) {
			if (e === "open") {
				n === null ? this.hide() : this.show();
				return;
			}
			this.content?.matches(":popover-open") && (this.positioner?.reset(), this.positioner?.position());
		}
	}
	show() {
		if (!this.content) {
			this.open = !0;
			return;
		}
		this.content.matches(":popover-open") || this.content.showPopover();
	}
	hide() {
		if (!this.content) {
			this.open = !1;
			return;
		}
		this.content.matches(":popover-open") && this.content.hidePopover();
	}
	handleToggle = () => {
		let e = this.content?.matches(":popover-open") ?? !1;
		o(this, "open", e), this.dispatchEvent(new CustomEvent("sds-toggle", {
			bubbles: !0,
			composed: !0,
			detail: { open: e }
		}));
	};
};
function f() {
	a("sds-popover", d);
}
//#endregion
export { d as SdsPopoverElement, f as registerSdsPopover };
