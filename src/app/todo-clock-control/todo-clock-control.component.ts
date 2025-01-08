import { Component, inject, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Todo, TodosService } from '../todos.service';
import { ClockSettingsService } from '../clocksettings.service';

@Component({
	standalone: true,
	selector: 'app-todo-clock-control',
	imports: [FormsModule],
	templateUrl: './todo-clock-control.component.html',
})
export class TodoClockControlComponent {
	private clockSettingsService = inject(ClockSettingsService);
	private todosService = inject(TodosService);

  /**
   * Event emitter for button clicks.
   */
  @Output() buttonClicked = new EventEmitter<{ name: string, msg: string }>();

	/**
	 * Emits an event with the name of the button that was clicked, and
	 * an optional message.
	 *
	 * @param {string} name - The name of the button.
	 * @param {string} [msg=''] - An optional message.
	 */
	onButtonClicked({name, msg=''}: {name: string, msg?: string}): void {
		this.buttonClicked.emit({ name, msg: msg });
	}
  
  /**
   * Determines the appropriate CSS class for a button based on the current settings.
   *
   * @param value - The setting name to check.
   * @returns The CSS class name for the button.
   */
  getClass = (value: string): string => {
    const daytime = this.clockSettingsService.get('daytime');
    const soundOn = this.clockSettingsService.get('soundActivated');
    const descriptionActivated = this.clockSettingsService.get('descriptionActivated');

    const isActive = (daytime === value) || 
                     (value === 'soundActivated' && soundOn) || 
                     (value === 'descriptionActivated' && descriptionActivated);

    return isActive ? 
      'todo-clock-control-button todo-clock-control-button-primary' : 
      'todo-clock-control-button todo-clock-control-button-secondary';
  }

	/**
   * Triggers a change in the daytime setting by emitting an event.
   *
   * @param {string} newDaytime - The new daytime value ('AM' or 'PM').
   */
  changeDaytime = (newDaytime: string): void => {
    this.onButtonClicked({name: 'changeDaytime', msg: newDaytime});
  }

	/**
	 * Triggers a toggle in the description setting by emitting an event.
	 */
	toggleDescription = (): void => {
		this.onButtonClicked({name: 'toggleDescription'});
	}

	/**
	 * Triggers a toggle in the sound setting by emitting an event.
	 */
	toggleSound = (): void => {
		this.onButtonClicked({name: 'toggleSound'});
	}

}

