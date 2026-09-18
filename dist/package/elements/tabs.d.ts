import type { SdsOrientation, SdsTabsActivation, SdsTabsSize, SdsTabsVariant, SdsTone } from '../generated/interface.js';
declare const HTMLElementBase: typeof HTMLElement;
export interface SdsTabsChangeDetail {
    index: number;
    value: string;
}
export declare class SdsTabsElement extends HTMLElementBase {
    static observedAttributes: string[];
    private tabs;
    private panels;
    private connection;
    private reflectingValue;
    get value(): string;
    set value(value: string);
    get activation(): SdsTabsActivation;
    set activation(value: SdsTabsActivation);
    get orientation(): SdsOrientation;
    set orientation(value: SdsOrientation);
    get size(): SdsTabsSize;
    set size(value: SdsTabsSize);
    get tone(): SdsTone;
    set tone(value: SdsTone);
    get variant(): SdsTabsVariant;
    set variant(value: SdsTabsVariant);
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    private isDisabled;
    private tabValue;
    private reflectValue;
    private select;
    private handleClick;
    private handleKeydown;
}
declare global {
    interface HTMLElementTagNameMap {
        'sds-tabs': SdsTabsElement;
    }
    interface HTMLElementEventMap {
        'sds-change': CustomEvent<SdsTabsChangeDetail>;
    }
}
export declare function registerSdsTabs(): void;
export {};
