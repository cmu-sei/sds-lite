//#region src/elements/internals.ts
var e = 0;
function t(t, n) {
	if (t.id) return t.id;
	let r;
	do
		e += 1, r = `${n}-${e}`;
	while (document.getElementById(r));
	return t.id = r, r;
}
function n(e) {
	return Array.from(e.children).filter((e) => e instanceof HTMLElement);
}
function r(e, t, n) {
	e.toggleAttribute(t, n);
}
function i(e, t, n) {
	e.setAttribute(t, n);
}
function a(e, t, n) {
	let r = e.getAttribute(t);
	if (r === null || r.trim() === "") return n;
	let i = Number(r);
	return Number.isFinite(i) && i >= 0 ? i : n;
}
function o(e, t, n) {
	if (!Number.isFinite(n) || n < 0) throw RangeError(`${t} must be a nonnegative finite number.`);
	e.setAttribute(t, String(n));
}
var s = class {
	controller = null;
	observer = null;
	connect(e, t, n) {
		return this.disconnect(), this.controller = new AbortController(), this.observer = new MutationObserver(t), this.observer.observe(e, n), this.controller.signal;
	}
	disconnect() {
		this.controller?.abort(), this.observer?.disconnect(), this.controller = null, this.observer = null;
	}
};
function c(e, t) {
	if (typeof customElements > "u") return;
	let n = customElements.get(e);
	if (n && n !== t) throw Error(`Cannot register ${e}: another constructor already uses that name.`);
	n || customElements.define(e, t);
}
//#endregion
export { a, i as c, t as i, c as n, r as o, n as r, o as s, s as t };
