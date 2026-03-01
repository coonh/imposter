import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
    },
    {
        path: 'lobby/:code',
        loadComponent: () => import('./features/lobby/lobby').then((m) => m.Lobby),
    },
    {
        path: 'game/:code',
        loadComponent: () => import('./features/game/game').then((m) => m.Game),
    },
    {
        path: 'vote/:code',
        loadComponent: () => import('./features/voting/voting').then((m) => m.Voting),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
