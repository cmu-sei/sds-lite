import type { SdsPlacement, SdsToggleDetail, SdsWidth } from '../generated/interface.js';
declare const HTMLElementBase: typeof HTMLElement;
export declare class SdsPopoverElement extends HTMLElementBase {
    static observedAttributes: string[];
    private content;
    private positioner;
    private hoverController;
    private connection;
    get open(): boolean;
    set open(value: boolean);
    get placement(): SdsPlacement;
    set placement(value: SdsPlacement);
    get offset(): number;
    set offset(value: number);
    get width(): SdsWidth;
    set width(value: SdsWidth);
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    show(): void;
    hide(): void;
    private handleToggle;
}
declare global {
    interface HTMLElementTagNameMap {
        'sds-popover': SdsPopoverElement;
    }
    interface HTMLElementEventMap {
        'sds-toggle': CustomEvent<SdsToggleDetail>;
    }
}
export declare function registerSdsPopover(): void;
export {};
