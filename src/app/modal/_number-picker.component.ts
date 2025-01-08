import { Component, Input, NgModule, OnInit, HostListener, Output, EventEmitter, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-number-picker',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="picker">
      <button type="button" class="plus" (click)="increment()">
        <i class="fa fa-caret-up" aria-hidden="true"></i>
      </button>
      <div class="display">{{ getCounterXX }}</div>
      <button type="button" class="minus" (click)="decrement()">
        <i class="fa fa-caret-down" aria-hidden="true"></i>
      </button>
    </div>
    `,
    styles: `
    .picker {
      width: 100%;
      text-align: center;
      align-items: center;
    }
    .picker .display {
      padding: 8px 15px;
      width: 20px;
      margin: 3px;
      text-align: center;
      background-color: #CFCFCF;
    }
    .picker button, .picker button:focus {
      width: 100%;
      font-size: 18px;
      padding: 5px 0px;
      cursor: pointer;
      outline: 0;
      box-shadow: none;
    }
    `
  })
  export class NumberPickerComponent implements OnInit {
    @Input() id: string;
    @Input() type: string = "number";
    @Input() initValue: any;
    @Input() maxValue: number = 1;
    @Input() stepSize: number = 1;

    // Counter changed event.
    @Output() counterChanged = new EventEmitter<{ id: string, value: number }>();
  
    private _counter: number = 0;
  
    constructor() { 
      this.id = '';
    }
  
    ngOnInit(): void {
      this._counter = this.initValue;
    }
  
    /**
     * Counter getter.
     *
     * @returns Counter value.
     */
    get getCounter(): number {
      return this._counter;
    }

    /**
     * Counter getter, formatted with leading zero.
     *
     * @returns Counter value.
     */
    get getCounterXX(): string {
      if (this.type == "daytime") {
        return (this._counter) % 2 == 0 ? 'AM' : 'PM';
      } else {
        return (this._counter < 10 ? '0' : '') + this._counter.toString();
      }
    }

    /**
     * Counter setter.
     *
     * @param value Counter value.
     */
    initCounter(value: number): void {
      this._counter = value;
      this.emitCounterChanges();
    }

    /**
     * Counter setter, increment.
     */
    increment(): void {
      this._counter = this._counter + this.stepSize;
      this._counter = this._counter > this.maxValue ? 0 : this._counter;
      this.emitCounterChanges();
    }
     /**
     * Counter setter, decrement.
     */
    decrement(): void {
      this._counter = this._counter - this.stepSize;
      this._counter = this._counter < 0 ? this.maxValue - this.stepSize + 1 : this._counter;
      this.emitCounterChanges();
    }

    /**
     * Emit counter changes.
     */
    emitCounterChanges(): void {
      this.counterChanged.emit({ id: this.id, value: this._counter });
    }
  }
  