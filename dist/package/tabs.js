import { a as e, i as t, l as n, n as r, r as i, t as a } from "./internals-CEyyQZKd.js";
//#region src/elements/tabs.ts
var o = "sds-change", s = typeof HTMLElement > "u" ? class {} : HTMLElement, c = class extends s {
	static observedAttributes = ["value"];
	tabs = [];
	panels = /* @__PURE__ */ new Map();
	connection = new a();
	reflectingValue = !1;
	get value() {
		return this.getAttribute("value") ?? "";
	}
	set value(e) {
		if (this.isConnected && !this.tabs.some((t) => this.tabValue(t) === e && !this.isDisabled(t))) throw RangeError(`<sds-tabs> has no enabled tab with value "${e}".`);
		n(this, "value", e);
	}
	get activation() {
		return this.getAttribute("activation") ?? "automatic";
	}
	set activation(e) {
		n(this, "activation", e);
	}
	get orientation() {
		return this.getAttribute("orientation") ?? "horizontal";
	}
	set orientation(e) {
		n(this, "orientation", e), this.syncOrientation();
	}
	get size() {
		return this.getAttribute("size") ?? "md";
	}
	set size(e) {
		n(this, "size", e);
	}
	get tone() {
		return this.getAttribute("tone") ?? "info";
	}
	set tone(e) {
		n(this, "tone", e);
	}
	get variant() {
		return this.getAttribute("variant") ?? "folder";
	}
	set variant(e) {
		n(this, "variant", e);
	}
	connectedCallback() {
		let n = this.connection.connect(this, () => this.connectedCallback(), {
			childList: !0,
			subtree: !0
		}), i = t(this), a = i.find((e) => e.matches(".sds-tab-list, [role=\"tablist\"]")) ?? i[0] ?? null;
		if (this.tabs = a ? t(a).filter((e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement) : [], this.panels.clear(), !a || this.tabs.length === 0) {
			console.warn("<sds-tabs> requires a tab-list container with button or link children.");
			return;
		}
		let o = i.filter((e) => e !== a);
		if (o.length < this.tabs.length) {
			console.warn("<sds-tabs> requires one panel for every tab.");
			return;
		}
		a.classList.add("sds-tab-list"), a.setAttribute("role", "tablist"), this.syncOrientation(a), !a.hasAttribute("aria-label") && !a.hasAttribute("aria-labelledby") && console.warn("<sds-tabs> requires an accessible name on its tab list.");
		let s = new Set(o);
		for (let [t, n] of this.tabs.entries()) {
			n instanceof HTMLButtonElement && r(n);
			let i = n.getAttribute("aria-controls"), a = o.find((e) => e.id === i) ?? null, c = a && s.has(a) ? a : o[t] && s.has(o[t]) ? o[t] : s.values().next().value;
			if (!c) continue;
			s.delete(c);
			let l = e(n, "sds-tab"), u = e(c, "sds-tab-panel");
			n.classList.add("sds-tab"), n.setAttribute("role", "tab"), n.setAttribute("aria-controls", u), c.classList.add("sds-tab-panel"), c.setAttribute("role", "tabpanel"), c.setAttribute("aria-labelledby", l), this.panels.set(n, c);
		}
		let c = this.value ? this.tabs.find((e) => this.tabValue(e) === this.value && !this.isDisabled(e)) : null;
		this.value && !c && console.warn(`<sds-tabs> has no enabled tab with value "${this.value}".`);
		let l = c ?? this.tabs.find((e) => e.getAttribute("aria-selected") === "true" && !this.isDisabled(e)) ?? this.tabs.find((e) => !this.isDisabled(e)) ?? null;
		for (let e of this.tabs) {
			let t = e === l;
			e.setAttribute("aria-selected", String(t)), e.tabIndex = t ? 0 : -1;
			let n = this.panels.get(e);
			n && (n.hidden = !t);
		}
		l && this.reflectValue(this.tabValue(l)), a.addEventListener("click", this.handleClick, { signal: n }), a.addEventListener("keydown", this.handleKeydown, { signal: n });
	}
	disconnectedCallback() {
		this.connection.disconnect();
	}
	attributeChangedCallback(e, t, n) {
		if (e !== "value" || t === n || this.reflectingValue || !this.isConnected || n === null) return;
		let r = this.tabs.findIndex((e) => this.tabValue(e) === n && !this.isDisabled(e));
		if (r >= 0) {
			this.select(r, !1, !1);
			return;
		}
		console.warn(`<sds-tabs> has no enabled tab with value "${n}".`);
		let i = this.tabs.find((e) => e.getAttribute("aria-selected") === "true");
		i && this.reflectValue(this.tabValue(i));
	}
	isDisabled(e) {
		return e instanceof HTMLButtonElement && e.disabled || e.getAttribute("aria-disabled") === "true";
	}
	syncOrientation(e) {
		this.hasAttribute("orientation") && (e ?? t(this).find((e) => e.matches(".sds-tab-list, [role=\"tablist\"]")))?.setAttribute("aria-orientation", this.orientation);
	}
	tabValue(e) {
		return e.getAttribute("value") ?? e.id;
	}
	reflectValue(e) {
		this.reflectingValue = !0, n(this, "value", e), this.reflectingValue = !1;
	}
	select(e, t = !1, n = !0) {
		let r = this.tabs[e], i = this.panels.get(r);
		if (!r || !i || this.isDisabled(r)) return;
		let a = this.tabs.findIndex((e) => e.getAttribute("aria-selected") === "true");
		this.tabs.forEach((e) => {
			let t = e === r;
			e.setAttribute("aria-selected", String(t)), e.tabIndex = t ? 0 : -1;
			let n = this.panels.get(e);
			n && (n.hidden = !t);
		}), this.reflectValue(this.tabValue(r)), t && r.focus(), n && a !== e && this.dispatchEvent(new CustomEvent(o, {
			bubbles: !0,
			composed: !0,
			detail: {
				index: e,
				value: this.tabValue(r)
			}
		}));
	}
	handleClick = (e) => {
		if (!(e.target instanceof Element)) return;
		let t = e.target.closest(".sds-tab[role=\"tab\"]"), n = t ? this.tabs.indexOf(t) : -1;
		n < 0 || t instanceof HTMLAnchorElement || this.select(n);
	};
	handleKeydown = (e) => {
		if (!(document.activeElement instanceof HTMLElement)) return;
		let t = this.tabs.indexOf(document.activeElement);
		if (t < 0) return;
		let n = this.orientation === "vertical" || e.currentTarget instanceof HTMLElement && e.currentTarget.getAttribute("aria-orientation") === "vertical", r = n ? "ArrowDown" : "ArrowRight", i = n ? "ArrowUp" : "ArrowLeft", a = this.tabs.filter((e) => !this.isDisabled(e));
		if (a.length === 0) return;
		let o = a.indexOf(this.tabs[t]), s = null;
		if (e.key === r ? s = a[(o + 1) % a.length] : e.key === i ? s = a[(o - 1 + a.length) % a.length] : e.key === "Home" ? s = a[0] : e.key === "End" && (s = a[a.length - 1]), !s) return;
		e.preventDefault();
		let c = this.tabs.indexOf(s);
		this.activation === "manual" || s instanceof HTMLAnchorElement ? s.focus() : this.select(c, !0);
	};
};
function l() {
	i("sds-tabs", c);
}
//#endregion
export { c as SdsTabsElement, l as registerSdsTabs };
