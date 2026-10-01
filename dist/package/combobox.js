import { FloatingPositioner as e } from "./floating.js";
import { a as t, i as n, r, t as i } from "./internals-CEyyQZKd.js";
//#region src/elements/combobox.ts
var a = typeof HTMLElement > "u" ? class {} : HTMLElement, o = class extends a {
	input = null;
	list = null;
	emptyStatus = null;
	options = [];
	activeOption = null;
	suppressOpen = !1;
	matchQuery = null;
	selecting = !1;
	connection = new i();
	optionObserver = null;
	inputObserver = null;
	positioner = null;
	emptyPositioner = null;
	connectedCallback() {
		this.positioner = null, this.emptyPositioner = null, this.optionObserver?.disconnect(), this.inputObserver?.disconnect(), this.input = null, this.list = null, this.emptyStatus = null, this.options = [], this.activeOption = null, this.suppressOpen = !1, this.matchQuery = null;
		let r = this.connection.connect(this, () => this.connectedCallback(), { childList: !0 }), i = n(this), a = i.find((e) => e instanceof HTMLInputElement && (e.type === "text" || e.type === "search")), o = i.find((e) => e instanceof HTMLUListElement), s = i.find((e) => e instanceof HTMLOutputElement);
		if (!a || !o || i.length !== (s ? 3 : 2) || n(o).some((e) => !(e instanceof HTMLLIElement))) {
			console.warn("<sds-combobox> requires a direct child text or search input, a direct child ul with li options, and optionally one output for empty results.");
			return;
		}
		!a.labels?.length && !a.hasAttribute("aria-label") && !a.hasAttribute("aria-labelledby") && console.warn("<sds-combobox> requires an accessible name on its input."), t(a, "sds-combobox-input");
		let c = t(o, "sds-combobox-list");
		a.setAttribute("role", "combobox"), a.setAttribute("aria-autocomplete", "list"), a.setAttribute("aria-controls", c), a.setAttribute("aria-expanded", "false"), a.removeAttribute("aria-activedescendant"), o.classList.add("sds-combobox-list"), o.setAttribute("role", "listbox"), o.setAttribute("popover", "manual"), o.hidden = !0, this.input = a, this.list = o, this.emptyStatus = s ?? null, this.positioner = new e(a, o, () => "block-end-start", () => void 0), s && (this.emptyPositioner = new e(a, s, () => "block-end-start", () => void 0)), this.refreshOptions(), a.addEventListener("focus", this.handleFocus, { signal: r }), a.addEventListener("input", this.handleInput, { signal: r }), a.addEventListener("compositionend", this.handleCompositionEnd, { signal: r }), a.addEventListener("keydown", this.handleKeydown, { signal: r }), a.addEventListener("blur", this.handleBlur, { signal: r }), o.addEventListener("mousedown", this.handleMouseDown, { signal: r }), o.addEventListener("click", this.handleClick, { signal: r }), a.form?.addEventListener("reset", this.handleFormReset, { signal: r }), window.addEventListener("resize", this.handleReposition, { signal: r }), window.addEventListener("scroll", this.handleReposition, {
			capture: !0,
			signal: r
		}), this.optionObserver = new MutationObserver(() => {
			this.refreshOptions(), !this.suppressOpen && document.activeElement === this.input && this.updateMatches();
		}), this.optionObserver.observe(o, {
			childList: !0,
			subtree: !0,
			characterData: !0,
			attributes: !0,
			attributeFilter: ["aria-disabled", "aria-busy"]
		}), this.inputObserver = new MutationObserver(() => {
			(a.disabled || a.readOnly) && (this.close(), this.clearEmptyStatus());
		}), this.inputObserver.observe(a, {
			attributes: !0,
			attributeFilter: ["disabled", "readonly"]
		});
	}
	disconnectedCallback() {
		this.close(), this.clearEmptyStatus(), this.connection.disconnect(), this.optionObserver?.disconnect(), this.inputObserver?.disconnect(), this.optionObserver = null, this.inputObserver = null, this.input = null, this.list = null, this.emptyStatus = null, this.positioner = null, this.emptyPositioner = null, this.options = [], this.activeOption = null, this.suppressOpen = !1, this.matchQuery = null;
	}
	refreshOptions() {
		if (this.list) {
			this.options = n(this.list).filter((e) => e instanceof HTMLLIElement);
			for (let e of this.options) t(e, "sds-combobox-option"), e.setAttribute("role", "option"), e.hasAttribute("aria-selected") || e.setAttribute("aria-selected", "false");
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
function s() {
	r("sds-combobox", o);
}
//#endregion
export { o as SdsComboboxElement, s as registerSdsCombobox };
