//#region src/elements/dialog.ts
var e = !1, t = 6, n = 48, r = 12, i = 80, a = 180, o = null, s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap();
function l(e) {
	let t = e.getAttribute("commandfor");
	if (t) {
		let e = document.getElementById(t);
		return e instanceof HTMLDialogElement && e.matches(".sds-dialog, .sds-panel") ? e : null;
	}
	return e.closest("dialog.sds-dialog, dialog.sds-panel");
}
function u(e, t) {
	e.open || (t ? e.showModal() : e.show());
}
function d(e) {
	let t = e.dataset.sdsSide;
	return t === "bottom" || t === "left" ? t : "right";
}
function f(e, t) {
	return t === "bottom" ? e.clientY : t === "left" ? -e.clientX : e.clientX;
}
function p(e, t) {
	return t === "bottom" ? e.clientX : e.clientY;
}
function m(e, t) {
	let n = e.getBoundingClientRect();
	return t === "bottom" ? n.height : n.width;
}
function h(e, t) {
	return e === "bottom" ? `translate3d(0, ${t}px, 0)` : `translate3d(${e === "left" ? -t : t}px, 0, 0)`;
}
function g(e) {
	s.get(e)?.();
	let t = c.get(e);
	if (!t) return;
	let n = Array.from(e.children).find((e) => e.classList.contains("_sds-panel-handle"));
	n instanceof HTMLElement && (n.style.cursor = t.handleCursor), e.style.transform = t.transform, e.style.transitionDuration = t.transitionDuration, e.style.transitionTimingFunction = t.transitionTimingFunction, e.style.setProperty("--sds-panel-backdrop-opacity", t.backdropOpacity), c.delete(e);
}
function _(e) {
	e.frame = null;
	let t = m(e.panel, e.side), n = Math.min(e.distance, t), r = t > 0 ? n / t : 0;
	e.panel.style.transform = h(e.side, n), e.panel.style.setProperty("--sds-panel-backdrop-opacity", String(1 - r));
}
function v(e, t) {
	let { panel: n } = e, r = n.ownerDocument.defaultView;
	if (!r) {
		g(n);
		return;
	}
	n.style.transitionDuration = "var(--sds-duration-normal)", n.style.transitionTimingFunction = t === "close" ? "var(--sds-easing-exit)" : "var(--sds-easing-enter)";
	let i = () => {
		r.clearTimeout(c), n.removeEventListener("transitionend", o), s.delete(n);
	}, a = () => {
		i(), t === "close" && n.open && n.close(), g(n);
	}, o = (e) => {
		e.target === n && e.propertyName === "transform" && a();
	}, c = r.setTimeout(a, 250);
	if (s.set(n, i), n.addEventListener("transitionend", o), t === "close") {
		let t = m(n, e.side);
		n.style.transform = h(e.side, t), n.style.setProperty("--sds-panel-backdrop-opacity", "0");
	} else n.style.transform = h(e.side, 0), n.style.setProperty("--sds-panel-backdrop-opacity", "1");
}
function y(e) {
	e.handle.hasPointerCapture(e.pointerId) && e.handle.releasePointerCapture(e.pointerId);
}
function b(e) {
	if (!e.isPrimary || e.button !== 0 || !(e.target instanceof Element)) return;
	let t = e.target.closest("._sds-panel-handle"), n = t?.closest("dialog.sds-panel[open]"), r = n && s.get(n);
	if (!t || !n || t.parentElement !== n || c.has(n) && !r) return;
	let i = d(n), a = 0;
	if (r) {
		let e = new DOMMatrixReadOnly(n.ownerDocument.defaultView?.getComputedStyle(n).transform);
		a = Math.max(0, i === "bottom" ? e.m42 : i === "left" ? -e.m41 : e.m41), r(), n.style.transitionDuration = "0s", n.style.transform = h(i, a), t.style.cursor = "grabbing";
	} else c.set(n, {
		backdropOpacity: n.style.getPropertyValue("--sds-panel-backdrop-opacity"),
		handleCursor: t.style.cursor,
		transform: n.style.transform,
		transitionDuration: n.style.transitionDuration,
		transitionTimingFunction: n.style.transitionTimingFunction
	});
	o = {
		dismissal: "pending",
		distance: a,
		dragging: !!r,
		frame: null,
		handle: t,
		lastTime: e.timeStamp,
		panel: n,
		pointerId: e.pointerId,
		samples: [{
			distance: a,
			time: e.timeStamp
		}],
		side: i,
		startCrossCoordinate: p(e, i),
		startCoordinate: f(e, i) - a
	}, t.setPointerCapture(e.pointerId);
}
function x(e) {
	let a = o;
	if (!a || e.pointerId !== a.pointerId) return;
	let s = Math.max(0, f(e, a.side) - a.startCoordinate), c = Math.abs(p(e, a.side) - a.startCrossCoordinate);
	if (!a.dragging) {
		if (s < t || s < c * 1.15) return;
		a.dragging = !0, a.panel.style.transitionDuration = "0s", a.handle.style.cursor = "grabbing";
	}
	if (e.preventDefault(), s !== a.distance) {
		let t = e.timeStamp, n = t - i, r = a.samples.findIndex((e) => e.time >= n);
		if (r < 0) a.samples = [{
			distance: a.distance,
			time: n
		}];
		else if (r > 0) {
			let e = a.samples[r - 1], t = a.samples[r], i = (n - e.time) / (t.time - e.time);
			a.samples = a.samples.slice(r), a.samples.unshift({
				distance: e.distance + (t.distance - e.distance) * i,
				time: n
			});
		}
		a.samples.push({
			distance: s,
			time: t
		}), a.samples = a.samples.slice(-8), a.lastTime = t;
	}
	a.distance = s, s >= n ? a.dismissal = "committed" : s <= r && a.dismissal === "committed" && (a.dismissal = "cancelled"), a.frame === null && (a.frame = a.panel.ownerDocument.defaultView?.requestAnimationFrame(() => _(a)) ?? null);
}
function S(e, r) {
	let s = o;
	if (!s || e.pointerId !== s.pointerId) return;
	if (r || x(e), o = null, y(s), !s.dragging) {
		g(s.panel);
		return;
	}
	let c = s.panel.ownerDocument.defaultView;
	s.frame !== null && c && (c.cancelAnimationFrame(s.frame), _(s));
	let l = s.samples[0], u = s.samples[s.samples.length - 1], d = s.samples.some((e) => e.distance - s.distance > t), f = e.timeStamp - s.lastTime > i || d ? 0 : Math.max(0, (u.distance - l.distance) / Math.max(1, u.time - l.time)), p = s.distance + f * a;
	if (!(!r && s.distance > 0 && (s.dismissal === "committed" || s.dismissal === "pending" && p >= n))) {
		v(s, "open");
		return;
	}
	let m = s.panel.ownerDocument.defaultView?.Event;
	v(s, m && s.panel.dispatchEvent(new m("cancel", { cancelable: !0 })) ? "close" : "open");
}
function C(e) {
	if (Array.from(e.children).find((e) => e.classList.contains("_sds-panel-handle"))) return;
	let t = e.ownerDocument.createElement("div");
	t.className = "_sds-panel-handle", t.setAttribute("aria-hidden", "true"), e.prepend(t);
}
function w(e) {
	e instanceof HTMLDialogElement && e.matches(".sds-panel") && C(e);
	for (let t of e.querySelectorAll("dialog.sds-panel")) C(t);
}
function T(e) {
	if (!(e.target instanceof Element)) return;
	let t = e.target.closest("[commandfor], dialog.sds-dialog [command], dialog.sds-panel [command]");
	if (t) {
		let n = l(t);
		if (!n) return;
		let r = t.getAttribute("command");
		if ((r === "show-modal" || r === "close" || r === "request-close") && e.preventDefault(), r === "show-modal") u(n, !0);
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
function E() {
	if (e || typeof document > "u") return;
	e = !0, document.addEventListener("click", T), document.addEventListener("pointerdown", b), document.addEventListener("pointermove", x), document.addEventListener("pointerup", (e) => S(e, !1)), document.addEventListener("pointercancel", (e) => S(e, !0)), document.addEventListener("lostpointercapture", (e) => S(e, !0)), document.addEventListener("close", (e) => {
		if (e.target instanceof HTMLDialogElement && e.target.matches(".sds-panel")) {
			if (o?.panel === e.target) {
				y(o);
				let t = e.target.ownerDocument.defaultView;
				o.frame !== null && t && t.cancelAnimationFrame(o.frame), o = null;
			}
			g(e.target);
		}
	}, !0), w(document);
	let t = document.defaultView?.MutationObserver;
	t && new t((e) => {
		for (let t of e) {
			t.type === "attributes" && t.target instanceof HTMLDialogElement && t.target.matches(".sds-panel") && C(t.target);
			for (let e of t.addedNodes) e instanceof Element && w(e);
		}
	}).observe(document.documentElement, {
		attributeFilter: ["class"],
		attributes: !0,
		childList: !0,
		subtree: !0
	});
}
//#endregion
export { E as registerSdsDialog };
