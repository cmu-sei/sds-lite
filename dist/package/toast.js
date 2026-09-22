import { c as e, l as t, o as n, r, s as i } from "./internals-CEyyQZKd.js";
//#region src/elements/toast.ts
var a = 5e3, o = 250, s = typeof HTMLElement > "u" ? class {} : HTMLElement, c = class extends s {
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
		i(this, "open", e);
	}
	get tone() {
		return this.getAttribute("tone") ?? "accent";
	}
	set tone(e) {
		t(this, "tone", e);
	}
	get duration() {
		let e = n(this, "duration", a);
		return e > 0 ? e : a;
	}
	set duration(t) {
		if (!Number.isFinite(t) || t <= 0) throw RangeError("duration must be a positive finite number.");
		e(this, "duration", t);
	}
	get persistent() {
		return this.hasAttribute("persistent");
	}
	set persistent(e) {
		i(this, "persistent", e);
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
}, l = !1;
function u() {
	l || typeof document > "u" || (l = !0, document.addEventListener("click", (e) => {
		if (!(e.target instanceof Element)) return;
		let t = e.target.closest("[data-sds-toast-open]")?.getAttribute("data-sds-toast-open"), n = t ? document.getElementById(t) : null;
		n instanceof c && n.show();
	}));
}
function d() {
	r("sds-toast", c), u();
}
function f(e, t = {}) {
	if (typeof document > "u") throw Error("notify() can only be called in a browser.");
	if (t.duration !== void 0 && (!Number.isFinite(t.duration) || t.duration <= 0)) throw RangeError("notify() duration must be a positive number.");
	d();
	let n = t.container ?? document, r = t.container?.matches(".sds-toaster, sds-toaster") ?? !1 ? t.container : n.querySelector(".sds-toaster, sds-toaster");
	if (!r) {
		r = document.createElement("section"), r.className = "sds-toaster", r.setAttribute("aria-label", "Notifications");
		let e = t.container ?? document.querySelector("[data-sds-root]");
		e || (r.dataset.sdsRoot = ""), (e ?? document.body).append(r);
	}
	r.localName === "div" && !r.hasAttribute("role") && r.setAttribute("role", "region"), !r.hasAttribute("aria-label") && !r.hasAttribute("aria-labelledby") && r.setAttribute("aria-label", "Notifications");
	let i = document.createElement("sds-toast");
	i.tone = t.tone ?? "accent", i.setAttribute("role", t.urgent ? "alert" : "status"), i.setAttribute("aria-atomic", "true"), t.duration !== void 0 && (i.duration = t.duration), i.persistent = t.persistent ?? !1;
	let a = document.createElement("strong");
	a.textContent = t.title ?? "Notification";
	let s = document.createElement("span");
	s.textContent = e;
	let c = document.createElement("button");
	return c.type = "button", c.setAttribute("data-sds-shape", "icon"), c.setAttribute("data-sds-toast-close", ""), c.setAttribute("aria-label", "Dismiss notification"), c.textContent = "×", i.append(a, s, c), i.addEventListener("sds-close", () => window.setTimeout(() => i.remove(), o), { once: !0 }), r.append(i), i.show(), i;
}
//#endregion
export { c as SdsToastElement, f as notify, d as registerSdsToast };
