import { Injectable, signal } from '@angular/core';

export interface ToastState {
    message: string;
    type: 'success' | 'error';
    visible: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private timeoutId: ReturnType<typeof setTimeout> | undefined;

    toast = signal<ToastState>({
        message: '',
        type: 'success',
        visible: false
    });

    show(
        message: string,
        type: 'success' | 'error' = 'success',
        durationMs = 3000
    ): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.toast.set({
            message,
            type,
            visible: true
        });

        this.timeoutId = setTimeout(() => {
            this.hide();
        }, durationMs);
    }

    hide(): void {
        this.toast.update(state => ({
            ...state,
            visible: false
        }));
    }
}