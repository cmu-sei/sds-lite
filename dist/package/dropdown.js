import { FloatingPositioner as e } from "./floating.js";
import { a as t, c as n, i as r, n as i, o as a, r as o, s, t as c } from "./internals-BLPvKvsH.js";
//#region src/elements/dropdown.ts
var l = typeof HTMLElement > "u" ? class {} : HTMLElement, u = class extends l {
	static observedAttributes = [
		"open",
		"placement",
		"offset"
	];
	trigger = null;
	menu = null;
	items = [];
	positioner = null;
	connection = new c();
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		a(this, "open", e);
	}
	get placement() {
		return this.getAttribute("placement") ?? "block-end-start";
	}
	set placement(e) {
		n(this, "placement", e);
	}
	get offset() {
		return t(this, "offset", 5);
	}
	set offset(e) {
		s(this, "offset", e);
	}
	get width() {
		return this.getAttribute("width") ?? "md";
	}
	set width(e) {
		n(this, "width", e);
	}
	get hideCaret() {
		return this.hasAttribute("hide-caret");
	}
	set hideCaret(e) {
		a(this, "hide-caret", e);
	}
	connectedCallback() {
		this.positioner = null, this.trigger = null, this.menu = null, this.items = [];
		let t = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), n = o(this), i = n.find((e) => e instanceof HTMLButtonElement), a = i?.getAttribute("popovertarget"), s = n.filter((e) => e !== i), c = n.find((e) => e.id === a) ?? s.find((e) => e.matches("menu, [popover], .sds-dropdown-menu")) ?? (s.length === 1 ? s[0] : null) ?? null;
		if (!i || !c) {
			console.warn("<sds-dropdown> requires one direct child button and one direct child menu or popover.");
			return;
		}
		let l = r(c, "sds-dropdown");
		c.classList.add("sds-dropdown-menu"), c.setAttribute("popover", c.getAttribute("popover") || "auto"), i.setAttribute("popovertarget", l), i.setAttribute("aria-controls", l), i.setAttribute("aria-expanded", String(c.matches(":popover-open"))), i.hasAttribute("aria-haspopup") || i.setAttribute("aria-haspopup", "menu"), c.setAttribute("role", "menu"), c.hasAttribute("aria-orientation") || c.setAttribute("aria-orientation", "vertical"), this.trigger = i, this.menu = c, this.positioner = new e(i, c, () => this.placement, () => this.getAttribute("offset") ?? void 0), this.collectItems(), i.addEventListener("keydown", this.handleTriggerKeydown, { signal: t }), c.addEventListener("beforetoggle", this.handleBeforeToggle, { signal: t }), c.addEventListener("toggle", this.handleToggle, { signal: t }), c.addEventListener("keydown", this.handleMenuKeydown, { signal: t }), c.addEventListener("click", this.handleMenuClick, { signal: t }), this.positioner.observe(t), this.open && this.show();
	}
	disconnectedCallback() {
		this.connection.disconnect(), this.positioner = null, this.trigger = null, this.menu = null, this.items = [];
	}
	attributeChangedCallback(e, t, n) {
		if (t !== n && this.isConnected) {
			if (e === "open") {
				n === null ? this.hide() : this.show();
				return;
			}
			this.isSurfaceOpen() && (this.positioner?.reset(), this.positioner?.position());
		}
	}
	show() {
		if (!this.menu) {
			this.open = !0;
			return;
		}
		this.isSurfaceOpen() || (this.collectItems(), this.positioner?.reset(), this.menu.showPopover(), this.positioner?.position());
	}
	hide() {
		if (!this.menu) {
			this.open = !1;
			return;
		}
		this.isSurfaceOpen() && this.menu.hidePopover();
	}
	isSurfaceOpen() {
		return this.menu?.matches(":popover-open") ?? !1;
	}
	collectItems() {
		if (!this.menu) {
			this.items = [];
			return;
		}
		for (let e of this.menu.querySelectorAll(":scope > li")) e.hasAttribute("role") || e.setAttribute("role", "none");
		this.items = Array.from(this.menu.querySelectorAll("button, a[href], [role=\"menuitem\"]")).filter((e) => !e.closest("[role=\"menuitem\"] [role=\"menuitem\"]")).map((e) => (e.setAttribute("role", "menuitem"), e.tabIndex = -1, e)).filter((e) => !(e instanceof HTMLButtonElement) || !e.disabled);
	}
	showAndFocus(e = 0) {
		this.show(), this.items[e]?.focus();
	}
	hideAndRestoreFocus() {
		this.hide(), this.trigger?.focus();
	}
	handleToggle = () => {
		let e = this.isSurfaceOpen();
		a(this, "open", e), e ? this.positioner?.position() : this.positioner?.reset(), this.dispatchEvent(new CustomEvent("sds-toggle", {
			bubbles: !0,
			composed: !0,
			detail: { open: e }
		}));
	};
	handleBeforeToggle = (e) => {
		e.newState === "open" && (this.collectItems(), this.positioner?.reset()), this.trigger?.setAttribute("aria-expanded", String(e.newState === "open"));
	};
	handleTriggerKeydown = (e) => {
		let t = e.key === "ArrowUp" ? this.items.length - 1 : 0;
		(e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") && (e.preventDefault(), this.isSurfaceOpen() ? this.items[t]?.focus() : this.showAndFocus(t));
	};
	handleMenuKeydown = (e) => {
		this.collectItems();
		let t = this.items.findIndex((e) => e === document.activeElement), n = null;
		if (e.key === "ArrowDown") n = (t + 1) % this.items.length;
		else if (e.key === "ArrowUp") n = (t - 1 + this.items.length) % this.items.length;
		else if (e.key === "Home") n = 0;
		else if (e.key === "End") n = this.items.length - 1;
		else if (e.key === "Escape") {
			e.preventDefault(), this.hideAndRestoreFocus();
			return;
		}
		n !== null && this.items.length !== 0 && (e.preventDefault(), this.items[n].focus());
	};
	handleMenuClick = (e) => {
		if (!(e.target instanceof Element)) return;
		let t = e.target.closest("[role=\"menuitem\"]");
		if (t) {
			if (t.getAttribute("aria-disabled") === "true" || t instanceof HTMLButtonElement && t.disabled) {
				e.preventDefault();
				return;
			}
			this.hide();
		}
	};
};
function d() {
	i("sds-dropdown", u);
}
//#endregion
export { u as SdsDropdownElement, d as registerSdsDropdown };
