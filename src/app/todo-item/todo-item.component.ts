import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Todo } from '../todos.service';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './todo-item.component.html'
})
export class TodoItemComponent implements AfterViewChecked {
	@Input({required: true}) todo!: Todo;

	@Output() remove = new EventEmitter<Todo>();
	@Output() update = new EventEmitter<Todo>();

	@ViewChild('todoInputRef') inputRef?: ElementRef;

	public title: string = '';

	public isEditing = false;

	constructor() {  }

	getHours(minutes: number): string {
		return (minutes / 60 < 10 ? '0' : '') + Math.floor(minutes / 60);
	}

	getMinutes(minutes: number): string {
		return (minutes % 60 < 10 ? '0' : '') + (minutes % 60);
	}

	toggleTodo(): void {
		this.todo.completed = !this.todo.completed;
		this.update.emit(this.todo);
	}

	removeTodo(): void {
		this.remove.emit(this.todo);
	}

	startEdit() {
		this.isEditing = true;
		this.title = this.todo.title;
	}

	handleBlur(e: Event) {
		this.isEditing = false;
	}

	handleFocus(e: Event) {
		this.title = this.todo.title;
	}

	updateTodo() {
		if (!this.title) {
			this.remove.emit(this.todo);
		} else {
			this.todo.title = this.title;
			this.update.emit(this.todo);
		}

		this.isEditing = false;
	}

	ngAfterViewChecked(): void {
		if (this.isEditing) {
			this.inputRef?.nativeElement.focus();
		}
	}
}
