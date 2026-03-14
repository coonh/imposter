import { Injectable, signal, NgZone, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

type EventHandler = { event: string; handler: (data: unknown) => void };

@Injectable({ providedIn: 'root' })
export class SocketService {
    private readonly zone = inject(NgZone);
    private socket: Socket | null = null;
    private pendingListeners: EventHandler[] = [];
    private registeredEvents = new Set<string>();
    readonly connected = signal(false);

    connect(): Promise<void> {
        if (this.socket?.connected) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            if (this.socket) {
                // Socket exists but disconnected — reconnect
                this.socket.connect();
            } else {
                this.socket = io(environment.apiUrl, {
                    path: (environment as any).socketPath || '/socket.io', // use explicitly provided path
                });
            }

            this.socket.on('connect', () => {
                this.zone.run(() => {
                    this.connected.set(true);
                    // Re-apply any pending listeners
                    for (const { event, handler } of this.pendingListeners) {
                        this.socket!.on(event, handler);
                    }
                    resolve();
                });
            });

            this.socket.on('disconnect', () => {
                this.zone.run(() => this.connected.set(false));
            });

            // If already connected (unlikely but safe)
            if (this.socket.connected) {
                this.connected.set(true);
                resolve();
            }
        });
    }

    disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
        this.connected.set(false);
        this.pendingListeners = [];
        this.registeredEvents.clear();
    }

    emit<T = unknown>(event: string, data: T, callback?: (response: unknown) => void): void {
        this.socket?.emit(event, data, callback);
    }

    on<T = unknown>(event: string, handler: (data: T) => void): void {
        // Prevent duplicate registrations for the same event
        if (this.registeredEvents.has(event)) {
            this.socket?.off(event);
        }
        this.registeredEvents.add(event);

        const wrappedHandler = (data: T) => {
            this.zone.run(() => handler(data));
        };

        // Store for re-registration on reconnect
        this.pendingListeners = this.pendingListeners.filter((l) => l.event !== event);
        this.pendingListeners.push({ event, handler: wrappedHandler as (data: unknown) => void });

        // Register immediately if socket exists
        if (this.socket) {
            this.socket.on(event, wrappedHandler);
        }
    }

    off(event: string): void {
        this.socket?.off(event);
        this.registeredEvents.delete(event);
        this.pendingListeners = this.pendingListeners.filter((l) => l.event !== event);
    }
}
