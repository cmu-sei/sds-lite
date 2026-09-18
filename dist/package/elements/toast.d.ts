import type { SdsTone } from '../generated/interface.js';
declare const HTMLElementBase: typeof HTMLElement;
export type SdsToastCloseReason = 'dismiss' | 'programmatic' | 'timeout';
export type SdsToastTone = SdsTone;
export interface SdsNotifyOptions {
    container?: HTMLElement;
    title?: string;
    tone?: SdsToastTone;
    duration?: number;
    persistent?: boolean;
    urgent?: boolean;
}
export declare class SdsToastElement extends HTMLElementBase {
    static observedAttributes: string[];
    private hideTimer;
    get open(): boolean;
    set open(value: boolean);
    get tone(): SdsTone;
    set tone(value: SdsTone);
    get duration(): number;
    set duration(value: number);
    get persistent(): boolean;
    set persistent(value: boolean);
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    show(): void;
    close(reason?: SdsToastCloseReason): void;
    private scheduleAutoHide;
    private clearAutoHide;
    private handleClick;
    private pauseAutoHide;
    private resumeAutoHide;
    private handleFocusOut;
}
declare global {
    interface HTMLElementTagNameMap {
        'sds-toast': SdsToastElement;
    }
    interface HTMLElementEventMap {
        'sds-open': CustomEvent<void>;
        'sds-close': CustomEvent<{
            reason: SdsToastCloseReason;
        }>;
    }
}
export declare function registerSdsToast(): void;
export declare function notify(message: string, options?: SdsNotifyOptions): SdsToastElement;
export {};
