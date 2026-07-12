import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-svg-icon',
  imports: [],
  template: '<svg:use [attr.href]="href"></svg:use>',
  styles: [''],
})
export class SvgIcon { 

  @Input() icon:string = ''

  get href() {
    return '/assets/svg/${this.icon}.svg#${this.icon}'
  }

}
