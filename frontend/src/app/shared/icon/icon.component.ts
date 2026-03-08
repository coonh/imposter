import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as feather from 'feather-icons';

@Component({
    selector: 'app-icon',
    standalone: true,
    template: '<span [innerHTML]="safeSvg"></span>',
    styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    :host ::ng-deep span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    :host ::ng-deep svg {
      width: 1em;
      height: 1em;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
    }
  `]
})
export class IconComponent implements OnChanges, OnInit {
    @Input({ required: true }) name!: string;
    safeSvg: SafeHtml = '';

    constructor(private sanitizer: DomSanitizer) { }

    ngOnInit(): void {
        this.updateIcon();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['name']) {
            this.updateIcon();
        }
    }

    private updateIcon(): void {
        if (this.name && (feather.icons as any)[this.name]) {
            const svgOriginal = (feather.icons as any)[this.name].toSvg({ width: '1em', height: '1em' });
            this.safeSvg = this.sanitizer.bypassSecurityTrustHtml(svgOriginal);
        }
    }
}
