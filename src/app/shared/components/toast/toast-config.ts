import { InjectionToken, TemplateRef } from '@angular/core';

export class ToastData {
    type!: ToastType;
    title?: string;
    text?: string;
    template?: TemplateRef<any>;
    templateContext?: {};
    apiUrl?: string;
    noAutoClose?: boolean;
}

export type ToastType = 'warning' | 'info' | 'success' | 'primary' | 'danger';

export interface ToastConfig {
    position?: {
        top: number;
        right: number;
    };
    animation?: {
        fadeOut: number;
        fadeIn: number;
    };
}

export const defaultToastConfig: ToastConfig = {
    position: {
        top: 70,
        right: 20,
    },
    animation: {
        fadeOut: 2500,
        fadeIn: 300,
    },
};

// export const TOAST_CONFIG_TOKEN = new InjectionToken('toast-config');
