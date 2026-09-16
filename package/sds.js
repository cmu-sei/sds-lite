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
		if ((a === "show-modal" || a === "close" || a === "request-close") && e.preventDefault(), a === "show-modal") n(i, !0);
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
//#region src/elements/floating.ts
var s = [
	"top",
	"right",
	"bottom",
	"left"
], c = {
	top: "bottom",
	right: "left",
	bottom: "top",
	left: "right"
};
function l(e, t) {
	let [n, r] = e.split("-");
	return {
		side: s.includes(n) ? n : l(t, "bottom-start").side,
		alignment: r === "start" || r === "end" ? r : "center"
	};
}
function u(e, t) {
	return t === "center" ? e : `${e}-${t}`;
}
function d(e, t, n) {
	return Math.max(0, -e) + Math.max(0, e + t - n);
}
function f(e, t, n, r, i) {
	let a = {
		start: e.left,
		center: e.left + (e.width - t.width) / 2,
		end: e.right - t.width
	}, o = {
		start: e.top,
		center: e.top + (e.height - t.height) / 2,
		end: e.bottom - t.height
	};
	return n === "top" ? {
		top: e.top - t.height - i,
		left: a[r]
	} : n === "bottom" ? {
		top: e.bottom + i,
		left: a[r]
	} : n === "left" ? {
		top: o[r],
		left: e.left - t.width - i
	} : {
		top: o[r],
		left: e.right + i
	};
}
function p(e, t, n, r) {
	return r === "top" || r === "bottom" ? d(e.top, t.height, n.height) : d(e.left, t.width, n.width);
}
function m(e, t, n, r) {
	return r === "top" || r === "bottom" ? d(e.left, t.width, n.width) : d(e.top, t.height, n.height);
}
function h(e, t) {
	return e.reduce((e, n) => t(n) < t(e) ? n : e);
}
function g({ anchor: e, surface: t, viewport: n, preferredPlacement: r, previousPlacement: i, offset: a }) {
	let o = l(r, "bottom-start"), s = i ? l(i, "bottom-start") : null, d = s?.side ?? o.side, g = [d, c[d]], _ = (r) => p(f(e, t, r, o.alignment, a), t, n, r), v = s && _(d) === 0 ? d : h(g, _), y = s?.alignment ?? o.alignment, b = y === "center" ? [
		"center",
		"start",
		"end"
	] : [y, y === "start" ? "end" : "start"], x = (r) => m(f(e, t, v, r, a), t, n, v), S = s && x(y) === 0 ? y : h(b, x);
	return {
		...f(e, t, v, S, a),
		side: v,
		placement: u(v, S)
	};
}
function _(e, t) {
	if (e === void 0 || e.trim() === "") return t;
	let n = Number(e);
	return Number.isFinite(n) && n >= 0 ? n : t;
}
var v = class {
	previousPlacement = null;
	preferredPlacement = "";
	anchor;
	surface;
	getPlacement;
	getOffset;
	defaultOffset;
	constructor(e, t, n, r, i = 5) {
		this.anchor = e, this.surface = t, this.getPlacement = n, this.getOffset = r, this.defaultOffset = i;
	}
	observe(e) {
		window.addEventListener("resize", this.position, { signal: e }), window.addEventListener("scroll", this.position, {
			capture: !0,
			signal: e
		});
	}
	reset() {
		this.previousPlacement = null, this.preferredPlacement = "";
	}
	position = () => {
		let e = this.getPlacement();
		e !== this.preferredPlacement && (this.previousPlacement = null, this.preferredPlacement = e);
		let t = this.anchor.getBoundingClientRect(), n = g({
			anchor: t,
			surface: {
				width: this.surface.offsetWidth,
				height: this.surface.offsetHeight
			},
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight
			},
			preferredPlacement: e,
			previousPlacement: this.previousPlacement,
			offset: _(this.getOffset(), this.defaultOffset)
		});
		this.previousPlacement = n.placement, this.surface.style.left = `${n.left}px`, this.surface.style.top = `${n.top}px`, this.surface.setAttribute("data-side", n.side);
		let r = Math.min(Math.max(t.left + t.width / 2 - n.left, 12), Math.max(12, this.surface.offsetWidth - 12)), i = Math.min(Math.max(t.top + t.height / 2 - n.top, 12), Math.max(12, this.surface.offsetHeight - 12));
		this.surface.style.setProperty("--sds-floating-arrow-x", `${r}px`), this.surface.style.setProperty("--sds-floating-arrow-y", `${i}px`);
	};
}, y = 0;
function b(e, t) {
	if (e.id) return e.id;
	let n;
	do
		y += 1, n = `${t}-${y}`;
	while (document.getElementById(n));
	return e.id = n, n;
}
function x(e) {
	return Array.from(e.children).filter((e) => e instanceof HTMLElement);
}
//#endregion
//#region src/elements/dropdown.ts
var S = typeof HTMLElement > "u" ? class {} : HTMLElement, C = class extends S {
	trigger = null;
	menu = null;
	items = [];
	positioner = null;
	controller = null;
	connectedCallback() {
		this.controller?.abort(), this.controller = new AbortController();
		let e = x(this), t = e.find((e) => e instanceof HTMLButtonElement), n = t?.getAttribute("popovertarget"), r = e.filter((e) => e !== t), i = e.find((e) => e.id === n) ?? r.find((e) => e.matches("menu, [popover], .sds-dropdown-menu")) ?? (r.length === 1 ? r[0] : null) ?? null;
		if (!t || !i) {
			console.warn("<sds-dropdown> requires one direct child button and one direct child menu or popover.", this);
			return;
		}
		let a = b(i, "sds-dropdown"), o = this.dataset.mode !== "popover";
		i.classList.add("sds-dropdown-menu"), i.setAttribute("popover", i.getAttribute("popover") || "auto"), t.setAttribute("popovertarget", a), t.setAttribute("aria-controls", a), t.setAttribute("aria-expanded", String(i.matches(":popover-open"))), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", o ? "menu" : "dialog"), o && (i.setAttribute("role", "menu"), i.hasAttribute("aria-orientation") || i.setAttribute("aria-orientation", "vertical")), this.trigger = t, this.menu = i, this.positioner = new v(t, i, () => this.dataset.placement ?? "bottom-start", () => this.dataset.offset), this.items = o ? Array.from(i.querySelectorAll("button, a[href], [role=\"menuitem\"]")).filter((e) => !e.closest("[role=\"menuitem\"] [role=\"menuitem\"]")).map((e) => (e.setAttribute("role", "menuitem"), e.tabIndex = -1, e)).filter((e) => e.getAttribute("aria-disabled") !== "true" && (!(e instanceof HTMLButtonElement) || !e.disabled)) : [], t.addEventListener("keydown", this.handleTriggerKeydown, { signal: this.controller.signal }), i.addEventListener("beforetoggle", this.handleBeforeToggle, { signal: this.controller.signal }), i.addEventListener("toggle", this.handleToggle, { signal: this.controller.signal }), i.addEventListener("keydown", this.handleMenuKeydown, { signal: this.controller.signal }), i.addEventListener("click", this.handleMenuClick, { signal: this.controller.signal }), this.positioner.observe(this.controller.signal);
	}
	disconnectedCallback() {
		this.controller?.abort(), this.positioner = null;
	}
	isOpen() {
		return this.menu?.matches(":popover-open") ?? !1;
	}
	open(e = 0) {
		this.menu && !this.isOpen() && (this.positioner?.reset(), this.menu.showPopover(), this.positioner?.position(), this.items[e]?.focus());
	}
	close(e = !1) {
		this.menu && this.isOpen() && (this.menu.hidePopover(), e && this.trigger?.focus());
	}
	handleToggle = () => {
		this.isOpen() ? this.positioner?.position() : this.positioner?.reset();
	};
	handleBeforeToggle = (e) => {
		e.newState === "open" && this.positioner?.reset(), this.trigger?.setAttribute("aria-expanded", String(e.newState === "open"));
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
};
function w() {
	typeof customElements < "u" && !customElements.get("sds-dropdown") && customElements.define("sds-dropdown", C);
}
w();
//#endregion
//#region src/elements/popover.ts
var T = typeof HTMLElement > "u" ? class {} : HTMLElement, E = 500, D = 250, O = class extends T {
	trigger = null;
	content = null;
	positioner = null;
	controller = null;
	openTimer = null;
	closeTimer = null;
	pointerInside = !1;
	connectedCallback() {
		this.controller?.abort(), this.clearTimers(), this.controller = new AbortController();
		let e = x(this), t = e.find((e) => e instanceof HTMLButtonElement), n = t?.getAttribute("popovertarget"), r = e.filter((e) => e !== t), i = e.find((e) => e.id === n) ?? r.find((e) => e.matches("[popover], .sds-popover-content")) ?? (r.length === 1 ? r[0] : null) ?? null;
		if (!t || !i) {
			console.warn("<sds-popover> requires one direct child button and one direct child content element.", this);
			return;
		}
		let a = b(i, "sds-popover");
		i.classList.add("sds-popover-content"), i.setAttribute("popover", "manual"), t.removeAttribute("popovertarget"), t.setAttribute("aria-controls", a), t.setAttribute("aria-expanded", String(i.matches(":popover-open"))), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), this.trigger = t, this.content = i, this.positioner = new v(t, i, () => this.dataset.placement ?? "bottom-start", () => this.dataset.offset, 10), t.addEventListener("pointerenter", this.handlePointerEnter, { signal: this.controller.signal }), t.addEventListener("pointerleave", this.handlePointerLeave, { signal: this.controller.signal }), i.addEventListener("pointerenter", this.handlePointerEnter, { signal: this.controller.signal }), i.addEventListener("pointerleave", this.handlePointerLeave, { signal: this.controller.signal }), this.addEventListener("focusin", this.handleFocusIn, { signal: this.controller.signal }), this.addEventListener("focusout", this.handleFocusOut, { signal: this.controller.signal }), document.addEventListener("keydown", this.handleKeydown, { signal: this.controller.signal }), document.addEventListener("pointerdown", this.handleDocumentPointerDown, {
			capture: !0,
			signal: this.controller.signal
		}), i.addEventListener("beforetoggle", this.handleBeforeToggle, { signal: this.controller.signal }), i.addEventListener("toggle", this.handleToggle, { signal: this.controller.signal }), this.positioner.observe(this.controller.signal);
	}
	disconnectedCallback() {
		this.controller?.abort(), this.clearTimers(), this.positioner = null;
	}
	isOpen() {
		return this.content?.matches(":popover-open") ?? !1;
	}
	clearTimers() {
		this.openTimer !== null && clearTimeout(this.openTimer), this.closeTimer !== null && clearTimeout(this.closeTimer), this.openTimer = null, this.closeTimer = null;
	}
	show() {
		this.openTimer = null, this.content && !this.isOpen() && (this.positioner?.reset(), this.content.showPopover(), this.positioner?.position());
	}
	scheduleOpen(e) {
		this.closeTimer !== null && clearTimeout(this.closeTimer), this.closeTimer = null, !(this.isOpen() || this.openTimer !== null) && (this.openTimer = setTimeout(() => this.show(), e));
	}
	scheduleClose() {
		this.openTimer !== null && clearTimeout(this.openTimer), this.openTimer = null, this.isOpen() && this.closeTimer === null && (this.closeTimer = setTimeout(() => {
			this.closeTimer = null, !this.pointerInside && !this.contains(document.activeElement) && this.content?.hidePopover();
		}, D));
	}
	handlePointerEnter = () => {
		this.pointerInside = !0, this.scheduleOpen(E);
	};
	handlePointerLeave = () => {
		this.pointerInside = !1, this.scheduleClose();
	};
	handleFocusIn = () => {
		this.scheduleOpen(0);
	};
	handleFocusOut = () => {
		this.scheduleClose();
	};
	handleKeydown = (e) => {
		if (e.key !== "Escape" || !this.isOpen()) return;
		e.preventDefault(), this.clearTimers();
		let t = this.content?.contains(document.activeElement);
		this.content?.hidePopover(), t && this.trigger?.focus();
	};
	handleDocumentPointerDown = (e) => {
		this.isOpen() && e.target instanceof Node && !this.contains(e.target) && (this.clearTimers(), this.content?.hidePopover());
	};
	handleBeforeToggle = (e) => {
		e.newState === "open" && this.positioner?.reset(), this.trigger?.setAttribute("aria-expanded", String(e.newState === "open"));
	};
	handleToggle = () => {
		this.isOpen() ? this.positioner?.position() : this.positioner?.reset();
	};
};
function k() {
	typeof customElements < "u" && !customElements.get("sds-popover") && customElements.define("sds-popover", O);
}
k();
//#endregion
//#region src/elements/tabs.ts
var A = "sds-change", j = typeof HTMLElement > "u" ? class {} : HTMLElement, M = class extends j {
	tabs = [];
	panels = /* @__PURE__ */ new Map();
	controller = null;
	connectedCallback() {
		this.controller?.abort(), this.controller = new AbortController();
		let e = x(this), t = e.find((e) => e.matches(".sds-tab-list, [role=\"tablist\"]")) ?? e[0] ?? null;
		if (this.tabs = t ? x(t).filter((e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement) : [], this.panels.clear(), !t || this.tabs.length === 0) {
			console.warn("<sds-tabs> requires a tab-list container with button or link children.", this);
			return;
		}
		let n = e.filter((e) => e !== t);
		if (n.length < this.tabs.length) {
			console.warn("<sds-tabs> requires one panel for every tab.", this);
			return;
		}
		t.classList.add("sds-tab-list"), t.setAttribute("role", "tablist"), !t.hasAttribute("aria-label") && !t.hasAttribute("aria-labelledby") && t.setAttribute("aria-label", "Tabs");
		let r = new Set(n);
		for (let [e, t] of this.tabs.entries()) {
			let i = t.getAttribute("aria-controls"), a = n.find((e) => e.id === i) ?? null, o = a && r.has(a) ? a : n[e] && r.has(n[e]) ? n[e] : r.values().next().value;
			if (!o) continue;
			r.delete(o);
			let s = b(t, "sds-tab"), c = b(o, "sds-tab-panel");
			t.classList.add("sds-tab"), t.setAttribute("role", "tab"), t.setAttribute("aria-controls", c), o.classList.add("sds-tab-panel"), o.setAttribute("role", "tabpanel"), o.setAttribute("aria-labelledby", s), this.panels.set(t, o);
		}
		let i = this.tabs.find((e) => e.getAttribute("aria-selected") === "true" && !this.isDisabled(e)) ?? this.tabs.find((e) => !this.isDisabled(e)) ?? null;
		for (let e of this.tabs) {
			let t = e === i;
			e.setAttribute("aria-selected", String(t)), e.tabIndex = t ? 0 : -1;
			let n = this.panels.get(e);
			n && (n.hidden = !t);
		}
		t.addEventListener("click", this.handleClick, { signal: this.controller.signal }), t.addEventListener("keydown", this.handleKeydown, { signal: this.controller.signal });
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
		}), t && r.focus(), n && this.dispatchEvent(new CustomEvent(A, {
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
function N() {
	typeof customElements < "u" && !customElements.get("sds-tabs") && customElements.define("sds-tabs", M);
}
N();
//#endregion
//#region src/elements/tooltip.ts
var P = typeof HTMLElement > "u" ? class {} : HTMLElement, F = 0, I = 0, L = class extends P {
	trigger = null;
	content = null;
	positioner = null;
	controller = null;
	openTimer = null;
	closeTimer = null;
	pointerInside = !1;
	connectedCallback() {
		this.controller?.abort(), this.clearTimers(), this.controller = new AbortController();
		let e = x(this), t = e.find((e) => e.matches("[role=\"tooltip\"], .sds-tooltip-content, [popover]")) ?? (e.length === 2 ? e[1] : null) ?? null, n = e.find((e) => e !== t) ?? null;
		if (!n || !t) {
			console.warn("<sds-tooltip> requires one direct child trigger and one direct child text element.", this);
			return;
		}
		let r = b(t, "sds-tooltip"), i = new Set((n.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
		i.add(r), t.classList.add("sds-tooltip-content"), t.setAttribute("role", "tooltip"), t.setAttribute("popover", "manual"), n.setAttribute("aria-describedby", [...i].join(" ")), this.trigger = n, this.content = t, this.positioner = new v(n, t, () => this.dataset.placement ?? "top", () => this.dataset.offset, 10), n.addEventListener("pointerenter", this.handlePointerEnter, { signal: this.controller.signal }), n.addEventListener("pointerleave", this.handlePointerLeave, { signal: this.controller.signal }), n.addEventListener("focusin", this.handleFocusIn, { signal: this.controller.signal }), n.addEventListener("focusout", this.handleFocusOut, { signal: this.controller.signal }), document.addEventListener("keydown", this.handleKeydown, { signal: this.controller.signal }), t.addEventListener("pointerenter", this.handlePointerEnter, { signal: this.controller.signal }), t.addEventListener("pointerleave", this.handlePointerLeave, { signal: this.controller.signal }), t.addEventListener("toggle", this.handleToggle, { signal: this.controller.signal }), this.positioner.observe(this.controller.signal);
	}
	disconnectedCallback() {
		this.controller?.abort(), this.clearTimers(), this.positioner = null;
	}
	isOpen() {
		return this.content?.matches(":popover-open") ?? !1;
	}
	clearTimers() {
		this.openTimer !== null && clearTimeout(this.openTimer), this.closeTimer !== null && clearTimeout(this.closeTimer), this.openTimer = null, this.closeTimer = null;
	}
	show() {
		this.openTimer = null, this.content && !this.isOpen() && (this.positioner?.reset(), this.content.showPopover(), this.positioner?.position());
	}
	scheduleOpen(e) {
		this.closeTimer !== null && clearTimeout(this.closeTimer), this.closeTimer = null, !(this.isOpen() || this.openTimer !== null) && (this.openTimer = setTimeout(() => this.show(), e));
	}
	scheduleClose() {
		this.openTimer !== null && clearTimeout(this.openTimer), this.openTimer = null, this.isOpen() && this.closeTimer === null && (this.closeTimer = setTimeout(() => {
			this.closeTimer = null, !this.pointerInside && !this.trigger?.contains(document.activeElement) && this.content?.hidePopover();
		}, I));
	}
	handlePointerEnter = () => {
		this.pointerInside = !0, this.scheduleOpen(F);
	};
	handlePointerLeave = () => {
		this.pointerInside = !1, this.scheduleClose();
	};
	handleFocusIn = () => {
		this.scheduleOpen(0);
	};
	handleFocusOut = () => {
		this.scheduleClose();
	};
	handleKeydown = (e) => {
		e.key === "Escape" && this.isOpen() && (e.preventDefault(), this.clearTimers(), this.content?.hidePopover());
	};
	handleToggle = () => {
		this.isOpen() ? this.positioner?.position() : this.positioner?.reset();
	};
};
function R() {
	typeof customElements < "u" && !customElements.get("sds-tooltip") && customElements.define("sds-tooltip", L);
}
R();
//#endregion
//#region src/elements/toast.ts
var z = 5e3, B = 250, V = typeof HTMLElement > "u" ? class {} : HTMLElement, H = class extends V {
	static observedAttributes = ["open"];
	hideTimer = null;
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		this.toggleAttribute("open", e);
	}
	connectedCallback() {
		this.hasAttribute("role") || this.setAttribute("role", "status"), this.hasAttribute("aria-atomic") || this.setAttribute("aria-atomic", "true"), this.addEventListener("click", this.handleClick), this.addEventListener("focusin", this.pauseAutoHide), this.addEventListener("focusout", this.handleFocusOut), this.addEventListener("pointerenter", this.pauseAutoHide), this.addEventListener("pointerleave", this.resumeAutoHide), this.open && this.scheduleAutoHide();
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
		let e = Number(this.dataset.duration), t = Number.isFinite(e) && e > 0 ? e : z;
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
}, U = !1;
function W() {
	U || typeof document > "u" || (U = !0, document.addEventListener("click", (e) => {
		if (!(e.target instanceof Element)) return;
		let t = e.target.closest("[data-toast-open]")?.dataset.toastOpen, n = t ? document.getElementById(t) : null;
		n instanceof H && n.show();
	}));
}
function G() {
	typeof customElements < "u" && !customElements.get("sds-toast") && customElements.define("sds-toast", H), W();
}
G();
function K(e, t = {}) {
	if (typeof document > "u") throw Error("notify() can only be called in a browser.");
	let n = document.querySelector("sds-toaster");
	if (!n) {
		n = document.createElement("sds-toaster"), n.setAttribute("aria-label", "Notifications");
		let e = document.querySelector("[data-sds-root]");
		e || (n.dataset.sdsRoot = ""), (e ?? document.body).append(n);
	}
	let r = document.createElement("sds-toast");
	r.dataset.tone = t.tone ?? "info", r.setAttribute("role", t.urgent ? "alert" : "status"), r.setAttribute("aria-atomic", "true"), t.duration !== void 0 && (r.dataset.duration = String(t.duration)), t.persistent && (r.dataset.persistent = "");
	let i = document.createElement("strong");
	i.textContent = t.title ?? "Notification";
	let a = document.createElement("span");
	a.textContent = e;
	let o = document.createElement("button");
	return o.type = "button", o.dataset.shape = "icon", o.dataset.toastClose = "", o.setAttribute("aria-label", "Dismiss notification"), o.textContent = "×", r.append(i, a, o), r.addEventListener("sds-close", () => window.setTimeout(() => r.remove(), B), { once: !0 }), n.append(r), r.show(), r;
}
//#endregion
export { K as notify, o as registerSdsDialog, w as registerSdsDropdown, k as registerSdsPopover, N as registerSdsTabs, G as registerSdsToast, R as registerSdsTooltip };
