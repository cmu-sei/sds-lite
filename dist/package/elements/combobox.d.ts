declare const HTMLElementBase: typeof HTMLElement;
export interface SdsComboboxSelectDetail {
    option: HTMLLIElement;
    value: string;
}
export declare class SdsComboboxElement extends HTMLElementBase {
    private input;
    private list;
    private emptyStatus;
    private options;
    private activeOption;
    private suppressOpen;
    private matchQuery;
    private selecting;
    private connection;
    private optionObserver;
    private inputObserver;
    private positioner;
    private emptyPositioner;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private refreshOptions;
    private selectableOptions;
    private setActive;
    private close;
    private clearEmptyStatus;
    private updateEmptyStatus;
    private updateMatches;
    private select;
    private handleFocus;
    private handleInput;
    private handleCompositionEnd;
    private handleKeydown;
    private handleFormReset;
    private handleReposition;
    private handleBlur;
    private handleMouseDown;
    private handleClick;
}
declare global {
    interface HTMLElementTagNameMap {
        'sds-combobox': SdsComboboxElement;
    }
    interface HTMLElementEventMap {
        'sds-select': CustomEvent<SdsComboboxSelectDetail>;
    }
}
export declare function registerSdsCombobox(): void;
export {};
