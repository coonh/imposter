import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Player } from '../../../core/models/player.model';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
    selector: 'app-player-list',
    standalone: true,
    imports: [IconComponent],
    templateUrl: './player-list.html',
    styleUrl: './player-list.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerList {
    readonly players = input.required<Player[]>();

    getInitials(name: string): string {
        return name.charAt(0).toUpperCase();
    }
}
