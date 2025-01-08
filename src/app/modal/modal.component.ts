import { Component, inject, Input, NgModule, HostListener, Output, EventEmitter, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TodosService } from '../todos.service';

import { ColorPickerComponent } from './_color-picker.component';
import { NumberPickerComponent } from './_number-picker.component';


// Interface for modal input data.
export interface ModalInput {
  fromHours: number;
  fromMinutes: number;
  fromPeriod: string;
  diffMinutes: number;
}

// Interface for modal data (extended).
export interface ModalData extends ModalInput {
  fromPeriodCount: number;
  durationHours: number;
  durationMinutes: number;
  color: string;
  title: string;
}

@Component({
  selector: 'app-modal',
  imports: [CommonModule, FormsModule, NumberPickerComponent, ColorPickerComponent],
  template: `
    <div id="modal-background" *ngIf="visible" [style.opacity]="0.2" (click)="cancelModal()"></div>

    <div id="modal-content-wrapper" *ngIf="visible">
      <form #form="ngForm" (ngSubmit)="submitModal(form)">
        <div id="modal-title" style="display: none">Add Todo</div>
        <div id="modal-body">

          <div class="color-picker-row">
            <label>Select Color</label>
            <app-color-picker [initValue]="modaldata.color" (colorChanged)="onColorChanged($event)"></app-color-picker>
          </div>

          <div class="title-input-row">
            <label>Title</label>

            <div class="input-error" *ngIf="(title.invalid && title.touched) || (form.submitted && title.invalid)">
              Title is required
            </div>

            <input
              type="text"
              id="title"
              name="title"
              ngModel
              #title="ngModel"
              required
              autofocus
              (input)="onTitleChanged($event)"
              placeholder="Enter a title"
            />
          </div>

          <div class="picker-container-row">

            <!-- picker column 1/3 (start time) -->
            <div class="picker-start">
              <div class="picker-row">
                <label>Start</label>
              </div>
              <div class="picker-row">
                <div class="picker-column">
                  <app-number-picker id="fromHoursPicker" [initValue]="modaldata.fromHours" (counterChanged)="onCounterChanged($event)" [maxValue]="11"></app-number-picker>
                </div>
                <div class="picker-column">
                  <app-number-picker id="fromMinutesPicker" [initValue]="modaldata.fromMinutes" (counterChanged)="onCounterChanged($event)" [maxValue]="59" [stepSize]="15"></app-number-picker>
                </div>
                <div class="picker-column">
                  <app-number-picker id="fromPeriodPicker" [initValue]="modaldata.fromPeriodCount" type="daytime" (counterChanged)="onCounterChanged($event)"></app-number-picker>
                </div>
              </div>
            </div>

            <!-- picker column 2/3 (divider) -->
            <div class="picker-start" style="width: 40px">
              &nbsp;
            </div>

            <!-- picker column 3/3 (duration) -->
            <div class="picker-duration">
              <div class="picker-row">
                <label>Duration</label>
              </div>
              <div class="picker-row">
                <div class="picker-column">
                  <app-number-picker id="durationHoursPicker" [initValue]="modaldata.durationHours" (counterChanged)="onCounterChanged($event)" [maxValue]="23"></app-number-picker>
                </div>
                <div class="picker-column">
                  <app-number-picker id="durationMinutesPicker" [initValue]="modaldata.durationMinutes" (counterChanged)="onCounterChanged($event)" [maxValue]="59" [stepSize]="15"></app-number-picker>
                </div>
              </div>
            </div>

          </div>
        </div>
        <div id="modal-footer">
          <button type="button" class="modal-close-button" (click)="cancelModal()">Cancel</button>
          <button type="submit" class="modal-submit-button">Add</button>
        </div>
      </form>
    </div>`,
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  // Modal visibility flag.
  @Output() visibleChange = new EventEmitter<boolean>();

  // Modal submit event.
  @Output() modalSubmit = new EventEmitter<boolean>();

  // Initial modal data.
  public modaldata: ModalData = {
    fromHours: 0,
    fromMinutes: 0,
    fromPeriod: 'AM',
    diffMinutes: 0,

    fromPeriodCount: 0,
    durationHours: 0,
    durationMinutes: 0,
    color: '#CDCDCD',

    title: '',
  };

  // Counters (i.e. hours, minutes, duration)
  public counters: { [id: string]: number } = {};

  // Todos service.
  private todosService = inject(TodosService);

  // Private visible flag
  private _visible = false;

  // Constructor.
  constructor() { }

  /**
   * Visible getter.
   *
   * @returns Visible flag.
   */
  get visible(): boolean {
    return this._visible;
  }

  /**
   * Visible setter.
   *
   * @param value Visible flag.
   */
  set visible(value: boolean) {
    this._visible = value;
    this.visibleChange.emit(value);
  }

  /**
   * Open modal.
   *
   * @param data Modal data.
   */
	openModal(data: ModalInput) {
		this._visible = true;

		this.modaldata.fromHours = data.fromHours;
		this.modaldata.fromMinutes = data.fromMinutes;
		this.modaldata.fromPeriod = data.fromPeriod;
		this.modaldata.diffMinutes = data.diffMinutes;

		this.modaldata.fromPeriodCount = data.fromPeriod == 'AM' ? 0 : 1;
		this.modaldata.durationHours = Math.floor(data.diffMinutes / 60);
		this.modaldata.durationMinutes = data.diffMinutes % 60;

		// Autofocus on title.
		setTimeout(() => {
			const titleElement = document.getElementById("title");
			if (titleElement) {
				titleElement.focus();
			}
		}, 100);

		console.log('Modal opened');
	}

  /**
   * On counter changed event handler.
   *
   * @param event Counter changed event.
   */
  onCounterChanged(event: { id: string, value: number }) {
    this.counters[event.id] = event.value;
    console.log("counter changed "+event.id+" "+event.value);
    switch (event.id) {
      case 'fromHoursPicker':
        this.modaldata.fromHours = event.value;
        break;
      case 'fromMinutesPicker':
        this.modaldata.fromMinutes = event.value;
        break;
      case 'fromPeriodPicker':
        this.modaldata.fromPeriodCount = event.value;
        this.modaldata.fromPeriod = event.value == 0 ? 'AM' : 'PM';
        break;
      case 'durationHoursPicker':
        this.modaldata.durationHours = event.value;
        this.modaldata.diffMinutes = event.value * 60 + this.modaldata.durationMinutes;
        break;
      case 'durationMinutesPicker':
        this.modaldata.durationMinutes = event.value;
        this.modaldata.diffMinutes =  this.modaldata.durationHours * 60 + event.value;
        break;
    }
  }

  /**
   * On color changed event handler.
   *
   * @param color Color changed event.
   */
  onColorChanged(color: string): void {
    this.modaldata.color = color;
  }

  /**
   * On title changed event handler.
   *
   * @param event Title changed event.
   */
  onTitleChanged(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.modaldata.title = inputElement.value;
  }

  /**
   * Add todo.
   */
  addTodo(): void {
    if (this.modaldata.title) {
      this.todosService.addItem(
        this.modaldata.title,
        this.modaldata.fromPeriodCount * 12 * 60 + this.modaldata.fromHours * 60 + this.modaldata.fromMinutes,
        this.modaldata.durationHours * 60 + this.modaldata.durationMinutes,
        this.modaldata.color
      );
      
      // Reset inputs.
      this.modaldata.title = '';
    }
  }

  /**
   * Submit modal.
   *
   * @param form Form reference.
   */
  submitModal(form: any): void {
    if (form.valid) {
      // Form valid.
      this.addTodo();
      this.modalSubmit.emit(true);
      this._visible = false;
    } else {
      // Form invalid.
      console.log('Form invalid!');
    }
  }

  /**
   * Cancel modal.
   */
  cancelModal(): void {
    this.modalSubmit.emit(true);
    console.log('Modal closed');
    this._visible = false;
  }

}

