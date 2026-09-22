import { FloatingPositioner as e } from "./floating.js";
import { a as t, c as n, i as r, l as i, n as a, o, r as s, s as c, t as l } from "./internals-CEyyQZKd.js";
//#region src/elements/dropdown.ts
var u = typeof HTMLElement > "u" ? class {} : HTMLElement, d = class extends u {
	static observedAttributes = [
		"open",
		"placement",
		"offset"
	];
	trigger = null;
	menu = null;
	items = [];
	positioner = null;
	connection = new l();
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		c(this, "open", e);
	}
	get placement() {
		return this.getAttribute("placement") ?? "block-end-start";
	}
	set placement(e) {
		i(this, "placement", e);
	}
	get offset() {
		return o(this, "offset", 5);
	}
	set offset(e) {
		n(this, "offset", e);
	}
	get width() {
		return this.getAttribute("width") ?? "md";
	}
	set width(e) {
		i(this, "width", e);
	}
	get hideCaret() {
		return this.hasAttribute("hide-caret");
	}
	set hideCaret(e) {
		c(this, "hide-caret", e);
	}
	connectedCallback() {
		this.positioner = null, this.trigger = null, this.menu = null, this.items = [];
		let n = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), i = r(this), o = i.find((e) => e instanceof HTMLButtonElement), s = o?.getAttribute("popovertarget"), c = i.filter((e) => e !== o), l = i.find((e) => e.id === s) ?? c.find((e) => e.matches("menu, [popover], .sds-dropdown-menu")) ?? (c.length === 1 ? c[0] : null) ?? null;
		if (!o || !l) {
			console.warn("<sds-dropdown> requires one direct child button and one direct child menu or popover.");
			return;
		}
		a(o);
		let u = t(l, "sds-dropdown");
		l.classList.add("sds-dropdown-menu"), l.setAttribute("popover", l.getAttribute("popover") || "auto"), o.setAttribute("popovertarget", u), o.setAttribute("aria-controls", u), o.setAttribute("aria-expanded", String(l.matches(":popover-open"))), o.hasAttribute("aria-haspopup") || o.setAttribute("aria-haspopup", "menu"), l.setAttribute("role", "menu"), l.hasAttribute("aria-orientation") || l.setAttribute("aria-orientation", "vertical"), this.trigger = o, this.menu = l, this.positioner = new e(o, l, () => this.placement, () => this.getAttribute("offset") ?? void 0), this.collectItems(), o.addEventListener("keydown", this.handleTriggerKeydown, { signal: n }), l.addEventListener("beforetoggle", this.handleBeforeToggle, { signal: n }), l.addEventListener("toggle", this.handleToggle, { signal: n }), l.addEventListener("keydown", this.handleMenuKeydown, { signal: n }), l.addEventListener("click", this.handleMenuClick, { signal: n }), this.positioner.observe(n), this.open && this.show();
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
		c(this, "open", e), e ? this.positioner?.position() : this.positioner?.reset(), this.dispatchEvent(new CustomEvent("sds-toggle", {
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
function f() {
	s("sds-dropdown", d);
}
//#endregion
export { d as SdsDropdownElement, f as registerSdsDropdown };
