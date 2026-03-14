import { Injectable } from '@angular/core';

export interface SessionData {
    lobbyCode: string;
    playerId: string;
}

export interface UserPreferences {
    name: string;
    character: 'man' | 'woman';
    gameLanguage: 'en' | 'de';
}

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private readonly SESSION_KEY = 'imposter_active_session';
    private readonly PREFS_KEY = 'imposter_user_prefs';

    saveSession(data: SessionData): void {
        try {
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save session to localStorage', e);
        }
    }

    getSession(): SessionData | null {
        try {
            const data = localStorage.getItem(this.SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to read session from localStorage', e);
            return null;
        }
    }

    clearSession(): void {
        try {
            localStorage.removeItem(this.SESSION_KEY);
        } catch (e) {
            console.error('Failed to clear session from localStorage', e);
        }
    }

    savePreferences(prefs: UserPreferences): void {
        try {
            localStorage.setItem(this.PREFS_KEY, JSON.stringify(prefs));
        } catch (e) {
            console.error('Failed to save preferences to localStorage', e);
        }
    }

    getPreferences(): Partial<UserPreferences> {
        try {
            const data = localStorage.getItem(this.PREFS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to read preferences from localStorage', e);
            return {};
        }
    }
}
