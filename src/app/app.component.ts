import { Component, ViewChild } from '@angular/core';
import { TodoClockControlComponent } from './todo-clock-control/todo-clock-control.component';
import { TodoClockComponent } from './todo-clock/todo-clock.component';
import { TodoListComponent } from './todo-list/todo-list.component';
import { FooterComponent } from './footer/footer.component';


@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		TodoClockControlComponent,
		TodoClockComponent,
		TodoListComponent,
		FooterComponent
	],
	template: `
	<div id="main_container">
		<div class="main_container_padding">
			<div class="todoapp">
				<app-todo-clock-control (buttonClicked)="onHeaderButtonClicked($event)" />
				<app-todo-clock #todoClock />
				<app-todo-list />
				<app-todo-footer />
			</div>
		</div>
	</div>
	`,
})
export class AppComponent {

	@ViewChild('todoClock') todoClock?: TodoClockComponent;

	private title = 'TodoMVCClock';

	onHeaderButtonClicked($event: { name: string, msg?: string }) {
		if (this.todoClock) {
			switch ($event.name) {
				case 'changeDaytime':
					this.todoClock?.changeDaytime($event.msg ?? 'toggle');
					break;
				case 'toggleDescription':
					this.todoClock?.toggleDescription();
					break;
				case 'toggleSound':
					this.todoClock?.toggleSound();
					break;
			}
			
		}
	}

}

