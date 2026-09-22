//#region src/elements/dialog.ts
var e = !1, t = 6, n = 180, r = null, i = /* @__PURE__ */ new WeakMap();
function a(e) {
	let t = e.getAttribute("commandfor");
	if (t) {
		let e = document.getElementById(t);
		return e instanceof HTMLDialogElement && e.matches(".sds-dialog, .sds-panel") ? e : null;
	}
	return e.closest("dialog.sds-dialog, dialog.sds-panel");
}
function o(e, t) {
	e.open || (t ? e.showModal() : e.show());
}
function s(e) {
	let t = e.dataset.sdsSide;
	return t === "bottom" || t === "left" ? t : "right";
}
function c(e, t) {
	return t === "bottom" ? e.clientY : t === "left" ? -e.clientX : e.clientX;
}
function l(e, t) {
	return t === "bottom" ? e.clientX : e.clientY;
}
function u(e, t) {
	let n = e.getBoundingClientRect();
	return t === "bottom" ? n.height : n.width;
}
function d(e, t) {
	return e === "bottom" ? `translate3d(0, ${t}px, 0)` : `translate3d(${e === "left" ? -t : t}px, 0, 0)`;
}
function f(e) {
	let t = i.get(e);
	if (!t) return;
	let n = Array.from(e.children).find((e) => e.classList.contains("_sds-panel-handle"));
	n instanceof HTMLElement && (n.style.cursor = t.handleCursor), e.style.transform = t.transform, e.style.transitionDuration = t.transitionDuration, e.style.transitionTimingFunction = t.transitionTimingFunction, e.style.setProperty("--sds-panel-backdrop-opacity", t.backdropOpacity), i.delete(e);
}
function p(e) {
	e.frame = null;
	let t = u(e.panel, e.side), n = Math.min(e.distance, t), r = t > 0 ? n / t : 0;
	e.panel.style.transform = d(e.side, n), e.panel.style.setProperty("--sds-panel-backdrop-opacity", String(1 - r));
}
function m(e, t) {
	let { panel: n } = e, r = n.ownerDocument.defaultView;
	if (!r) {
		f(n);
		return;
	}
	n.style.transitionDuration = "var(--sds-duration-normal)", n.style.transitionTimingFunction = t === "close" ? "var(--sds-easing-exit)" : "var(--sds-easing-enter)";
	let i = () => {
		r.clearTimeout(o), n.removeEventListener("transitionend", a), t === "close" && n.open && n.close(), f(n);
	}, a = (e) => {
		e.target === n && e.propertyName === "transform" && i();
	}, o = r.setTimeout(i, 250);
	if (n.addEventListener("transitionend", a), t === "close") {
		let t = u(n, e.side);
		n.style.transform = d(e.side, t), n.style.setProperty("--sds-panel-backdrop-opacity", "0");
	} else n.style.transform = d(e.side, 0), n.style.setProperty("--sds-panel-backdrop-opacity", "1");
}
function h(e) {
	e.handle.hasPointerCapture(e.pointerId) && e.handle.releasePointerCapture(e.pointerId);
}
function ee(e) {
	if (!e.isPrimary || e.button !== 0 || !(e.target instanceof Element)) return;
	let t = e.target.closest("._sds-panel-handle"), n = t?.closest("dialog.sds-panel[open]");
	if (!t || !n || t.parentElement !== n || i.has(n)) return;
	let a = s(n);
	i.set(n, {
		backdropOpacity: n.style.getPropertyValue("--sds-panel-backdrop-opacity"),
		handleCursor: t.style.cursor,
		transform: n.style.transform,
		transitionDuration: n.style.transitionDuration,
		transitionTimingFunction: n.style.transitionTimingFunction
	}), r = {
		distance: 0,
		dragging: !1,
		frame: null,
		handle: t,
		lastDistance: 0,
		lastTime: e.timeStamp,
		panel: n,
		pointerId: e.pointerId,
		side: a,
		startCrossCoordinate: l(e, a),
		startCoordinate: c(e, a),
		velocity: 0
	}, t.setPointerCapture(e.pointerId);
}
function te(e) {
	let n = r;
	if (!n || e.pointerId !== n.pointerId) return;
	let i = Math.max(0, c(e, n.side) - n.startCoordinate), a = Math.abs(l(e, n.side) - n.startCrossCoordinate);
	if (!n.dragging) {
		if (i < t || i < a * 1.15) return;
		n.dragging = !0, n.panel.style.transitionDuration = "0s", n.handle.style.cursor = "grabbing";
	}
	e.preventDefault();
	let o = e.timeStamp - n.lastTime;
	if (o > 0) {
		let e = (i - n.lastDistance) / o;
		n.velocity = n.velocity * .7 + e * .3;
	}
	n.distance = i, n.lastDistance = i, n.lastTime = e.timeStamp, n.frame === null && (n.frame = n.panel.ownerDocument.defaultView?.requestAnimationFrame(() => p(n)) ?? null);
}
function g(e, t) {
	let i = r;
	if (!i || e.pointerId !== i.pointerId) return;
	if (r = null, h(i), !i.dragging) {
		f(i.panel);
		return;
	}
	let a = i.panel.ownerDocument.defaultView;
	i.frame !== null && a && (a.cancelAnimationFrame(i.frame), p(i));
	let o = u(i.panel, i.side), s = e.timeStamp - i.lastTime > 80 ? 0 : Math.max(0, i.velocity), c = i.distance + s * n;
	if (!(!t && i.distance > 0 && c >= o * .45)) {
		m(i, "open");
		return;
	}
	let l = i.panel.ownerDocument.defaultView?.Event;
	m(i, l && i.panel.dispatchEvent(new l("cancel", { cancelable: !0 })) ? "close" : "open");
}
function _(e) {
	if (Array.from(e.children).find((e) => e.classList.contains("_sds-panel-handle"))) return;
	let t = e.ownerDocument.createElement("div");
	t.className = "_sds-panel-handle", t.setAttribute("aria-hidden", "true"), e.prepend(t);
}
function v(e) {
	e instanceof HTMLDialogElement && e.matches(".sds-panel") && _(e);
	for (let t of e.querySelectorAll("dialog.sds-panel")) _(t);
}
function y(e) {
	if (!(e.target instanceof Element)) return;
	let t = e.target.closest("[commandfor], dialog.sds-dialog [command], dialog.sds-panel [command]");
	if (t) {
		let n = a(t);
		if (!n) return;
		let r = t.getAttribute("command");
		if ((r === "show-modal" || r === "close" || r === "request-close") && e.preventDefault(), r === "show-modal") o(n, !0);
		else if (r === "close") n.close(t.getAttribute("data-sds-return-value") ?? "");
		else if (r === "request-close") {
			let e = Reflect.get(n, "requestClose");
			if (typeof e == "function") e.call(n, t.getAttribute("data-sds-return-value") ?? "");
			else {
				let e = new Event("cancel", { cancelable: !0 });
				n.dispatchEvent(e) && n.close(t.getAttribute("data-sds-return-value") ?? "");
			}
		}
		return;
	}
	let n = e.target.closest("dialog.sds-dialog[open], dialog.sds-panel[open]");
	if (!n || e.target !== n) return;
	let r = n.getBoundingClientRect();
	(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) && n.getAttribute("closedby") === "any" && n.close();
}
function ne() {
	if (e || typeof document > "u") return;
	e = !0, document.addEventListener("click", y), document.addEventListener("pointerdown", ee), document.addEventListener("pointermove", te), document.addEventListener("pointerup", (e) => g(e, !1)), document.addEventListener("pointercancel", (e) => g(e, !0)), document.addEventListener("lostpointercapture", (e) => g(e, !0)), document.addEventListener("close", (e) => {
		if (e.target instanceof HTMLDialogElement && e.target.matches(".sds-panel")) {
			if (r?.panel === e.target) {
				h(r);
				let t = e.target.ownerDocument.defaultView;
				r.frame !== null && t && t.cancelAnimationFrame(r.frame), r = null;
			}
			f(e.target);
		}
	}, !0), v(document);
	let t = document.defaultView?.MutationObserver;
	t && new t((e) => {
		for (let t of e) {
			t.type === "attributes" && t.target instanceof HTMLDialogElement && t.target.matches(".sds-panel") && _(t.target);
			for (let e of t.addedNodes) e instanceof Element && v(e);
		}
	}).observe(document.documentElement, {
		attributeFilter: ["class"],
		attributes: !0,
		childList: !0,
		subtree: !0
	});
}
//#endregion
//#region src/elements/floating.ts
var b = [
	"top",
	"right",
	"bottom",
	"left"
], x = {
	top: "bottom",
	right: "left",
	bottom: "top",
	left: "right"
};
function re(e, t, n) {
	let r = [
		"block-start",
		"block-end",
		"inline-start",
		"inline-end"
	].find((t) => e === t || e.startsWith(`${t}-`)), i = r ? e.slice(r.length + 1) : "", a = i === "start" || i === "end" ? i : "center", o = n.startsWith("vertical"), s = n === "vertical-rl", c = t === "rtl", l, u = a;
	return r ? (o ? (l = r === "block-start" ? s ? "right" : "left" : r === "block-end" ? s ? "left" : "right" : r === "inline-start" ? c ? "bottom" : "top" : c ? "top" : "bottom", a !== "center" && (l === "top" || l === "bottom" ? s : c) && (u = a === "start" ? "end" : "start")) : (l = r === "block-start" ? "top" : r === "block-end" ? "bottom" : r === "inline-start" ? t === "rtl" ? "right" : "left" : t === "rtl" ? "left" : "right", (l === "top" || l === "bottom") && t === "rtl" && a !== "center" && (u = a === "start" ? "end" : "start")), C(l, u)) : "bottom-start";
}
function S(e, t) {
	let [n, r] = e.split("-");
	return {
		side: b.includes(n) ? n : S(t, "bottom-start").side,
		alignment: r === "start" || r === "end" ? r : "center"
	};
}
function C(e, t) {
	return t === "center" ? e : `${e}-${t}`;
}
function w(e, t, n) {
	return Math.max(0, -e) + Math.max(0, e + t - n);
}
function T(e, t, n, r, i) {
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
function E(e, t, n, r) {
	return r === "top" || r === "bottom" ? w(e.top, t.height, n.height) : w(e.left, t.width, n.width);
}
function D(e, t, n, r) {
	return r === "top" || r === "bottom" ? w(e.left, t.width, n.width) : w(e.top, t.height, n.height);
}
function O(e, t) {
	return e.reduce((e, n) => t(n) < t(e) ? n : e);
}
function ie({ anchor: e, surface: t, viewport: n, preferredPlacement: r, previousPlacement: i, offset: a }) {
	let o = S(r, "bottom-start"), s = i ? S(i, "bottom-start") : null, c = s?.side ?? o.side, l = [c, x[c]], u = (r) => E(T(e, t, r, o.alignment, a), t, n, r), d = s && u(c) === 0 ? c : O(l, u), f = s?.alignment ?? o.alignment, p = f === "center" ? [
		"center",
		"start",
		"end"
	] : [f, f === "start" ? "end" : "start"], m = (r) => D(T(e, t, d, r, a), t, n, d), h = s && m(f) === 0 ? f : O(p, m);
	return {
		...T(e, t, d, h, a),
		side: d,
		placement: C(d, h)
	};
}
function k(e, t) {
	if (e === void 0 || e.trim() === "") return t;
	let n = Number(e);
	return Number.isFinite(n) && n >= 0 ? n : t;
}
var A = class {
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
		let e = getComputedStyle(this.anchor), t = re(this.getPlacement(), e.direction, e.writingMode);
		t !== this.preferredPlacement && (this.previousPlacement = null, this.preferredPlacement = t);
		let n = this.anchor.getBoundingClientRect(), r = ie({
			anchor: n,
			surface: {
				width: this.surface.offsetWidth,
				height: this.surface.offsetHeight
			},
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight
			},
			preferredPlacement: t,
			previousPlacement: this.previousPlacement,
			offset: k(this.getOffset(), this.defaultOffset)
		});
		this.previousPlacement = r.placement, this.surface.style.left = `${r.left}px`, this.surface.style.top = `${r.top}px`, this.surface.setAttribute("data-sds-side", r.side);
		let i = Math.min(Math.max(n.left + n.width / 2 - r.left, 12), Math.max(12, this.surface.offsetWidth - 12)), a = Math.min(Math.max(n.top + n.height / 2 - r.top, 12), Math.max(12, this.surface.offsetHeight - 12));
		this.surface.style.setProperty("--sds-floating-arrow-x", `${i}px`), this.surface.style.setProperty("--sds-floating-arrow-y", `${a}px`);
	};
}, j = class {
	anchor;
	surface;
	positioner;
	closeDelay;
	focusOpenDelay;
	hoverOpenDelay;
	openTimer = null;
	closeTimer = null;
	pointerInside = !1;
	constructor(e, t, n, r = {}) {
		this.anchor = e, this.surface = t, this.positioner = n, this.closeDelay = r.closeDelay ?? 120, this.focusOpenDelay = r.focusOpenDelay ?? 0, this.hoverOpenDelay = r.hoverOpenDelay ?? 0;
	}
	observe(e) {
		this.anchor.addEventListener("pointerenter", this.handlePointerEnter, { signal: e }), this.anchor.addEventListener("pointerleave", this.handlePointerLeave, { signal: e }), this.anchor.addEventListener("focusin", this.handleFocusIn, { signal: e }), this.anchor.addEventListener("focusout", this.handleFocusOut, { signal: e }), this.surface.addEventListener("pointerenter", this.handlePointerEnter, { signal: e }), this.surface.addEventListener("pointerleave", this.handlePointerLeave, { signal: e }), this.surface.addEventListener("focusin", this.handleFocusIn, { signal: e }), this.surface.addEventListener("focusout", this.handleFocusOut, { signal: e }), this.surface.addEventListener("beforetoggle", this.handleBeforeToggle, { signal: e }), this.surface.addEventListener("toggle", this.handleToggle, { signal: e }), document.addEventListener("keydown", this.handleKeydown, { signal: e });
	}
	disconnect() {
		this.clearTimers();
	}
	isOpen() {
		return this.surface.matches(":popover-open");
	}
	clearTimers() {
		this.openTimer !== null && clearTimeout(this.openTimer), this.closeTimer !== null && clearTimeout(this.closeTimer), this.openTimer = null, this.closeTimer = null;
	}
	show() {
		this.openTimer = null, !this.isOpen() && (this.positioner.reset(), this.surface.showPopover(), this.positioner.position());
	}
	scheduleOpen(e) {
		if (this.closeTimer !== null && clearTimeout(this.closeTimer), this.closeTimer = null, !(this.isOpen() || this.openTimer !== null)) {
			if (e === 0) {
				this.show();
				return;
			}
			this.openTimer = setTimeout(() => this.show(), e);
		}
	}
	scheduleClose() {
		this.openTimer !== null && clearTimeout(this.openTimer), this.openTimer = null, this.isOpen() && this.closeTimer === null && (this.closeTimer = setTimeout(() => {
			this.closeTimer = null;
			let e = document.activeElement;
			!this.pointerInside && !this.anchor.contains(e) && !this.surface.contains(e) && this.surface.hidePopover();
		}, this.closeDelay));
	}
	handlePointerEnter = () => {
		this.pointerInside = !0, this.scheduleOpen(this.hoverOpenDelay);
	};
	handlePointerLeave = () => {
		this.pointerInside = !1, this.scheduleClose();
	};
	handleFocusIn = () => {
		this.scheduleOpen(this.focusOpenDelay);
	};
	handleFocusOut = () => {
		this.scheduleClose();
	};
	handleBeforeToggle = (e) => {
		e.newState === "open" && this.positioner.reset();
	};
	handleToggle = () => {
		this.isOpen() ? this.positioner.position() : this.positioner.reset();
	};
	handleKeydown = (e) => {
		e.key === "Escape" && this.isOpen() && (e.preventDefault(), this.clearTimers(), this.surface.hidePopover());
	};
}, M = 0;
function N(e, t) {
	if (e.id) return e.id;
	let n;
	do
		M += 1, n = `${t}-${M}`;
	while (document.getElementById(n));
	return e.id = n, n;
}
function P(e) {
	return Array.from(e.children).filter((e) => e instanceof HTMLElement);
}
function F(e) {
	e.hasAttribute("type") || (e.type = "button");
}
function I(e, t, n) {
	e.toggleAttribute(t, n);
}
function L(e, t, n) {
	e.setAttribute(t, n);
}
function R(e, t, n) {
	let r = e.getAttribute(t);
	if (r === null || r.trim() === "") return n;
	let i = Number(r);
	return Number.isFinite(i) && i >= 0 ? i : n;
}
function z(e, t, n) {
	if (!Number.isFinite(n) || n < 0) throw RangeError(`${t} must be a nonnegative finite number.`);
	e.setAttribute(t, String(n));
}
var B = class {
	controller = null;
	observer = null;
	connect(e, t, n) {
		return this.disconnect(), this.controller = new AbortController(), this.observer = new MutationObserver(t), this.observer.observe(e, n), this.controller.signal;
	}
	disconnect() {
		this.controller?.abort(), this.observer?.disconnect(), this.controller = null, this.observer = null;
	}
};
function V(e, t) {
	if (typeof customElements > "u") return;
	let n = customElements.get(e);
	if (n && n !== t) throw Error(`Cannot register ${e}: another constructor already uses that name.`);
	n || customElements.define(e, t);
}
//#endregion
//#region src/elements/dropdown.ts
var H = typeof HTMLElement > "u" ? class {} : HTMLElement, U = class extends H {
	static observedAttributes = [
		"open",
		"placement",
		"offset"
	];
	trigger = null;
	menu = null;
	items = [];
	positioner = null;
	connection = new B();
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		I(this, "open", e);
	}
	get placement() {
		return this.getAttribute("placement") ?? "block-end-start";
	}
	set placement(e) {
		L(this, "placement", e);
	}
	get offset() {
		return R(this, "offset", 5);
	}
	set offset(e) {
		z(this, "offset", e);
	}
	get width() {
		return this.getAttribute("width") ?? "md";
	}
	set width(e) {
		L(this, "width", e);
	}
	get hideCaret() {
		return this.hasAttribute("hide-caret");
	}
	set hideCaret(e) {
		I(this, "hide-caret", e);
	}
	connectedCallback() {
		this.positioner = null, this.trigger = null, this.menu = null, this.items = [];
		let e = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), t = P(this), n = t.find((e) => e instanceof HTMLButtonElement), r = n?.getAttribute("popovertarget"), i = t.filter((e) => e !== n), a = t.find((e) => e.id === r) ?? i.find((e) => e.matches("menu, [popover], .sds-dropdown-menu")) ?? (i.length === 1 ? i[0] : null) ?? null;
		if (!n || !a) {
			console.warn("<sds-dropdown> requires one direct child button and one direct child menu or popover.");
			return;
		}
		F(n);
		let o = N(a, "sds-dropdown");
		a.classList.add("sds-dropdown-menu"), a.setAttribute("popover", a.getAttribute("popover") || "auto"), n.setAttribute("popovertarget", o), n.setAttribute("aria-controls", o), n.setAttribute("aria-expanded", String(a.matches(":popover-open"))), n.hasAttribute("aria-haspopup") || n.setAttribute("aria-haspopup", "menu"), a.setAttribute("role", "menu"), a.hasAttribute("aria-orientation") || a.setAttribute("aria-orientation", "vertical"), this.trigger = n, this.menu = a, this.positioner = new A(n, a, () => this.placement, () => this.getAttribute("offset") ?? void 0), this.collectItems(), n.addEventListener("keydown", this.handleTriggerKeydown, { signal: e }), a.addEventListener("beforetoggle", this.handleBeforeToggle, { signal: e }), a.addEventListener("toggle", this.handleToggle, { signal: e }), a.addEventListener("keydown", this.handleMenuKeydown, { signal: e }), a.addEventListener("click", this.handleMenuClick, { signal: e }), this.positioner.observe(e), this.open && this.show();
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
		I(this, "open", e), e ? this.positioner?.position() : this.positioner?.reset(), this.dispatchEvent(new CustomEvent("sds-toggle", {
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
function W() {
	V("sds-dropdown", U);
}
//#endregion
//#region src/elements/popover.ts
var G = typeof HTMLElement > "u" ? class {} : HTMLElement, K = class extends G {
	static observedAttributes = [
		"open",
		"placement",
		"offset"
	];
	content = null;
	positioner = null;
	hoverController = null;
	connection = new B();
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		I(this, "open", e);
	}
	get placement() {
		return this.getAttribute("placement") ?? "block-end-start";
	}
	set placement(e) {
		L(this, "placement", e);
	}
	get offset() {
		return R(this, "offset", 9);
	}
	set offset(e) {
		z(this, "offset", e);
	}
	get width() {
		return this.getAttribute("width") ?? "md";
	}
	set width(e) {
		L(this, "width", e);
	}
	connectedCallback() {
		this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
		let e = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), t = P(this), n = t.find((e) => e instanceof HTMLButtonElement), r = n?.getAttribute("popovertarget"), i = t.filter((e) => e !== n), a = t.find((e) => e.id === r) ?? i.find((e) => e.matches("[popover], .sds-popover-content")) ?? (i.length === 1 ? i[0] : null) ?? null;
		if (!n || !a) {
			console.warn("<sds-popover> requires one direct child button and one direct child content element.");
			return;
		}
		F(n);
		let o = N(a, "sds-popover");
		a.classList.add("sds-popover-content"), a.setAttribute("popover", a.getAttribute("popover") || "auto"), n.setAttribute("popovertarget", o), this.content = a, this.positioner = new A(n, a, () => this.placement, () => this.getAttribute("offset") ?? void 0, 9), this.hoverController = new j(n, a, this.positioner, {
			focusOpenDelay: 500,
			hoverOpenDelay: 500
		}), this.hoverController.observe(e), this.positioner.observe(e), a.addEventListener("toggle", this.handleToggle, { signal: e }), this.open && this.show();
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
		I(this, "open", e), this.dispatchEvent(new CustomEvent("sds-toggle", {
			bubbles: !0,
			composed: !0,
			detail: { open: e }
		}));
	};
};
function q() {
	V("sds-popover", K);
}
//#endregion
//#region src/elements/sidebar.ts
var J = !1, Y = /* @__PURE__ */ new WeakMap();
function X(e) {
	let t = Y.get(e);
	t !== void 0 && window.clearTimeout(t), Y.delete(e), e.removeAttribute("sds-closing");
}
function ae() {
	J || typeof document > "u" || (J = !0, document.addEventListener("beforetoggle", (e) => {
		if (!(e instanceof ToggleEvent) || e.oldState !== "open" || e.newState !== "closed" || !(e.target instanceof HTMLElement) || !e.target.matches(".sds-sidebar[popover]")) return;
		let t = e.target;
		X(t), t.setAttribute("sds-closing", ""), Y.set(t, window.setTimeout(() => X(t), 500));
	}, !0), document.addEventListener("transitionend", (e) => {
		e.propertyName === "transform" && e.target instanceof HTMLElement && e.target.matches(".sds-sidebar[sds-closing]") && X(e.target);
	}, !0));
}
//#endregion
//#region src/elements/tabs.ts
var oe = "sds-change", se = typeof HTMLElement > "u" ? class {} : HTMLElement, ce = class extends se {
	static observedAttributes = ["value"];
	tabs = [];
	panels = /* @__PURE__ */ new Map();
	connection = new B();
	reflectingValue = !1;
	get value() {
		return this.getAttribute("value") ?? "";
	}
	set value(e) {
		if (this.isConnected && !this.tabs.some((t) => this.tabValue(t) === e && !this.isDisabled(t))) throw RangeError(`<sds-tabs> has no enabled tab with value "${e}".`);
		L(this, "value", e);
	}
	get activation() {
		return this.getAttribute("activation") ?? "automatic";
	}
	set activation(e) {
		L(this, "activation", e);
	}
	get orientation() {
		return this.getAttribute("orientation") ?? "horizontal";
	}
	set orientation(e) {
		L(this, "orientation", e), this.syncOrientation();
	}
	get size() {
		return this.getAttribute("size") ?? "md";
	}
	set size(e) {
		L(this, "size", e);
	}
	get tone() {
		return this.getAttribute("tone") ?? "accent";
	}
	set tone(e) {
		L(this, "tone", e);
	}
	get variant() {
		return this.getAttribute("variant") ?? "folder";
	}
	set variant(e) {
		L(this, "variant", e);
	}
	connectedCallback() {
		let e = this.connection.connect(this, () => this.connectedCallback(), {
			childList: !0,
			subtree: !0
		}), t = P(this), n = t.find((e) => e.matches(".sds-tab-list, [role=\"tablist\"]")) ?? t[0] ?? null;
		if (this.tabs = n ? P(n).filter((e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement) : [], this.panels.clear(), !n || this.tabs.length === 0) {
			console.warn("<sds-tabs> requires a tab-list container with button or link children.");
			return;
		}
		let r = t.filter((e) => e !== n);
		if (r.length < this.tabs.length) {
			console.warn("<sds-tabs> requires one panel for every tab.");
			return;
		}
		n.classList.add("sds-tab-list"), n.setAttribute("role", "tablist"), this.syncOrientation(n), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && console.warn("<sds-tabs> requires an accessible name on its tab list.");
		let i = new Set(r);
		for (let [e, t] of this.tabs.entries()) {
			t instanceof HTMLButtonElement && F(t);
			let n = t.getAttribute("aria-controls"), a = r.find((e) => e.id === n) ?? null, o = a && i.has(a) ? a : r[e] && i.has(r[e]) ? r[e] : i.values().next().value;
			if (!o) continue;
			i.delete(o);
			let s = N(t, "sds-tab"), c = N(o, "sds-tab-panel");
			t.classList.add("sds-tab"), t.setAttribute("role", "tab"), t.setAttribute("aria-controls", c), o.classList.add("sds-tab-panel"), o.setAttribute("role", "tabpanel"), o.setAttribute("aria-labelledby", s), this.panels.set(t, o);
		}
		let a = this.value ? this.tabs.find((e) => this.tabValue(e) === this.value && !this.isDisabled(e)) : null;
		this.value && !a && console.warn(`<sds-tabs> has no enabled tab with value "${this.value}".`);
		let o = a ?? this.tabs.find((e) => e.getAttribute("aria-selected") === "true" && !this.isDisabled(e)) ?? this.tabs.find((e) => !this.isDisabled(e)) ?? null;
		for (let e of this.tabs) {
			let t = e === o;
			e.setAttribute("aria-selected", String(t)), e.tabIndex = t ? 0 : -1;
			let n = this.panels.get(e);
			n && (n.hidden = !t);
		}
		o && this.reflectValue(this.tabValue(o)), n.addEventListener("click", this.handleClick, { signal: e }), n.addEventListener("keydown", this.handleKeydown, { signal: e });
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
		this.hasAttribute("orientation") && (e ?? P(this).find((e) => e.matches(".sds-tab-list, [role=\"tablist\"]")))?.setAttribute("aria-orientation", this.orientation);
	}
	tabValue(e) {
		return e.getAttribute("value") ?? e.id;
	}
	reflectValue(e) {
		this.reflectingValue = !0, L(this, "value", e), this.reflectingValue = !1;
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
		}), this.reflectValue(this.tabValue(r)), t && r.focus(), n && a !== e && this.dispatchEvent(new CustomEvent(oe, {
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
function le() {
	V("sds-tabs", ce);
}
//#endregion
//#region src/elements/tooltip.ts
var ue = typeof HTMLElement > "u" ? class {} : HTMLElement, de = class extends ue {
	static observedAttributes = ["placement", "offset"];
	content = null;
	positioner = null;
	hoverController = null;
	connection = new B();
	get placement() {
		return this.getAttribute("placement") ?? "block-start";
	}
	set placement(e) {
		L(this, "placement", e);
	}
	get offset() {
		return R(this, "offset", 6);
	}
	set offset(e) {
		z(this, "offset", e);
	}
	connectedCallback() {
		this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
		let e = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), t = P(this), n = t.find((e) => e.matches("[role=\"tooltip\"], .sds-tooltip-content, [popover]")) ?? (t.length === 2 ? t[1] : null) ?? null, r = t.find((e) => e !== n) ?? null;
		if (!r || !n) {
			console.warn("<sds-tooltip> requires one direct child trigger and one direct child text element.");
			return;
		}
		let i = N(n, "sds-tooltip"), a = new Set((r.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
		a.add(i), n.classList.add("sds-tooltip-content"), n.setAttribute("role", "tooltip"), n.setAttribute("popover", "manual"), r.setAttribute("aria-describedby", [...a].join(" ")), this.content = n, this.positioner = new A(r, n, () => this.placement, () => this.getAttribute("offset") ?? void 0, 6), this.hoverController = new j(r, n, this.positioner, {
			closeDelay: 0,
			hoverOpenDelay: 0
		}), this.hoverController.observe(e), this.positioner.observe(e);
	}
	disconnectedCallback() {
		this.connection.disconnect(), this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
	}
	attributeChangedCallback(e, t, n) {
		t !== n && this.isConnected && this.content?.matches(":popover-open") && (this.positioner?.reset(), this.positioner?.position());
	}
};
function fe() {
	V("sds-tooltip", de);
}
//#endregion
//#region src/elements/toast.ts
var Z = 5e3, pe = typeof HTMLElement > "u" ? class {} : HTMLElement, Q = class extends pe {
	static observedAttributes = [
		"open",
		"duration",
		"persistent"
	];
	hideTimer = null;
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		I(this, "open", e);
	}
	get tone() {
		return this.getAttribute("tone") ?? "accent";
	}
	set tone(e) {
		L(this, "tone", e);
	}
	get duration() {
		let e = R(this, "duration", Z);
		return e > 0 ? e : Z;
	}
	set duration(e) {
		if (!Number.isFinite(e) || e <= 0) throw RangeError("duration must be a positive finite number.");
		z(this, "duration", e);
	}
	get persistent() {
		return this.hasAttribute("persistent");
	}
	set persistent(e) {
		I(this, "persistent", e);
	}
	connectedCallback() {
		window.getComputedStyle(this).display, this.setAttribute("sds-ready", ""), this.hasAttribute("role") || this.setAttribute("role", "status"), this.hasAttribute("aria-atomic") || this.setAttribute("aria-atomic", "true"), this.addEventListener("click", this.handleClick), this.addEventListener("focusin", this.pauseAutoHide), this.addEventListener("focusout", this.handleFocusOut), this.addEventListener("pointerenter", this.pauseAutoHide), this.addEventListener("pointerleave", this.resumeAutoHide), this.open && this.scheduleAutoHide();
	}
	disconnectedCallback() {
		this.clearAutoHide(), this.removeEventListener("click", this.handleClick), this.removeEventListener("focusin", this.pauseAutoHide), this.removeEventListener("focusout", this.handleFocusOut), this.removeEventListener("pointerenter", this.pauseAutoHide), this.removeEventListener("pointerleave", this.resumeAutoHide);
	}
	attributeChangedCallback(e, t, n) {
		t !== n && this.isConnected && (e === "open" && n === null ? this.clearAutoHide() : this.open && this.scheduleAutoHide());
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
		this.clearAutoHide(), this.open && !this.persistent && (this.hideTimer = window.setTimeout(() => this.close("timeout"), this.duration));
	}
	clearAutoHide() {
		this.hideTimer !== null && (window.clearTimeout(this.hideTimer), this.hideTimer = null);
	}
	handleClick = (e) => {
		e.target instanceof Element && e.target.closest("[data-sds-toast-close]") && this.close("dismiss");
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
}, $ = !1;
function me() {
	$ || typeof document > "u" || ($ = !0, document.addEventListener("click", (e) => {
		if (!(e.target instanceof Element)) return;
		let t = e.target.closest("[data-sds-toast-open]")?.getAttribute("data-sds-toast-open"), n = t ? document.getElementById(t) : null;
		n instanceof Q && n.show();
	}));
}
function he() {
	V("sds-toast", Q), me();
}
//#endregion
//#region src/sds.ts
function ge() {
	ne(), W(), q(), ae(), le(), he(), fe();
}
//#endregion
//#region src/auto.ts
ge();
//#endregion
