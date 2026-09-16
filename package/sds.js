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
	e.open || (t ? e.showModal() : e.show(), e.dispatchEvent(new CustomEvent("sds-open", {
		bubbles: !0,
		composed: !0
	})));
}
function r(e) {
	if (!(e.target instanceof Element)) return;
	let r = e.target.closest("[commandfor]");
	if (r) {
		let i = t(r);
		if (!i) return;
		let a = r.getAttribute("command");
		if ((a === "show-modal" || a === "close" || a === "request-close") && e.preventDefault(), a === "show-modal" && n(i, !0), a === "show-modal") n(i, !0);
		else if (a === "close") i.close(r.dataset.returnValue);
		else if (a === "request-close") {
			let e = Reflect.get(i, "requestClose");
			if (typeof e == "function") e.call(i, r.dataset.returnValue);
			else {
				let e = new Event("cancel", { cancelable: !0 });
				i.dispatchEvent(e) && i.close(r.dataset.returnValue);
			}
		}
		return;
	}
	let i = e.target.closest("dialog.sds-dialog[open], dialog.sds-panel[open]");
	if (!i || e.target !== i) return;
	let a = i.getBoundingClientRect();
	(e.clientX < a.left || e.clientX > a.right || e.clientY < a.top || e.clientY > a.bottom) && i.getAttribute("closedby") === "any" && i.close();
}
function i(e) {
	let t = e.target;
	t instanceof HTMLDialogElement && t.matches(".sds-dialog, .sds-panel") && t.dispatchEvent(new CustomEvent("sds-close", {
		bubbles: !0,
		composed: !0,
		detail: { returnValue: t.returnValue }
	}));
}
function a(e) {
	let t = e.target;
	if (!(t instanceof HTMLDialogElement) || !t.matches(".sds-dialog, .sds-panel")) return;
	let n = new CustomEvent("sds-cancel", {
		bubbles: !0,
		cancelable: !0,
		composed: !0
	});
	t.dispatchEvent(n) || e.preventDefault();
}
function o() {
	e || typeof document > "u" || (e = !0, document.addEventListener("click", r), document.addEventListener("close", i, !0), document.addEventListener("cancel", a, !0));
}
o();
//#endregion
//#region src/elements/dropdown.ts
var s = typeof HTMLElement > "u" ? class {} : HTMLElement, c = class extends s {
	trigger = null;
	menu = null;
	items = [];
	controller = null;
	connectedCallback() {
		this.controller?.abort(), this.controller = new AbortController();
		let e = Array.from(this.children).find((e) => e instanceof HTMLButtonElement && e.hasAttribute("popovertarget")), t = e?.getAttribute("popovertarget"), n = t ? Array.from(this.children).find((e) => e instanceof HTMLElement && e.id === t) : null;
		if (!e || !n || !n.hasAttribute("popover") || e.getAttribute("aria-controls") !== n.id) {
			console.warn("<sds-dropdown> requires an authored popovertarget, matching menu id, popover, and aria-controls.", this);
			return;
		}
		this.trigger = e, this.menu = n, this.items = this.dataset.mode === "popover" ? [] : Array.from(n.querySelectorAll("[role=\"menuitem\"]:not([aria-disabled=\"true\"])")).filter((e) => !(e instanceof HTMLButtonElement) || !e.disabled), e.addEventListener("keydown", this.handleTriggerKeydown, { signal: this.controller.signal }), n.addEventListener("beforetoggle", this.handleBeforeToggle, { signal: this.controller.signal }), n.addEventListener("toggle", this.handleToggle, { signal: this.controller.signal }), n.addEventListener("keydown", this.handleMenuKeydown, { signal: this.controller.signal }), n.addEventListener("click", this.handleMenuClick, { signal: this.controller.signal }), window.addEventListener("resize", this.positionMenu, { signal: this.controller.signal }), window.addEventListener("scroll", this.positionMenu, {
			capture: !0,
			signal: this.controller.signal
		});
	}
	disconnectedCallback() {
		this.controller?.abort();
	}
	isOpen() {
		return this.menu?.matches(":popover-open") ?? !1;
	}
	open(e = 0) {
		this.menu && !this.isOpen() && (this.menu.showPopover(), this.positionMenu(), this.items[e]?.focus());
	}
	close(e = !1) {
		this.menu && this.isOpen() && (this.menu.hidePopover(), e && this.trigger?.focus());
	}
	handleToggle = () => {
		this.isOpen() && this.positionMenu();
	};
	handleBeforeToggle = (e) => {
		this.trigger?.setAttribute("aria-expanded", String(e.newState === "open"));
	};
	handleTriggerKeydown = (e) => {
		if (this.dataset.mode === "popover") return;
		let t = e.key === "ArrowUp" ? this.items.length - 1 : 0;
		(e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") && (e.preventDefault(), this.isOpen() ? this.items[t]?.focus() : this.open(t));
	};
	handleMenuKeydown = (e) => {
		let t = this.items.findIndex((e) => e === document.activeElement), n = null;
		if (e.key === "ArrowDown") n = (t + 1) % this.items.length;
		else if (e.key === "ArrowUp") n = (t - 1 + this.items.length) % this.items.length;
		else if (e.key === "Home") n = 0;
		else if (e.key === "End") n = this.items.length - 1;
		else if (e.key === "Escape") {
			e.preventDefault(), this.close(!0);
			return;
		}
		n !== null && this.items.length !== 0 && (e.preventDefault(), this.items[n].focus());
	};
	handleMenuClick = (e) => {
		e.target instanceof Element && e.target.closest("[role=\"menuitem\"]") && this.close();
	};
	positionMenu = () => {
		if (!this.trigger || !this.menu || !this.isOpen()) return;
		let e = this.trigger.getBoundingClientRect(), t = this.menu.offsetWidth, n = this.menu.offsetHeight, r = this.dataset.offset, i = r === void 0 || r.trim() === "" ? NaN : Number(r), a = Number.isFinite(i) && i >= 0 ? i : 5, o = this.dataset.placement ?? "bottom-start", s = o.endsWith("-end"), c = o.startsWith("top"), l = s ? e.right - t : e.left, u = c ? e.top - n - a : e.bottom + a, d = Math.min(l, window.innerWidth - t - 8), f = Math.min(u, window.innerHeight - n - 8);
		this.menu.style.top = `${Math.max(8, f)}px`, this.menu.style.left = `${Math.max(8, d)}px`;
	};
};
function l() {
	typeof customElements < "u" && !customElements.get("sds-dropdown") && customElements.define("sds-dropdown", c);
}
l();
//#endregion
//#region src/elements/tabs.ts
var u = "sds-change", d = typeof HTMLElement > "u" ? class {} : HTMLElement, f = class extends d {
	tabs = [];
	panels = /* @__PURE__ */ new Map();
	controller = null;
	connectedCallback() {
		this.controller?.abort(), this.controller = new AbortController();
		let e = this.querySelector(".sds-tab-list[role=\"tablist\"]");
		this.tabs = Array.from(this.querySelectorAll(".sds-tab[role=\"tab\"]")), this.panels.clear();
		for (let e of this.tabs) {
			let t = e.getAttribute("aria-controls"), n = t ? this.querySelector(`#${CSS.escape(t)}`) : null;
			if (!e.id || !n || n.getAttribute("role") !== "tabpanel" || n.getAttribute("aria-labelledby") !== e.id) {
				console.warn("<sds-tabs> requires authored tab ids, aria-controls, tabpanel ids, and aria-labelledby.", this);
				return;
			}
			this.panels.set(e, n);
		}
		if (!e || this.tabs.length === 0) {
			console.warn("<sds-tabs> requires a .sds-tab-list[role=\"tablist\"] and tabs with role=\"tab\".", this);
			return;
		}
		e.addEventListener("click", this.handleClick, { signal: this.controller.signal }), e.addEventListener("keydown", this.handleKeydown, { signal: this.controller.signal });
	}
	disconnectedCallback() {
		this.controller?.abort();
	}
	isDisabled(e) {
		return e instanceof HTMLButtonElement && e.disabled || e.getAttribute("aria-disabled") === "true";
	}
	select(e, t = !1, n = !0) {
		let r = this.tabs[e], i = this.panels.get(r);
		r && i && !this.isDisabled(r) && (this.tabs.forEach((e) => {
			let t = e === r;
			e.setAttribute("aria-selected", String(t)), e.tabIndex = t ? 0 : -1;
			let n = this.panels.get(e);
			n && (n.hidden = !t);
		}), t && r.focus(), n && this.dispatchEvent(new CustomEvent(u, {
			bubbles: !0,
			composed: !0,
			detail: {
				index: e,
				value: r.dataset.value ?? r.id
			}
		})));
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
		let n = this.dataset.orientation === "vertical" || e.currentTarget instanceof HTMLElement && e.currentTarget.getAttribute("aria-orientation") === "vertical", r = n ? "ArrowDown" : "ArrowRight", i = n ? "ArrowUp" : "ArrowLeft", a = this.tabs.filter((e) => !this.isDisabled(e));
		if (a.length === 0) return;
		let o = a.indexOf(this.tabs[t]), s = null;
		if (e.key === r ? s = a[(o + 1) % a.length] : e.key === i ? s = a[(o - 1 + a.length) % a.length] : e.key === "Home" ? s = a[0] : e.key === "End" && (s = a[a.length - 1]), !s) return;
		e.preventDefault();
		let c = this.tabs.indexOf(s);
		this.dataset.activation === "manual" || s instanceof HTMLAnchorElement ? s.focus() : this.select(c, !0);
	};
};
function p() {
	typeof customElements < "u" && !customElements.get("sds-tabs") && customElements.define("sds-tabs", f);
}
p();
//#endregion
//#region src/elements/toast.ts
var m = 5e3, h = typeof HTMLElement > "u" ? class {} : HTMLElement, g = class extends h {
	static observedAttributes = ["open"];
	hideTimer = null;
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		this.toggleAttribute("open", e);
	}
	connectedCallback() {
		(!this.hasAttribute("role") || this.getAttribute("aria-atomic") !== "true") && console.warn("<sds-toast> requires an authored role and aria-atomic=\"true\" for SSR accessibility.", this), this.addEventListener("click", this.handleClick), this.addEventListener("focusin", this.pauseAutoHide), this.addEventListener("focusout", this.handleFocusOut), this.addEventListener("pointerenter", this.pauseAutoHide), this.addEventListener("pointerleave", this.resumeAutoHide), this.open && this.scheduleAutoHide();
	}
	disconnectedCallback() {
		this.clearAutoHide(), this.removeEventListener("click", this.handleClick), this.removeEventListener("focusin", this.pauseAutoHide), this.removeEventListener("focusout", this.handleFocusOut), this.removeEventListener("pointerenter", this.pauseAutoHide), this.removeEventListener("pointerleave", this.resumeAutoHide);
	}
	attributeChangedCallback(e, t, n) {
		e === "open" && t !== n && this.isConnected && (n === null ? this.clearAutoHide() : this.scheduleAutoHide());
	}
	show() {
		if (this.open) {
			this.scheduleAutoHide();
			return;
		}
		this.open = !0, this.dispatchEvent(new CustomEvent("sds-open", {
			bubbles: !0,
			composed: !0
		}));
	}
	close(e = "programmatic") {
		this.open && (this.open = !1, this.dispatchEvent(new CustomEvent("sds-close", {
			bubbles: !0,
			composed: !0,
			detail: { reason: e }
		})));
	}
	scheduleAutoHide() {
		if (this.clearAutoHide(), !this.open || this.hasAttribute("data-persistent")) return;
		let e = Number(this.dataset.duration), t = Number.isFinite(e) && e > 0 ? e : m;
		this.hideTimer = window.setTimeout(() => this.close("timeout"), t);
	}
	clearAutoHide() {
		this.hideTimer !== null && (window.clearTimeout(this.hideTimer), this.hideTimer = null);
	}
	handleClick = (e) => {
		e.target instanceof Element && e.target.closest("[data-toast-close]") && this.close("dismiss");
	};
	pauseAutoHide = () => {
		this.clearAutoHide();
	};
	resumeAutoHide = () => {
		!this.matches(":hover") && !this.contains(document.activeElement) && this.scheduleAutoHide();
	};
	handleFocusOut = (e) => {
		(!(e.relatedTarget instanceof Node) || !this.contains(e.relatedTarget)) && this.resumeAutoHide();
	};
}, _ = !1;
function v() {
	_ || typeof document > "u" || (_ = !0, document.addEventListener("click", (e) => {
		if (!(e.target instanceof Element)) return;
		let t = e.target.closest("[data-toast-open]")?.dataset.toastOpen, n = t ? document.getElementById(t) : null;
		n instanceof g && n.show();
	}));
}
function y() {
	typeof customElements < "u" && !customElements.get("sds-toast") && customElements.define("sds-toast", g), v();
}
y();
//#endregion
export { o as registerSdsDialog, l as registerSdsDropdown, p as registerSdsTabs, y as registerSdsToast };
