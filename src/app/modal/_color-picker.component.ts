import { Component, Input, NgModule, OnInit, HostListener, Output, EventEmitter, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="color-picker">
      <div class="column selected" [style.backgroundColor]="getSelectedColor">
        {{ getSelectedColor }}
      </div>
      <div class="column">
        <div *ngFor="let colorOption of colors; let i = index" class="color-block" [style.backgroundColor]="colorOption" (click)="setSelectedColor(colorOption)">&nbsp;</div>
      </div>
    </div>
  `,
  styles: [`
    .color-picker {
      width: 100%;
      display: flex;

      flex-direction: row;
    }

    .color-picker .column {
      display: flex;
      flex-direction: row;
      width: 50%;
      align-items: center;
      justify-content: left;
    }

    .color-picker .column .color-block {
      height: 40px;
      border: 0;
      flex-grow: 1;
      cursor: pointer;
    }

    .color-picker .column.selected {
      padding-left: 10px;
    }
  `]
})
export class ColorPickerComponent {
  @Input() initValue: any;
  @Input() colors: string[] = [
    '#002880',
    '#73BE84',
    '#B4D6CE',
    '#F5FFD7',
    '#FA2357',
    '#CDCDCD',
  ];

  // Color changed event.
  @Output() colorChanged = new EventEmitter<string>();

  private _selectedColor: string = '#000000';

  /**
   * Initializes the component and sets the initial selected color.
   */
  ngOnInit(): void {
    this._selectedColor = this.initValue;
  }

  /**
   * Color getter.
   *
   * @returns Color value.
   */
  get getSelectedColor(): string {
    return this._selectedColor;
  }

  /**
   * Color setter.
   *
   * @param value Color value.
   */
  setSelectedColor(value: string): void {
    this._selectedColor = value;
    this.colorChanged.emit(value);
  }
}
