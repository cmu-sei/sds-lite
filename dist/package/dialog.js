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
function g(e) {
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
function _(e) {
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
function v(e, t) {
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
function y(e) {
	if (Array.from(e.children).find((e) => e.classList.contains("_sds-panel-handle"))) return;
	let t = e.ownerDocument.createElement("div");
	t.className = "_sds-panel-handle", t.setAttribute("aria-hidden", "true"), e.prepend(t);
}
function b(e) {
	e instanceof HTMLDialogElement && e.matches(".sds-panel") && y(e);
	for (let t of e.querySelectorAll("dialog.sds-panel")) y(t);
}
function x(e) {
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
function S() {
	if (e || typeof document > "u") return;
	e = !0, document.addEventListener("click", x), document.addEventListener("pointerdown", g), document.addEventListener("pointermove", _), document.addEventListener("pointerup", (e) => v(e, !1)), document.addEventListener("pointercancel", (e) => v(e, !0)), document.addEventListener("lostpointercapture", (e) => v(e, !0)), document.addEventListener("close", (e) => {
		if (e.target instanceof HTMLDialogElement && e.target.matches(".sds-panel")) {
			if (r?.panel === e.target) {
				h(r);
				let t = e.target.ownerDocument.defaultView;
				r.frame !== null && t && t.cancelAnimationFrame(r.frame), r = null;
			}
			f(e.target);
		}
	}, !0), b(document);
	let t = document.defaultView?.MutationObserver;
	t && new t((e) => {
		for (let t of e) {
			t.type === "attributes" && t.target instanceof HTMLDialogElement && t.target.matches(".sds-panel") && y(t.target);
			for (let e of t.addedNodes) e instanceof Element && b(e);
		}
	}).observe(document.documentElement, {
		attributeFilter: ["class"],
		attributes: !0,
		childList: !0,
		subtree: !0
	});
}
//#endregion
export { S as registerSdsDialog };
