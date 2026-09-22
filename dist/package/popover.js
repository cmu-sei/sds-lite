import { FloatingHoverController as e, FloatingPositioner as t } from "./floating.js";
import { a as n, c as r, i, l as a, n as o, o as s, r as c, s as l, t as u } from "./internals-CEyyQZKd.js";
//#region src/elements/popover.ts
var d = typeof HTMLElement > "u" ? class {} : HTMLElement, f = class extends d {
	static observedAttributes = [
		"open",
		"placement",
		"offset"
	];
	content = null;
	positioner = null;
	hoverController = null;
	connection = new u();
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		l(this, "open", e);
	}
	get placement() {
		return this.getAttribute("placement") ?? "block-end-start";
	}
	set placement(e) {
		a(this, "placement", e);
	}
	get offset() {
		return s(this, "offset", 9);
	}
	set offset(e) {
		r(this, "offset", e);
	}
	get width() {
		return this.getAttribute("width") ?? "md";
	}
	set width(e) {
		a(this, "width", e);
	}
	connectedCallback() {
		this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
		let r = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), a = i(this), s = a.find((e) => e instanceof HTMLButtonElement), c = s?.getAttribute("popovertarget"), l = a.filter((e) => e !== s), u = a.find((e) => e.id === c) ?? l.find((e) => e.matches("[popover], .sds-popover-content")) ?? (l.length === 1 ? l[0] : null) ?? null;
		if (!s || !u) {
			console.warn("<sds-popover> requires one direct child button and one direct child content element.");
			return;
		}
		o(s);
		let d = n(u, "sds-popover");
		u.classList.add("sds-popover-content"), u.setAttribute("popover", u.getAttribute("popover") || "auto"), s.setAttribute("popovertarget", d), this.content = u, this.positioner = new t(s, u, () => this.placement, () => this.getAttribute("offset") ?? void 0, 9), this.hoverController = new e(s, u, this.positioner, {
			focusOpenDelay: 500,
			hoverOpenDelay: 500
		}), this.hoverController.observe(r), this.positioner.observe(r), u.addEventListener("toggle", this.handleToggle, { signal: r }), this.open && this.show();
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
		l(this, "open", e), this.dispatchEvent(new CustomEvent("sds-toggle", {
			bubbles: !0,
			composed: !0,
			detail: { open: e }
		}));
	};
};
function p() {
	c("sds-popover", f);
}
//#endregion
export { f as SdsPopoverElement, p as registerSdsPopover };
