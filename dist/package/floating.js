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
};
//#endregion
export { p as FloatingHoverController, f as FloatingPositioner, u as computeFloatingPosition, n as resolveFloatingPlacement };
