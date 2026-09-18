import type { SdsPlacement, SdsToggleDetail, SdsWidth } from '../generated/interface.js';
declare const HTMLElementBase: typeof HTMLElement;
export declare class SdsDropdownElement extends HTMLElementBase {
    static observedAttributes: string[];
    private trigger;
    private menu;
    private items;
    private positioner;
    private connection;
    get open(): boolean;
    set open(value: boolean);
    get placement(): SdsPlacement;
    set placement(value: SdsPlacement);
    get offset(): number;
    set offset(value: number);
    get width(): SdsWidth;
    set width(value: SdsWidth);
    get hideCaret(): boolean;
    set hideCaret(value: boolean);
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    show(): void;
    hide(): void;
    private isSurfaceOpen;
    private collectItems;
    private showAndFocus;
    private hideAndRestoreFocus;
    private handleToggle;
    private handleBeforeToggle;
    private handleTriggerKeydown;
    private handleMenuKeydown;
    private handleMenuClick;
}
declare global {
    interface HTMLElementTagNameMap {
        'sds-dropdown': SdsDropdownElement;
    }
    interface HTMLElementEventMap {
        'sds-toggle': CustomEvent<SdsToggleDetail>;
    }
}
export declare function registerSdsDropdown(): void;
export {};
