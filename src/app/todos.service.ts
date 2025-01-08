import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Todo {
  title: string;
  from: number;
  duration: number;
  color: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class TodosService {

  private todosChanged = new Subject<void>();
  public todos: Todo[] = [];

  /*
  // Test data
  constructor() { 
    this.todos = [
      { title: 'test 04-05', from: 4*60, duration: 1*60, color: 'orange', completed: false },
      { title: 'test 08-10', from: 8*60, duration: 2*60, color: 'lightblue', completed: false },
      { title: 'test 10-14', from: 10*60, duration: 4*60, color: 'blue', completed: false },
      { title: 'test 14-17', from: 14*60, duration: 3*60, color: 'darkblue', completed: false },
      { title: 'test 23-02', from: 23*60, duration: 3*60, color: 'orange', completed: false }
    ]; 
    this.todosChanged.next();
  } /**/

  getTodosChanged(): Observable<void> {
    return this.todosChanged.asObservable();
  }

  addItem(title: string, from: number, duration: number, color: string = '#CCCCCC'): void {
    const todo: Todo = {
      title,
      from,
      duration,
      color,
      completed: false,
    };
    this.todos.push(todo);
    this.todosChanged.next();
  }

  removeItem(todo: Todo): void {
    const index = this.todos.indexOf(todo);
    this.todos.splice(index, 1);
    this.todosChanged.next();
  }

  updateItem(todo: Todo): void {
    const index = this.todos.indexOf(todo);
    this.todos.splice(index, 1, todo);
    this.todosChanged.next();
  }

  clearCompleted(): void {
    this.todos = this.todos.filter((todo) => !todo.completed);
    this.todosChanged.next();
  }

  toggleAll(completed: boolean): void {
    this.todos = this.todos.map((todo) => ({ ...todo, completed }));
    this.todosChanged.next();
  }

  getItems(type = 'all'): Todo[] {
    let todos = this.todos;
    switch (type) {
      case 'active':
        todos = todos.filter((todo) => !todo.completed);
        break;
      case 'completed':
        todos = todos.filter((todo) => todo.completed);
        break;
    }

    return todos.sort((a, b) => a.from - b.from);
  }
}

