// src/documentation.ts
var e = !1, t = 0, n = /* @__PURE__ */ new WeakMap(), r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakMap(), a = /* @__PURE__ */ new WeakSet(), o = new Intl.Collator(void 0, {
	numeric: !0,
	sensitivity: "base"
});
function s() {
	for (let e of document.querySelectorAll(".sds-app[data-sds-variant=\"documentation\"] .sds-prose table")) {
		if (a.has(e)) continue;
		let t = [...e.tHead?.rows[0]?.cells ?? []], n = [...e.tBodies];
		if (!t.length || !n.length || t.some((e) => e.colSpan !== 1 || e.rowSpan !== 1 || e.querySelector("a, button, input, select")) || n.some((e) => [...e.rows].some((e) => e.cells.length !== t.length || [...e.cells].some((e) => e.colSpan !== 1 || e.rowSpan !== 1)))) continue;
		a.add(e), e.classList.add("sds-table");
		let r = e.querySelector("template[data-sds-sort-icon]")?.content.firstElementChild, i = t.map((e, i) => {
			let a = e.textContent?.trim() || `Column ${i + 1}`, s = document.createElement("button");
			if (s.type = "button", s.className = "sds-button", s.dataset.sdsVariant = "text", s.setAttribute("aria-label", `Sort by ${a}`), s.append(...e.childNodes), r) s.append(r.cloneNode(!0));
			else {
				let e = document.createElement("span");
				e.dataset.sdsSortArrow = "", e.setAttribute("aria-hidden", "true"), e.textContent = "↑", s.append(e);
			}
			return e.append(s), e.setAttribute("aria-sort", "none"), s.addEventListener("click", () => {
				let r = e.getAttribute("aria-sort") !== "ascending";
				for (let e of t) e.setAttribute("aria-sort", "none");
				e.setAttribute("aria-sort", r ? "ascending" : "descending");
				for (let e of n) {
					let t = [...e.rows];
					t.sort((e, t) => {
						let n = e.cells[i]?.textContent?.trim() ?? "", a = t.cells[i]?.textContent?.trim() ?? "", s = n !== "" && a !== "" && Number.isFinite(Number(n)) && Number.isFinite(Number(a)) ? Number(n) - Number(a) : o.compare(n, a);
						return r ? s : -s;
					}), e.append(...t);
				}
			}), s;
		});
		for (let e of i) e.hidden = !1;
	}
}
function c(e) {
	return e.closest("[data-sds-root]") ?? document.documentElement;
}
function l(e) {
	return e === document.body || e === document.documentElement ? "sds-color-scheme" : e.id ? `sds-color-scheme:${e.id}` : null;
}
function u(e) {
	let t = e.dataset.sdsColorScheme;
	return t === "dark" || t === "system" && matchMedia("(prefers-color-scheme: dark)").matches;
}
function d() {
	for (let e of document.querySelectorAll("button[data-sds-action]")) {
		let t = e.dataset.sdsAction;
		if (t === "toggle-color-scheme") {
			let t = u(c(e));
			e.setAttribute("aria-pressed", String(t)), e.setAttribute("aria-label", t ? "Switch to light mode" : "Switch to dark mode"), e.title = e.getAttribute("aria-label");
		} else if (t === "toggle-fullscreen") {
			let t = !!document.fullscreenElement;
			e.disabled = !document.fullscreenEnabled, e.setAttribute("aria-pressed", String(t)), e.setAttribute("aria-label", t ? "Exit fullscreen" : "Enter fullscreen"), e.title = e.getAttribute("aria-label");
		} else e.closest(".sds-code-block") && (e.hidden = !1);
	}
}
function f() {
	t = 0;
	for (let e of document.querySelectorAll(".sds-app-toc")) {
		let t = e.closest(".sds-app");
		if (t?.dataset.sdsVariant !== "documentation") continue;
		let n = [...e.querySelectorAll("a[href^=\"#\"]")].flatMap((e) => {
			try {
				let n = document.getElementById(decodeURIComponent(e.hash.slice(1)));
				return n?.closest(".sds-app") === t && /^H[2-6]$/.test(n.tagName) ? [{
					link: e,
					heading: n
				}] : [];
			} catch {
				return [];
			}
		}), r = t.querySelector(":scope > .sds-app-header"), i = Math.max(0, r?.getBoundingClientRect().bottom ?? 0) + 32, a = n[0]?.heading;
		for (let { heading: e } of n) e.getBoundingClientRect().top <= i && (a = e);
		scrollY > 0 && Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2 && (a = n.at(-1)?.heading);
		for (let { link: e, heading: t } of n) t === a ? e.setAttribute("aria-current", "location") : e.removeAttribute("aria-current");
	}
}
function p() {
	for (let e of document.querySelectorAll(".sds-app-toc")) {
		let t = e.querySelector(":scope > strong"), n = t?.querySelector(":scope > svg");
		if (t && !n?.hasAttribute("data-sds-toc-icon")) {
			let e = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			e.setAttribute("aria-hidden", "true"), e.setAttribute("viewBox", "0 0 24 24"), e.setAttribute("fill", "none"), e.setAttribute("stroke", "currentColor"), e.setAttribute("stroke-width", "2"), e.setAttribute("stroke-linecap", "round"), e.setAttribute("stroke-linejoin", "round"), e.setAttribute("data-sds-toc-icon", "");
			for (let t of [
				"M3 5h.01",
				"M3 12h.01",
				"M3 19h.01",
				"M8 5h13",
				"M8 12h13",
				"M8 19h13"
			]) {
				let n = document.createElementNS("http://www.w3.org/2000/svg", "path");
				n.setAttribute("d", t), e.append(n);
			}
			n?.replaceWith(e), n || t.prepend(e);
		}
		for (let t of [...e.querySelectorAll("a[href^=\"#\"]")]) try {
			let n = document.getElementById(decodeURIComponent(t.hash.slice(1)));
			n && n.closest(".sds-app") === e.closest(".sds-app") && /^H[2-6]$/.test(n.tagName) || t.closest("li")?.remove();
		} catch {
			t.closest("li")?.remove();
		}
		for (let t of [...e.querySelectorAll("ul")].reverse()) t.querySelector(":scope > li") || t.remove();
	}
}
function m() {
	t ||= requestAnimationFrame(f);
}
function h(e, t, n = !1) {
	let r = e.querySelector(":scope > output");
	r && (r.textContent = t, r.classList.toggle("sds-sr-only", !n));
}
function g(e) {
	let t = e.parentElement;
	if (!t?.matches("sds-tooltip")) return;
	let n = [...t.children].find((t) => t !== e), r = e.dataset.sdsTooltipLabel || e.getAttribute("aria-label") || "Code action";
	n && n.textContent !== r && (n.textContent = r);
}
function _(e) {
	e.parentElement?.querySelector(":scope > [role=\"tooltip\"]")?.hidePopover();
}
function v(e, t) {
	let n = e.querySelector("[data-sds-copy-check]"), r = e.querySelector("[data-sds-copy-icon]");
	if (!t) {
		n?.remove(), r?.removeAttribute("hidden"), e.removeAttribute("data-sds-copied");
		return;
	}
	if (n) return;
	r?.setAttribute("hidden", "");
	let i = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	i.setAttribute("aria-hidden", "true"), i.setAttribute("viewBox", "0 0 24 24"), i.setAttribute("fill", "none"), i.setAttribute("stroke", "currentColor"), i.setAttribute("stroke-width", "2"), i.setAttribute("stroke-linecap", "round"), i.setAttribute("stroke-linejoin", "round"), i.setAttribute("data-sds-copy-check", "");
	let a = document.createElementNS("http://www.w3.org/2000/svg", "path");
	a.setAttribute("d", "M20 6 9 17l-5-5"), i.append(a), e.append(i), e.setAttribute("data-sds-copied", "");
}
function y() {
	for (let e of document.querySelectorAll(".sds-code-block > header > nav > button[data-sds-action], .sds-code-block > header > nav > sds-tooltip > button[data-sds-action]")) {
		let t = e.dataset.sdsTooltipLabel || e.title || e.getAttribute("aria-label") || "Code action";
		if (e.dataset.sdsTooltipLabel = t, e.removeAttribute("title"), e.dataset.sdsAction === "copy-code" && e.querySelector("svg:not([data-sds-copy-check])")?.setAttribute("data-sds-copy-icon", ""), e.parentElement?.matches("sds-tooltip")) {
			e.parentElement.querySelector(":scope > [role=\"tooltip\"]")?.classList.add("sds-code-tooltip-content"), g(e);
			continue;
		}
		let n = document.createElement("sds-tooltip");
		n.setAttribute("size", "auto");
		let r = document.createElement("span");
		r.className = "sds-code-tooltip-content", r.textContent = t;
		let i = e.parentElement, a = e.nextSibling;
		i && (n.append(e, r), i.insertBefore(n, a));
	}
	for (let e of document.querySelectorAll(".sds-code-block > header > .sds-badge[aria-label]")) {
		let t = e.getAttribute("aria-label") || "Code quality";
		if (e.removeAttribute("title"), e.parentElement?.matches("sds-tooltip")) continue;
		let n = document.createElement("sds-tooltip");
		n.setAttribute("size", "auto");
		let r = document.createElement("span");
		r.className = "sds-code-tooltip-content", r.textContent = t;
		let i = e.parentElement, a = e.nextSibling;
		i && (n.append(e, r), i.insertBefore(n, a));
	}
}
function b() {
	for (let e of document.querySelectorAll(".sds-navigation-panel button[data-sds-action=\"navigation-back\"]")) {
		if (e.querySelector("[data-sds-navigation-back-label]")) continue;
		let t = [...e.childNodes].find((e) => e.nodeType === Node.TEXT_NODE && e.textContent?.trim());
		if (!t) continue;
		let n = document.createElement("span");
		n.dataset.sdsNavigationBackLabel = "", n.textContent = t.textContent?.trim() ?? "", t.replaceWith(n);
	}
}
function x() {
	let e = [...document.querySelectorAll(".sds-app-header .site-primary-overview > a")];
	for (let t of document.querySelectorAll(".sds-sidebar .sds-navigation-panel")) {
		let n = t.querySelector(":scope > div > strong");
		if (!n) continue;
		let r = n.textContent?.trim(), i = e.find((e) => e.textContent?.trim() === r);
		if (!i) continue;
		let a = document.createElement("a");
		a.href = i.href, a.dataset.sdsNavigationOverview = "", a.textContent = r ?? "", i.hasAttribute("aria-current") && a.setAttribute("aria-current", i.getAttribute("aria-current")), n.replaceWith(a);
	}
}
function S() {
	for (let e of document.querySelectorAll(".sds-app-header .sds-dropdown-menu > li.site-primary-overview")) {
		let t = e.querySelector(":scope > a");
		if (!t) continue;
		t.dataset.sdsVariant = "cta";
		let n = new URL(t.href, document.baseURI);
		if (n.origin === location.origin && n.pathname === location.pathname ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current"), e.querySelector(":scope > hr.sds-dropdown-divider")) continue;
		let r = document.createElement("hr");
		r.className = "sds-dropdown-divider", e.append(r);
	}
}
function C() {
	document.querySelector(".sds-app-footer > p[data-sds-margin=\"none\"]")?.remove();
}
function w(e, t) {
	let r = n.get(e);
	if (r) {
		r.close();
		return;
	}
	let i = document.createElement("div");
	i.className = "_sds-code-placeholder", i.style.blockSize = `${e.getBoundingClientRect().height}px`;
	let a = getComputedStyle(e);
	i.style.marginBlockStart = a.marginBlockStart, i.style.marginBlockEnd = a.marginBlockEnd, i.setAttribute("aria-hidden", "true"), e.before(i);
	let o = document.createElement("dialog");
	o.className = "sds-dialog", o.setAttribute("aria-label", e.querySelector("header strong")?.textContent || "Code example fullscreen");
	let s = t.getAttribute("aria-label"), c = t.getAttribute("data-sds-tooltip-label"), l = document.documentElement.style.overflow;
	o.addEventListener("close", () => {
		e.removeAttribute("data-sds-code-fullscreen"), i.replaceWith(e), o.remove(), n.delete(e), document.documentElement.style.overflow = l, t.setAttribute("aria-pressed", "false"), s === null ? t.removeAttribute("aria-label") : t.setAttribute("aria-label", s), c === null ? t.removeAttribute("data-sds-tooltip-label") : t.setAttribute("data-sds-tooltip-label", c), g(t), t.focus({ preventScroll: !0 });
	}, { once: !0 }), i.after(o), o.append(e), e.setAttribute("data-sds-code-fullscreen", ""), n.set(e, o), t.setAttribute("aria-pressed", "true"), t.setAttribute("aria-label", "Exit fullscreen"), t.dataset.sdsTooltipLabel = "Exit fullscreen", g(t), document.documentElement.style.overflow = "hidden", o.showModal(), t.focus(), _(t);
}
async function T(e) {
	if (e.hasAttribute("data-sds-leaving")) return;
	e.setAttribute("data-sds-leaving", "");
	let t = e.querySelector(":scope > div");
	if (await Promise.allSettled((t?.getAnimations() ?? []).map((e) => e.finished)), !e.hasAttribute("data-sds-leaving")) return;
	e.removeAttribute("data-sds-leaving"), e.open = !1;
	let n = e.closest("ul");
	n?.setAttribute("data-sds-returning", ""), e.closest(".sds-sidebar")?.matches(":popover-open") && e.querySelector(":scope > summary")?.focus({ preventScroll: !0 }), await Promise.allSettled((n?.getAnimations() ?? []).map((e) => e.finished)), n?.removeAttribute("data-sds-returning");
}
async function E(e) {
	if (!(e.target instanceof Element)) return;
	let t = e.target.closest(".sds-sidebar a[href]")?.closest(".sds-sidebar[popover]:popover-open");
	t && matchMedia("(width < 64rem)").matches && t.hidePopover();
	for (let t of document.querySelectorAll(".sds-app-navigation details[open]:not(.sds-navigation-panel)")) t.contains(e.target) || (t.open = !1);
	let n = e.target.closest("button[data-sds-action]");
	if (!n || n.disabled || e.defaultPrevented) return;
	let a = n.dataset.sdsAction;
	if (a !== "copy-code" && n.closest(".sds-code-block") && _(n), a === "navigation-back") {
		let e = n.closest(".sds-sidebar .sds-navigation-panel");
		e && await T(e);
		return;
	}
	if (a === "toggle-color-scheme") {
		let e = c(n);
		e.dataset.sdsColorScheme = u(e) ? "light" : "dark";
		let t = l(e);
		if (t) try {
			localStorage.setItem(t, e.dataset.sdsColorScheme);
		} catch {}
		d();
		return;
	}
	if (a === "toggle-fullscreen") {
		try {
			document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen();
		} catch {}
		d();
		return;
	}
	let o = n.closest(".sds-code-block");
	if (o) {
		if (a === "toggle-code-fullscreen") w(o, n);
		else if (a === "toggle-complete-code") {
			let e = n.getAttribute("aria-pressed") !== "true";
			n.setAttribute("aria-pressed", String(e));
			for (let t of o.querySelectorAll("[data-sds-code-slot]")) t.hidden = t.dataset.sdsCodeSlot !== (e ? "complete" : "default");
			h(o, "");
		} else if (a === "copy-code") {
			let e = [...o.querySelectorAll("[data-sds-code-slot]:not([hidden]) pre code")], t = e.length ? e.map((e) => e.textContent).join("\n") : o.querySelector("pre code")?.textContent;
			if (!t) return;
			try {
				if (await navigator.clipboard.writeText(t), !n.isConnected) return;
				i.has(n) || i.set(n, {
					label: n.getAttribute("aria-label"),
					tooltipLabel: n.dataset.sdsTooltipLabel || n.getAttribute("aria-label") || "Copy to clipboard"
				});
				let e = i.get(n);
				n.setAttribute("aria-label", "Copied"), n.dataset.sdsTooltipLabel = "Copied", v(n, !0), g(n), h(o, "Code copied."), clearTimeout(r.get(n)), r.set(n, window.setTimeout(() => {
					e.label === null ? n.removeAttribute("aria-label") : n.setAttribute("aria-label", e.label), n.dataset.sdsTooltipLabel = e.tooltipLabel, v(n, !1), g(n), i.delete(n), r.delete(n), h(o, "");
				}, 2e3));
			} catch {
				h(o, "Copy failed. Select the code and copy it manually.", !0);
			}
		}
	}
}
function D() {
	if (e || typeof document > "u") return;
	if (!document.body) {
		document.addEventListener("DOMContentLoaded", D, { once: !0 });
		return;
	}
	e = !0;
	let t = new Set([...document.querySelectorAll("button[data-sds-action=\"toggle-color-scheme\"]")].map(c));
	for (let e of t) {
		let t = l(e);
		if (t && e.dataset.sdsColorScheme === "system") try {
			let n = localStorage.getItem(t);
			(n === "light" || n === "dark") && (e.dataset.sdsColorScheme = n);
		} catch {}
	}
	document.addEventListener("click", (e) => {
		E(e);
	}), document.addEventListener("toggle", (e) => {
		let t = e.target;
		if (t instanceof HTMLElement) {
			if (t instanceof HTMLDetailsElement && t.matches(".sds-sidebar .sds-navigation-panel")) {
				if (t.open) t.querySelector("[data-sds-action=\"navigation-back\"]")?.focus({ preventScroll: !0 });
				else for (let e of t.querySelectorAll(".sds-navigation-panel[open]")) e.open = !1;
			} else if (t.matches(".sds-sidebar[popover]") && "newState" in e && e.newState === "closed") {
				for (let e of t.querySelectorAll(".sds-navigation-panel[open]")) e.removeAttribute("data-sds-leaving"), e.open = !1;
				for (let e of t.querySelectorAll("[data-sds-returning]")) e.removeAttribute("data-sds-returning");
			}
		}
	}, !0), document.addEventListener("keydown", (e) => {
		if (e.key !== "Escape") return;
		let t = document.querySelector("dialog.sds-dialog:modal:has(> .sds-code-block)");
		if (t) {
			e.preventDefault(), t.close();
			return;
		}
		if (e.defaultPrevented || document.querySelector("dialog:modal")) return;
		let n = [...document.querySelectorAll(".sds-app-navigation details[open]")].at(-1);
		if (!n) return;
		e.preventDefault();
		let r = n.closest(".sds-sidebar[popover]:popover-open");
		n.matches(".sds-navigation-panel") && r && matchMedia("(width < 64rem)").matches ? r.hidePopover() : (n.open = !1, n.querySelector(":scope > summary")?.focus());
	}), document.addEventListener("fullscreenchange", d), window.addEventListener("scroll", m, { passive: !0 }), window.addEventListener("resize", m), window.addEventListener("hashchange", m), window.addEventListener("pageshow", m), matchMedia("(prefers-color-scheme: dark)").addEventListener("change", d), new MutationObserver(() => {
		s(), y(), b(), S(), x(), p(), C(), d(), m();
	}).observe(document.documentElement, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["data-sds-root", "data-sds-color-scheme"]
	}), s(), y(), b(), S(), x(), p(), C(), d(), m();
}
D();
export { D as setupSdsDocumentation };
