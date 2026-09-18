import { c as e, i as t, n, r, t as i } from "./internals-BLPvKvsH.js";
//#region src/elements/tabs.ts
var a = "sds-change", o = typeof HTMLElement > "u" ? class {} : HTMLElement, s = class extends o {
	static observedAttributes = ["value"];
	tabs = [];
	panels = /* @__PURE__ */ new Map();
	connection = new i();
	reflectingValue = !1;
	get value() {
		return this.getAttribute("value") ?? "";
	}
	set value(t) {
		if (this.isConnected && !this.tabs.some((e) => this.tabValue(e) === t && !this.isDisabled(e))) throw RangeError(`<sds-tabs> has no enabled tab with value "${t}".`);
		e(this, "value", t);
	}
	get activation() {
		return this.getAttribute("activation") ?? "automatic";
	}
	set activation(t) {
		e(this, "activation", t);
	}
	get orientation() {
		return this.getAttribute("orientation") ?? "horizontal";
	}
	set orientation(t) {
		e(this, "orientation", t), this.syncOrientation();
	}
	get size() {
		return this.getAttribute("size") ?? "md";
	}
	set size(t) {
		e(this, "size", t);
	}
	get tone() {
		return this.getAttribute("tone") ?? "accent";
	}
	set tone(t) {
		e(this, "tone", t);
	}
	get variant() {
		return this.getAttribute("variant") ?? "folder";
	}
	set variant(t) {
		e(this, "variant", t);
	}
	connectedCallback() {
		let e = this.connection.connect(this, () => this.connectedCallback(), {
			childList: !0,
			subtree: !0
		}), n = r(this), i = n.find((e) => e.matches(".sds-tab-list, [role=\"tablist\"]")) ?? n[0] ?? null;
		if (this.tabs = i ? r(i).filter((e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement) : [], this.panels.clear(), !i || this.tabs.length === 0) {
			console.warn("<sds-tabs> requires a tab-list container with button or link children.");
			return;
		}
		let a = n.filter((e) => e !== i);
		if (a.length < this.tabs.length) {
			console.warn("<sds-tabs> requires one panel for every tab.");
			return;
		}
		i.classList.add("sds-tab-list"), i.setAttribute("role", "tablist"), this.syncOrientation(i), !i.hasAttribute("aria-label") && !i.hasAttribute("aria-labelledby") && console.warn("<sds-tabs> requires an accessible name on its tab list.");
		let o = new Set(a);
		for (let [e, n] of this.tabs.entries()) {
			let r = n.getAttribute("aria-controls"), i = a.find((e) => e.id === r) ?? null, s = i && o.has(i) ? i : a[e] && o.has(a[e]) ? a[e] : o.values().next().value;
			if (!s) continue;
			o.delete(s);
			let c = t(n, "sds-tab"), l = t(s, "sds-tab-panel");
			n.classList.add("sds-tab"), n.setAttribute("role", "tab"), n.setAttribute("aria-controls", l), s.classList.add("sds-tab-panel"), s.setAttribute("role", "tabpanel"), s.setAttribute("aria-labelledby", c), this.panels.set(n, s);
		}
		let s = this.value ? this.tabs.find((e) => this.tabValue(e) === this.value && !this.isDisabled(e)) : null;
		this.value && !s && console.warn(`<sds-tabs> has no enabled tab with value "${this.value}".`);
		let c = s ?? this.tabs.find((e) => e.getAttribute("aria-selected") === "true" && !this.isDisabled(e)) ?? this.tabs.find((e) => !this.isDisabled(e)) ?? null;
		for (let e of this.tabs) {
			let t = e === c;
			e.setAttribute("aria-selected", String(t)), e.tabIndex = t ? 0 : -1;
			let n = this.panels.get(e);
			n && (n.hidden = !t);
		}
		c && this.reflectValue(this.tabValue(c)), i.addEventListener("click", this.handleClick, { signal: e }), i.addEventListener("keydown", this.handleKeydown, { signal: e });
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
		this.hasAttribute("orientation") && (e ?? r(this).find((e) => e.matches(".sds-tab-list, [role=\"tablist\"]")))?.setAttribute("aria-orientation", this.orientation);
	}
	tabValue(e) {
		return e.getAttribute("value") ?? e.id;
	}
	reflectValue(t) {
		this.reflectingValue = !0, e(this, "value", t), this.reflectingValue = !1;
	}
	select(e, t = !1, n = !0) {
		let r = this.tabs[e], i = this.panels.get(r);
		if (!r || !i || this.isDisabled(r)) return;
		let o = this.tabs.findIndex((e) => e.getAttribute("aria-selected") === "true");
		this.tabs.forEach((e) => {
			let t = e === r;
			e.setAttribute("aria-selected", String(t)), e.tabIndex = t ? 0 : -1;
			let n = this.panels.get(e);
			n && (n.hidden = !t);
		}), this.reflectValue(this.tabValue(r)), t && r.focus(), n && o !== e && this.dispatchEvent(new CustomEvent(a, {
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
function c() {
	n("sds-tabs", s);
}
//#endregion
export { s as SdsTabsElement, c as registerSdsTabs };
