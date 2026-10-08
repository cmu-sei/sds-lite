import type { SdsPlacement, SdsTooltipSize } from '../generated/interface.js';
declare const HTMLElementBase: typeof HTMLElement;
export declare class SdsTooltipElement extends HTMLElementBase {
    static observedAttributes: string[];
    private content;
    private positioner;
    private hoverController;
    private connection;
    get placement(): SdsPlacement;
    set placement(value: SdsPlacement);
    get offset(): number;
    set offset(value: number);
    get size(): SdsTooltipSize;
    set size(value: SdsTooltipSize);
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'sds-tooltip': SdsTooltipElement;
    }
}
export declare function registerSdsTooltip(): void;
export {};
