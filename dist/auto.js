//#region src/elements/floating.ts
var e = [
	"top",
	"right",
	"bottom",
	"left"
], t = {
	top: "bottom",
	right: "left",
	bottom: "top",
	left: "right"
};
function n(e, t, n) {
	let r = [
		"block-start",
		"block-end",
		"inline-start",
		"inline-end"
	].find((t) => e === t || e.startsWith(`${t}-`)), a = r ? e.slice(r.length + 1) : "", o = a === "start" || a === "end" ? a : "center", s = n.startsWith("vertical"), c = n === "vertical-rl", l = t === "rtl", u, d = o;
	return r ? (s ? (u = r === "block-start" ? c ? "right" : "left" : r === "block-end" ? c ? "left" : "right" : r === "inline-start" ? l ? "bottom" : "top" : l ? "top" : "bottom", o !== "center" && (u === "top" || u === "bottom" ? c : l) && (d = o === "start" ? "end" : "start")) : (u = r === "block-start" ? "top" : r === "block-end" ? "bottom" : r === "inline-start" ? t === "rtl" ? "right" : "left" : t === "rtl" ? "left" : "right", (u === "top" || u === "bottom") && t === "rtl" && o !== "center" && (d = o === "start" ? "end" : "start")), i(u, d)) : "bottom-start";
}
function r(t, n) {
	let [i, a] = t.split("-");
	return {
		side: e.includes(i) ? i : r(n, "bottom-start").side,
		alignment: a === "start" || a === "end" ? a : "center"
	};
}
function i(e, t) {
	return t === "center" ? e : `${e}-${t}`;
}
function a(e, t, n) {
	return Math.max(0, -e) + Math.max(0, e + t - n);
}
function o(e, t, n, r, i) {
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
function s(e, t, n, r) {
	return r === "top" || r === "bottom" ? a(e.top, t.height, n.height) : a(e.left, t.width, n.width);
}
function c(e, t, n, r) {
	return r === "top" || r === "bottom" ? a(e.left, t.width, n.width) : a(e.top, t.height, n.height);
}
function l(e, t) {
	return e.reduce((e, n) => t(n) < t(e) ? n : e);
}
function u({ anchor: e, surface: n, viewport: a, preferredPlacement: u, previousPlacement: d, offset: f }) {
	let p = r(u, "bottom-start"), m = d ? r(d, "bottom-start") : null, h = m?.side ?? p.side, g = [h, t[h]], _ = (t) => s(o(e, n, t, p.alignment, f), n, a, t), v = m && _(h) === 0 ? h : l(g, _), y = m?.alignment ?? p.alignment, b = y === "center" ? [
		"center",
		"start",
		"end"
	] : [y, y === "start" ? "end" : "start"], x = (t) => c(o(e, n, v, t, f), n, a, v), S = m && x(y) === 0 ? y : l(b, x);
	return {
		...o(e, n, v, S, f),
		side: v,
		placement: i(v, S)
	};
}
function d(e, t) {
	if (e === void 0 || e.trim() === "") return t;
	let n = Number(e);
	return Number.isFinite(n) && n >= 0 ? n : t;
}
var f = class {
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
		let e = getComputedStyle(this.anchor), t = n(this.getPlacement(), e.direction, e.writingMode);
		t !== this.preferredPlacement && (this.previousPlacement = null, this.preferredPlacement = t);
		let r = this.anchor.getBoundingClientRect(), i = u({
			anchor: r,
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
			offset: d(this.getOffset(), this.defaultOffset)
		});
		this.previousPlacement = i.placement, this.surface.style.left = `${i.left}px`, this.surface.style.top = `${i.top}px`, this.surface.setAttribute("data-sds-side", i.side);
		let a = Math.min(Math.max(r.left + r.width / 2 - i.left, 12), Math.max(12, this.surface.offsetWidth - 12)), o = Math.min(Math.max(r.top + r.height / 2 - i.top, 12), Math.max(12, this.surface.offsetHeight - 12));
		this.surface.style.setProperty("--sds-floating-arrow-x", `${a}px`), this.surface.style.setProperty("--sds-floating-arrow-y", `${o}px`);
	};
}, p = class {
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
}, m = 0;
function h(e, t) {
	if (e.id) return e.id;
	let n;
	do
		m += 1, n = `${t}-${m}`;
	while (document.getElementById(n));
	return e.id = n, n;
}
function g(e) {
	return Array.from(e.children).filter((e) => e instanceof HTMLElement);
}
function _(e) {
	e.hasAttribute("type") || (e.type = "button");
}
function v(e, t, n) {
	e.toggleAttribute(t, n);
}
function y(e, t, n) {
	e.setAttribute(t, n);
}
function b(e, t, n) {
	let r = e.getAttribute(t);
	if (r === null || r.trim() === "") return n;
	let i = Number(r);
	return Number.isFinite(i) && i >= 0 ? i : n;
}
function x(e, t, n) {
	if (!Number.isFinite(n) || n < 0) throw RangeError(`${t} must be a nonnegative finite number.`);
	e.setAttribute(t, String(n));
}
var S = class {
	controller = null;
	observer = null;
	connect(e, t, n) {
		return this.disconnect(), this.controller = new AbortController(), this.observer = new MutationObserver(t), this.observer.observe(e, n), this.controller.signal;
	}
	disconnect() {
		this.controller?.abort(), this.observer?.disconnect(), this.controller = null, this.observer = null;
	}
};
function C(e, t) {
	if (typeof customElements > "u") return;
	let n = customElements.get(e);
	if (n && n !== t) throw Error(`Cannot register ${e}: another constructor already uses that name.`);
	n || customElements.define(e, t);
}
//#endregion
//#region src/elements/combobox.ts
var w = typeof HTMLElement > "u" ? class {} : HTMLElement, ee = class extends w {
	input = null;
	list = null;
	emptyStatus = null;
	options = [];
	activeOption = null;
	suppressOpen = !1;
	matchQuery = null;
	selecting = !1;
	connection = new S();
	optionObserver = null;
	inputObserver = null;
	positioner = null;
	emptyPositioner = null;
	connectedCallback() {
		this.positioner = null, this.emptyPositioner = null, this.optionObserver?.disconnect(), this.inputObserver?.disconnect(), this.input = null, this.list = null, this.emptyStatus = null, this.options = [], this.activeOption = null, this.suppressOpen = !1, this.matchQuery = null;
		let e = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), t = g(this), n = t.find((e) => e instanceof HTMLInputElement && (e.type === "text" || e.type === "search")), r = t.find((e) => e instanceof HTMLUListElement), i = t.find((e) => e instanceof HTMLOutputElement);
		if (!n || !r || t.length !== (i ? 3 : 2) || g(r).some((e) => !(e instanceof HTMLLIElement))) {
			console.warn("<sds-combobox> requires a direct child text or search input, a direct child ul with li options, and optionally one output for empty results.");
			return;
		}
		!n.labels?.length && !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && console.warn("<sds-combobox> requires an accessible name on its input."), h(n, "sds-combobox-input");
		let a = h(r, "sds-combobox-list");
		n.setAttribute("role", "combobox"), n.setAttribute("aria-autocomplete", "list"), n.setAttribute("aria-controls", a), n.setAttribute("aria-expanded", "false"), n.removeAttribute("aria-activedescendant"), r.classList.add("sds-combobox-list"), r.setAttribute("role", "listbox"), r.setAttribute("popover", "manual"), r.hidden = !0, this.input = n, this.list = r, this.emptyStatus = i ?? null, this.positioner = new f(n, r, () => "block-end-start", () => void 0), i && (this.emptyPositioner = new f(n, i, () => "block-end-start", () => void 0)), this.refreshOptions(), n.addEventListener("focus", this.handleFocus, { signal: e }), n.addEventListener("input", this.handleInput, { signal: e }), n.addEventListener("compositionend", this.handleCompositionEnd, { signal: e }), n.addEventListener("keydown", this.handleKeydown, { signal: e }), n.addEventListener("blur", this.handleBlur, { signal: e }), r.addEventListener("mousedown", this.handleMouseDown, { signal: e }), r.addEventListener("click", this.handleClick, { signal: e }), n.form?.addEventListener("reset", this.handleFormReset, { signal: e }), window.addEventListener("resize", this.handleReposition, { signal: e }), window.addEventListener("scroll", this.handleReposition, {
			capture: !0,
			signal: e
		}), this.optionObserver = new MutationObserver(() => {
			this.refreshOptions(), !this.suppressOpen && document.activeElement === this.input && this.updateMatches();
		}), this.optionObserver.observe(r, {
			childList: !0,
			subtree: !0,
			characterData: !0,
			attributes: !0,
			attributeFilter: ["aria-disabled", "aria-busy"]
		}), this.inputObserver = new MutationObserver(() => {
			(n.disabled || n.readOnly) && (this.close(), this.clearEmptyStatus());
		}), this.inputObserver.observe(n, {
			attributes: !0,
			attributeFilter: ["disabled", "readonly"]
		});
	}
	disconnectedCallback() {
		this.close(), this.clearEmptyStatus(), this.connection.disconnect(), this.optionObserver?.disconnect(), this.inputObserver?.disconnect(), this.optionObserver = null, this.inputObserver = null, this.input = null, this.list = null, this.emptyStatus = null, this.positioner = null, this.emptyPositioner = null, this.options = [], this.activeOption = null, this.suppressOpen = !1, this.matchQuery = null;
	}
	refreshOptions() {
		if (this.list) {
			this.options = g(this.list).filter((e) => e instanceof HTMLLIElement);
			for (let e of this.options) h(e, "sds-combobox-option"), e.setAttribute("role", "option"), e.hasAttribute("aria-selected") || e.setAttribute("aria-selected", "false");
			this.activeOption && !this.options.includes(this.activeOption) && this.setActive(null);
		}
	}
	selectableOptions() {
		return this.options.filter((e) => !e.hidden && e.getAttribute("aria-disabled") !== "true");
	}
	setActive(e) {
		this.activeOption && this.activeOption !== e && this.activeOption.setAttribute("aria-selected", "false"), this.activeOption = e, e ? (e.setAttribute("aria-selected", "true"), this.input?.setAttribute("aria-activedescendant", e.id), e.scrollIntoView?.({ block: "nearest" })) : this.input?.removeAttribute("aria-activedescendant");
	}
	close() {
		this.list && this.input && (this.list.matches(":popover-open") && this.list.hidePopover(), this.list.hidden = !0, this.input.setAttribute("aria-expanded", "false"), this.setActive(null));
	}
	clearEmptyStatus() {
		this.emptyStatus && (this.emptyStatus.textContent = ""), this.emptyPositioner?.reset();
	}
	updateEmptyStatus() {
		if (!this.emptyStatus || !this.input || !this.list) return;
		let e = !this.suppressOpen && !this.input.disabled && !this.input.readOnly && document.activeElement === this.input && this.input.value.trim() !== "" && this.list.getAttribute("aria-busy") !== "true" && this.options.every((e) => e.hidden) ? this.emptyStatus.getAttribute("data-empty-message")?.trim() || "No results found." : "";
		if (!e) {
			this.clearEmptyStatus();
			return;
		}
		this.emptyStatus.textContent !== e && (this.emptyStatus.textContent = e), this.emptyStatus.style.minWidth = `${this.input.getBoundingClientRect().width}px`, this.emptyPositioner?.position();
	}
	updateMatches() {
		if (this.input && this.list) {
			if (this.getAttribute("filter") !== "manual") {
				let e = (this.matchQuery ?? this.input.value).trim().toLocaleLowerCase();
				for (let t of this.options) t.hidden = !t.textContent?.toLocaleLowerCase().includes(e);
			}
			if (this.emptyStatus && queueMicrotask(() => this.updateEmptyStatus()), this.activeOption && !this.selectableOptions().includes(this.activeOption) && this.setActive(null), !(!this.suppressOpen && !this.input.disabled && !this.input.readOnly && this.selectableOptions().length > 0 && document.activeElement === this.input)) {
				this.close();
				return;
			}
			this.list.style.minWidth = `${this.input.getBoundingClientRect().width}px`, this.list.matches(":popover-open") || (this.list.hidden = !1, this.positioner?.reset(), this.list.showPopover()), this.positioner?.position(), this.input.setAttribute("aria-expanded", "true");
		}
	}
	select(e) {
		if (!this.input || this.input.disabled || this.input.readOnly || !this.selectableOptions().includes(e)) return;
		let t = e.getAttribute("data-label");
		if (t !== null && !t.trim()) {
			console.warn("<sds-combobox> option data-label must be nonempty.");
			return;
		}
		let n = t?.trim() ?? e.textContent?.trim() ?? "", r = e.getAttribute("data-sds-value") ?? n, i = this.hasAttribute("keep-open");
		i && (this.matchQuery ??= this.input.value), this.input.value = n, i ? this.setActive(null) : (this.suppressOpen = !0, this.close()), this.selecting = !0;
		try {
			this.input.focus(), this.input.dispatchEvent(new Event("input", { bubbles: !0 })), this.input.dispatchEvent(new Event("change", { bubbles: !0 })), this.dispatchEvent(new CustomEvent("sds-select", {
				bubbles: !0,
				composed: !0,
				detail: {
					option: e,
					value: r
				}
			}));
		} finally {
			this.selecting = !1;
		}
		i && (this.refreshOptions(), this.updateMatches());
	}
	handleFocus = () => {
		this.selecting || (this.suppressOpen = !1, this.matchQuery = null, this.refreshOptions(), this.updateMatches());
	};
	handleInput = (e) => {
		this.selecting || e instanceof InputEvent && e.isComposing || (this.suppressOpen = !1, this.matchQuery = null, this.refreshOptions(), this.setActive(null), this.updateMatches());
	};
	handleCompositionEnd = () => {
		this.suppressOpen = !1, this.matchQuery = null, this.refreshOptions(), this.updateMatches();
	};
	handleKeydown = (e) => {
		if (e.isComposing || !this.input || !this.list || this.input.disabled || this.input.readOnly) return;
		if (e.key === "Escape") {
			(!this.list.hidden || this.emptyStatus?.textContent) && (e.preventDefault(), this.suppressOpen = !0, this.close(), this.clearEmptyStatus());
			return;
		}
		if (e.key === "Enter" && !this.list.hidden && this.activeOption) {
			e.preventDefault(), this.select(this.activeOption);
			return;
		}
		if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
		this.suppressOpen = !1, this.refreshOptions(), this.list.hidden && this.updateMatches();
		let t = this.selectableOptions();
		if (!t.length) return;
		e.preventDefault();
		let n = this.activeOption ? t.indexOf(this.activeOption) : -1;
		this.setActive(t[e.key === "ArrowDown" ? (n + 1) % t.length : n < 0 ? t.length - 1 : (n - 1 + t.length) % t.length]);
	};
	handleFormReset = () => {
		this.suppressOpen = !0, this.matchQuery = null, this.close(), this.clearEmptyStatus();
	};
	handleReposition = () => {
		this.list?.matches(":popover-open") && this.positioner?.position(), this.emptyStatus?.textContent && this.emptyPositioner?.position();
	};
	handleBlur = () => {
		this.close(), this.clearEmptyStatus();
	};
	handleMouseDown = (e) => {
		e.target instanceof Element && this.list?.contains(e.target.closest("[role=\"option\"]")) && e.preventDefault();
	};
	handleClick = (e) => {
		if (!(e.target instanceof Element)) return;
		let t = e.target.closest("[role=\"option\"]");
		t && this.list?.contains(t) && this.select(t);
	};
};
function te() {
	C("sds-combobox", ee);
}
//#endregion
//#region src/elements/dialog.ts
var T = !1, E = 6, ne = 180, D = null, O = /* @__PURE__ */ new WeakMap();
function re(e) {
	let t = e.getAttribute("commandfor");
	if (t) {
		let e = document.getElementById(t);
		return e instanceof HTMLDialogElement && e.matches(".sds-dialog, .sds-panel") ? e : null;
	}
	return e.closest("dialog.sds-dialog, dialog.sds-panel");
}
function ie(e, t) {
	e.open || (t ? e.showModal() : e.show());
}
function ae(e) {
	let t = e.dataset.sdsSide;
	return t === "bottom" || t === "left" ? t : "right";
}
function k(e, t) {
	return t === "bottom" ? e.clientY : t === "left" ? -e.clientX : e.clientX;
}
function A(e, t) {
	return t === "bottom" ? e.clientX : e.clientY;
}
function j(e, t) {
	let n = e.getBoundingClientRect();
	return t === "bottom" ? n.height : n.width;
}
function M(e, t) {
	return e === "bottom" ? `translate3d(0, ${t}px, 0)` : `translate3d(${e === "left" ? -t : t}px, 0, 0)`;
}
function N(e) {
	let t = O.get(e);
	if (!t) return;
	let n = Array.from(e.children).find((e) => e.classList.contains("_sds-panel-handle"));
	n instanceof HTMLElement && (n.style.cursor = t.handleCursor), e.style.transform = t.transform, e.style.transitionDuration = t.transitionDuration, e.style.transitionTimingFunction = t.transitionTimingFunction, e.style.setProperty("--sds-panel-backdrop-opacity", t.backdropOpacity), O.delete(e);
}
function P(e) {
	e.frame = null;
	let t = j(e.panel, e.side), n = Math.min(e.distance, t), r = t > 0 ? n / t : 0;
	e.panel.style.transform = M(e.side, n), e.panel.style.setProperty("--sds-panel-backdrop-opacity", String(1 - r));
}
function F(e, t) {
	let { panel: n } = e, r = n.ownerDocument.defaultView;
	if (!r) {
		N(n);
		return;
	}
	n.style.transitionDuration = "var(--sds-duration-normal)", n.style.transitionTimingFunction = t === "close" ? "var(--sds-easing-exit)" : "var(--sds-easing-enter)";
	let i = () => {
		r.clearTimeout(o), n.removeEventListener("transitionend", a), t === "close" && n.open && n.close(), N(n);
	}, a = (e) => {
		e.target === n && e.propertyName === "transform" && i();
	}, o = r.setTimeout(i, 250);
	if (n.addEventListener("transitionend", a), t === "close") {
		let t = j(n, e.side);
		n.style.transform = M(e.side, t), n.style.setProperty("--sds-panel-backdrop-opacity", "0");
	} else n.style.transform = M(e.side, 0), n.style.setProperty("--sds-panel-backdrop-opacity", "1");
}
function I(e) {
	e.handle.hasPointerCapture(e.pointerId) && e.handle.releasePointerCapture(e.pointerId);
}
function oe(e) {
	if (!e.isPrimary || e.button !== 0 || !(e.target instanceof Element)) return;
	let t = e.target.closest("._sds-panel-handle"), n = t?.closest("dialog.sds-panel[open]");
	if (!t || !n || t.parentElement !== n || O.has(n)) return;
	let r = ae(n);
	O.set(n, {
		backdropOpacity: n.style.getPropertyValue("--sds-panel-backdrop-opacity"),
		handleCursor: t.style.cursor,
		transform: n.style.transform,
		transitionDuration: n.style.transitionDuration,
		transitionTimingFunction: n.style.transitionTimingFunction
	}), D = {
		distance: 0,
		dragging: !1,
		frame: null,
		handle: t,
		lastDistance: 0,
		lastTime: e.timeStamp,
		panel: n,
		pointerId: e.pointerId,
		side: r,
		startCrossCoordinate: A(e, r),
		startCoordinate: k(e, r),
		velocity: 0
	}, t.setPointerCapture(e.pointerId);
}
function se(e) {
	let t = D;
	if (!t || e.pointerId !== t.pointerId) return;
	let n = Math.max(0, k(e, t.side) - t.startCoordinate), r = Math.abs(A(e, t.side) - t.startCrossCoordinate);
	if (!t.dragging) {
		if (n < E || n < r * 1.15) return;
		t.dragging = !0, t.panel.style.transitionDuration = "0s", t.handle.style.cursor = "grabbing";
	}
	e.preventDefault();
	let i = e.timeStamp - t.lastTime;
	if (i > 0) {
		let e = (n - t.lastDistance) / i;
		t.velocity = t.velocity * .7 + e * .3;
	}
	t.distance = n, t.lastDistance = n, t.lastTime = e.timeStamp, t.frame === null && (t.frame = t.panel.ownerDocument.defaultView?.requestAnimationFrame(() => P(t)) ?? null);
}
function L(e, t) {
	let n = D;
	if (!n || e.pointerId !== n.pointerId) return;
	if (D = null, I(n), !n.dragging) {
		N(n.panel);
		return;
	}
	let r = n.panel.ownerDocument.defaultView;
	n.frame !== null && r && (r.cancelAnimationFrame(n.frame), P(n));
	let i = j(n.panel, n.side), a = e.timeStamp - n.lastTime > 80 ? 0 : Math.max(0, n.velocity), o = n.distance + a * ne;
	if (!(!t && n.distance > 0 && o >= i * .45)) {
		F(n, "open");
		return;
	}
	let s = n.panel.ownerDocument.defaultView?.Event;
	F(n, s && n.panel.dispatchEvent(new s("cancel", { cancelable: !0 })) ? "close" : "open");
}
function R(e) {
	if (Array.from(e.children).find((e) => e.classList.contains("_sds-panel-handle"))) return;
	let t = e.ownerDocument.createElement("div");
	t.className = "_sds-panel-handle", t.setAttribute("aria-hidden", "true"), e.prepend(t);
}
function z(e) {
	e instanceof HTMLDialogElement && e.matches(".sds-panel") && R(e);
	for (let t of e.querySelectorAll("dialog.sds-panel")) R(t);
}
function B(e) {
	if (!(e.target instanceof Element)) return;
	let t = e.target.closest("[commandfor], dialog.sds-dialog [command], dialog.sds-panel [command]");
	if (t) {
		let n = re(t);
		if (!n) return;
		let r = t.getAttribute("command");
		if ((r === "show-modal" || r === "close" || r === "request-close") && e.preventDefault(), r === "show-modal") ie(n, !0);
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
function V() {
	if (T || typeof document > "u") return;
	T = !0, document.addEventListener("click", B), document.addEventListener("pointerdown", oe), document.addEventListener("pointermove", se), document.addEventListener("pointerup", (e) => L(e, !1)), document.addEventListener("pointercancel", (e) => L(e, !0)), document.addEventListener("lostpointercapture", (e) => L(e, !0)), document.addEventListener("close", (e) => {
		if (e.target instanceof HTMLDialogElement && e.target.matches(".sds-panel")) {
			if (D?.panel === e.target) {
				I(D);
				let t = e.target.ownerDocument.defaultView;
				D.frame !== null && t && t.cancelAnimationFrame(D.frame), D = null;
			}
			N(e.target);
		}
	}, !0), z(document);
	let e = document.defaultView?.MutationObserver;
	e && new e((e) => {
		for (let t of e) {
			t.type === "attributes" && t.target instanceof HTMLDialogElement && t.target.matches(".sds-panel") && R(t.target);
			for (let e of t.addedNodes) e instanceof Element && z(e);
		}
	}).observe(document.documentElement, {
		attributeFilter: ["class"],
		attributes: !0,
		childList: !0,
		subtree: !0
	});
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
	connection = new S();
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		v(this, "open", e);
	}
	get placement() {
		return this.getAttribute("placement") ?? "block-end-start";
	}
	set placement(e) {
		y(this, "placement", e);
	}
	get offset() {
		return b(this, "offset", 5);
	}
	set offset(e) {
		x(this, "offset", e);
	}
	get width() {
		return this.getAttribute("width") ?? "md";
	}
	set width(e) {
		y(this, "width", e);
	}
	get hideCaret() {
		return this.hasAttribute("hide-caret");
	}
	set hideCaret(e) {
		v(this, "hide-caret", e);
	}
	connectedCallback() {
		this.positioner = null, this.trigger = null, this.menu = null, this.items = [];
		let e = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), t = g(this), n = t.find((e) => e instanceof HTMLButtonElement), r = n?.getAttribute("popovertarget"), i = t.filter((e) => e !== n), a = t.find((e) => e.id === r) ?? i.find((e) => e.matches("menu, [popover], .sds-dropdown-menu")) ?? (i.length === 1 ? i[0] : null) ?? null;
		if (!n || !a) {
			console.warn("<sds-dropdown> requires one direct child button and one direct child menu or popover.");
			return;
		}
		_(n);
		let o = h(a, "sds-dropdown");
		a.classList.add("sds-dropdown-menu"), a.setAttribute("popover", a.getAttribute("popover") || "auto"), n.setAttribute("popovertarget", o), n.setAttribute("aria-controls", o), n.setAttribute("aria-expanded", String(a.matches(":popover-open"))), n.hasAttribute("aria-haspopup") || n.setAttribute("aria-haspopup", "menu"), a.setAttribute("role", "menu"), a.hasAttribute("aria-orientation") || a.setAttribute("aria-orientation", "vertical"), this.trigger = n, this.menu = a, this.positioner = new f(n, a, () => this.placement, () => this.getAttribute("offset") ?? void 0), this.collectItems(), n.addEventListener("keydown", this.handleTriggerKeydown, { signal: e }), a.addEventListener("beforetoggle", this.handleBeforeToggle, { signal: e }), a.addEventListener("toggle", this.handleToggle, { signal: e }), a.addEventListener("keydown", this.handleMenuKeydown, { signal: e }), a.addEventListener("click", this.handleMenuClick, { signal: e }), this.positioner.observe(e), this.open && this.show();
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
		v(this, "open", e), e ? this.positioner?.position() : this.positioner?.reset(), this.dispatchEvent(new CustomEvent("sds-toggle", {
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
	C("sds-dropdown", U);
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
	connection = new S();
	get open() {
		return this.hasAttribute("open");
	}
	set open(e) {
		v(this, "open", e);
	}
	get placement() {
		return this.getAttribute("placement") ?? "block-end-start";
	}
	set placement(e) {
		y(this, "placement", e);
	}
	get offset() {
		return b(this, "offset", 9);
	}
	set offset(e) {
		x(this, "offset", e);
	}
	get width() {
		return this.getAttribute("width") ?? "md";
	}
	set width(e) {
		y(this, "width", e);
	}
	connectedCallback() {
		this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
		let e = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), t = g(this), n = t.find((e) => e instanceof HTMLButtonElement), r = n?.getAttribute("popovertarget"), i = t.filter((e) => e !== n), a = t.find((e) => e.id === r) ?? i.find((e) => e.matches("[popover], .sds-popover-content")) ?? (i.length === 1 ? i[0] : null) ?? null;
		if (!n || !a) {
			console.warn("<sds-popover> requires one direct child button and one direct child content element.");
			return;
		}
		_(n);
		let o = h(a, "sds-popover");
		a.classList.add("sds-popover-content"), a.setAttribute("popover", a.getAttribute("popover") || "auto"), n.setAttribute("popovertarget", o), this.content = a, this.positioner = new f(n, a, () => this.placement, () => this.getAttribute("offset") ?? void 0, 9), this.hoverController = new p(n, a, this.positioner, {
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
		v(this, "open", e), this.dispatchEvent(new CustomEvent("sds-toggle", {
			bubbles: !0,
			composed: !0,
			detail: { open: e }
		}));
	};
};
function ce() {
	C("sds-popover", K);
}
//#endregion
//#region src/elements/sidebar.ts
var q = !1, J = /* @__PURE__ */ new WeakMap();
function Y(e) {
	let t = J.get(e);
	t !== void 0 && window.clearTimeout(t), J.delete(e), e.removeAttribute("sds-closing");
}
function le() {
	q || typeof document > "u" || (q = !0, document.addEventListener("beforetoggle", (e) => {
		if (!(e instanceof ToggleEvent) || e.oldState !== "open" || e.newState !== "closed" || !(e.target instanceof HTMLElement) || !e.target.matches(".sds-sidebar[popover]")) return;
		let t = e.target;
		Y(t), t.setAttribute("sds-closing", ""), J.set(t, window.setTimeout(() => Y(t), 500));
	}, !0), document.addEventListener("transitionend", (e) => {
		e.propertyName === "transform" && e.target instanceof HTMLElement && e.target.matches(".sds-sidebar[sds-closing]") && Y(e.target);
	}, !0));
}
//#endregion
//#region src/elements/tabs.ts
var ue = "sds-change", de = typeof HTMLElement > "u" ? class {} : HTMLElement, fe = class extends de {
	static observedAttributes = ["value", "orientation"];
	tabs = [];
	panels = /* @__PURE__ */ new Map();
	connection = new S();
	reflectingValue = !1;
	get value() {
		return this.getAttribute("value") ?? "";
	}
	set value(e) {
		if (this.isConnected && !this.tabs.some((t) => this.tabValue(t) === e && !this.isDisabled(t))) throw RangeError(`<sds-tabs> has no enabled tab with value "${e}".`);
		y(this, "value", e);
	}
	get activation() {
		return this.getAttribute("activation") ?? "automatic";
	}
	set activation(e) {
		y(this, "activation", e);
	}
	get orientation() {
		return this.getAttribute("orientation") ?? "horizontal";
	}
	set orientation(e) {
		y(this, "orientation", e);
	}
	get size() {
		return this.getAttribute("size") ?? "md";
	}
	set size(e) {
		y(this, "size", e);
	}
	get tone() {
		return this.getAttribute("tone") ?? "info";
	}
	set tone(e) {
		y(this, "tone", e);
	}
	get variant() {
		return this.getAttribute("variant") ?? "folder";
	}
	set variant(e) {
		y(this, "variant", e);
	}
	connectedCallback() {
		let e = this.connection.connect(this, () => this.connectedCallback(), {
			childList: !0,
			subtree: !0
		}), t = g(this), n = t.find((e) => e.matches(".sds-tab-list, [role=\"tablist\"]")) ?? t[0] ?? null;
		if (this.tabs = n ? g(n).filter((e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement) : [], this.panels.clear(), !n || this.tabs.length === 0) {
			console.warn("<sds-tabs> requires a tab-list container with button or link children.");
			return;
		}
		let r = t.filter((e) => e !== n);
		if (r.length < this.tabs.length) {
			console.warn("<sds-tabs> requires one panel for every tab.");
			return;
		}
		n.classList.add("sds-tab-list"), n.setAttribute("role", "tablist"), this.hasAttribute("orientation") && this.syncOrientation(n), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && console.warn("<sds-tabs> requires an accessible name on its tab list.");
		let i = new Set(r);
		for (let [e, t] of this.tabs.entries()) {
			t instanceof HTMLButtonElement && _(t);
			let n = t.getAttribute("aria-controls"), a = r.find((e) => e.id === n) ?? null, o = a && i.has(a) ? a : r[e] && i.has(r[e]) ? r[e] : i.values().next().value;
			if (!o) continue;
			i.delete(o);
			let s = h(t, "sds-tab"), c = h(o, "sds-tab-panel");
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
		if (t === n) return;
		if (e === "orientation") {
			this.syncOrientation();
			return;
		}
		if (!this.isConnected || e !== "value" || this.reflectingValue || n === null) return;
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
		(e ?? g(this).find((e) => e.matches(".sds-tab-list, [role=\"tablist\"]")))?.setAttribute("aria-orientation", this.orientation);
	}
	tabValue(e) {
		return e.getAttribute("value") ?? e.id;
	}
	reflectValue(e) {
		this.reflectingValue = !0, y(this, "value", e), this.reflectingValue = !1;
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
		}), this.reflectValue(this.tabValue(r)), t && r.focus(), n && a !== e && this.dispatchEvent(new CustomEvent(ue, {
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
function pe() {
	C("sds-tabs", fe);
}
//#endregion
//#region src/elements/tooltip.ts
var me = typeof HTMLElement > "u" ? class {} : HTMLElement, he = class extends me {
	static observedAttributes = [
		"placement",
		"offset",
		"size"
	];
	content = null;
	positioner = null;
	hoverController = null;
	connection = new S();
	get placement() {
		return this.getAttribute("placement") ?? "block-start";
	}
	set placement(e) {
		y(this, "placement", e);
	}
	get offset() {
		return b(this, "offset", 6);
	}
	set offset(e) {
		x(this, "offset", e);
	}
	get size() {
		return this.getAttribute("size") ?? "sm";
	}
	set size(e) {
		y(this, "size", e);
	}
	connectedCallback() {
		this.hoverController?.disconnect(), this.hoverController = null, this.positioner = null, this.content = null;
		let e = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), t = g(this), n = t.find((e) => e.matches("[role=\"tooltip\"], .sds-tooltip-content, [popover]")) ?? (t.length === 2 ? t[1] : null) ?? null, r = t.find((e) => e !== n) ?? null;
		if (!r || !n) {
			console.warn("<sds-tooltip> requires one direct child trigger and one direct child text element.");
			return;
		}
		let i = h(n, "sds-tooltip"), a = new Set((r.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
		a.add(i), n.classList.add("sds-tooltip-content"), n.setAttribute("role", "tooltip"), n.setAttribute("popover", "manual"), r.setAttribute("aria-describedby", [...a].join(" ")), this.content = n, this.positioner = new f(r, n, () => this.placement, () => this.getAttribute("offset") ?? void 0, 6), this.hoverController = new p(r, n, this.positioner, {
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
function ge() {
	C("sds-tooltip", he);
}
//#endregion
//#region src/elements/toast.ts
var X = 5e3, _e = 250, ve = typeof HTMLElement > "u" ? class {} : HTMLElement, Z = class extends ve {
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
		v(this, "open", e);
	}
	get tone() {
		return this.getAttribute("tone") ?? "info";
	}
	set tone(e) {
		y(this, "tone", e);
	}
	get duration() {
		let e = b(this, "duration", X);
		return e > 0 ? e : X;
	}
	set duration(e) {
		if (!Number.isFinite(e) || e <= 0) throw RangeError("duration must be a positive finite number.");
		x(this, "duration", e);
	}
	get persistent() {
		return this.hasAttribute("persistent");
	}
	set persistent(e) {
		v(this, "persistent", e);
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
}, Q = !1;
function ye() {
	Q || typeof document > "u" || (Q = !0, document.addEventListener("click", (e) => {
		if (!(e.target instanceof Element)) return;
		let t = e.target.closest("[data-sds-toast-open]")?.getAttribute("data-sds-toast-open"), n = t ? document.getElementById(t) : null;
		n instanceof Z && n.show();
	}));
}
function $() {
	C("sds-toast", Z), ye();
}
function be(e, t = {}) {
	if (typeof document > "u") throw Error("notify() can only be called in a browser.");
	if (t.duration !== void 0 && (!Number.isFinite(t.duration) || t.duration <= 0)) throw RangeError("notify() duration must be a positive number.");
	$();
	let n = t.container ?? document, r = t.container?.matches(".sds-toaster, sds-toaster") ?? !1 ? t.container : n.querySelector(".sds-toaster, sds-toaster");
	if (!r) {
		r = document.createElement("section"), r.className = "sds-toaster", r.setAttribute("aria-label", "Notifications");
		let e = t.container ?? document.querySelector("[data-sds-root]");
		e || (r.dataset.sdsRoot = ""), (e ?? document.body).append(r);
	}
	r.localName === "div" && !r.hasAttribute("role") && r.setAttribute("role", "region"), !r.hasAttribute("aria-label") && !r.hasAttribute("aria-labelledby") && r.setAttribute("aria-label", "Notifications");
	let i = document.createElement("sds-toast");
	i.tone = t.tone ?? "info", i.setAttribute("role", t.urgent ? "alert" : "status"), i.setAttribute("aria-atomic", "true"), t.duration !== void 0 && (i.duration = t.duration), i.persistent = t.persistent ?? !1;
	let a = document.createElement("strong");
	a.textContent = t.title ?? "Notification";
	let o = document.createElement("span");
	o.textContent = e;
	let s = document.createElement("button");
	return s.type = "button", s.setAttribute("data-sds-shape", "icon"), s.setAttribute("data-sds-toast-close", ""), s.setAttribute("aria-label", "Dismiss notification"), s.textContent = "×", i.append(a, o, s), i.addEventListener("sds-close", () => window.setTimeout(() => i.remove(), _e), { once: !0 }), r.append(i), i.show(), i;
}
//#endregion
//#region src/sds.ts
function xe() {
	te(), V(), W(), ce(), le(), pe(), $(), ge();
}
//#endregion
//#region src/auto.ts
xe();
//#endregion
export { be as notify };
