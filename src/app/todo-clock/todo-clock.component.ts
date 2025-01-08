import { Component, HostListener, inject, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Observable, Subscription } from 'rxjs';

import { Todo, TodosService } from '../todos.service';
import { ClockSettingsService } from '../clocksettings.service';


import { ModalComponent, ModalInput } from '../modal/modal.component';

// Import D3.js
import * as d3 from 'd3';

/**
 * This class contains all the config values for the clock.
 * @class {ClockConfig}
 */
class ClockConfig {
  public RADIANS = 0.0174532925;
  
  public DEVICE_WIDTH = (window.innerWidth > 0) ? window.innerWidth : screen.width;

  public CANVAS_WIDTH = (this.DEVICE_WIDTH > 550) ? 550 : this.DEVICE_WIDTH;
  public CANVAS_HEIGHT = this.CANVAS_WIDTH;

  public CANVAS_MARGIN = 0;
  public CLOCK_RADIUS = 0.25 * this.CANVAS_WIDTH;

  public HOUR_SCALE = d3.scaleLinear().range([0, 330]).domain([0, 11]);
  public MINUTE_SCALE = d3.scaleLinear().range([0, 330]).domain([0, 44]);
  public SECOND_SCALE = d3.scaleLinear().range([0, 330]).domain([0, 44]);

  public HOUR_HAND_LENGTH = (2 * this.CLOCK_RADIUS) / 3;
  public MINUTE_HAND_LENGTH = this.CLOCK_RADIUS - 10;
  public SECOND_HAND_LENGTH = this.CLOCK_RADIUS - 12;
  public SECOND_HAND_BALANCE = 30;

  public SECOND_TICK_START = this.CLOCK_RADIUS;
  public SECOND_TICK_LENGTH = -1;

  public HOUR_TICK_START = this.CLOCK_RADIUS;
  public HOUR_TICK_LENGTH = -5;

  public SECOND_LABEL_RADIUS = this.CLOCK_RADIUS + 80;
  public SECOND_LABEL_Y_OFFSET = 6;

  public TODO_DESC_RADIUS = this.SECOND_LABEL_RADIUS + 20;

  public MIN_RADIUS_AM = this.CLOCK_RADIUS + 12;
  public MAX_RADIUS_AM = this.CLOCK_RADIUS + 50;

  public MIN_RADIUS_PM = this.CLOCK_RADIUS + 52;
  public MAX_RADIUS_PM = this.CLOCK_RADIUS + 60;

  public MIN_RADIUS_BORDER = this.CLOCK_RADIUS + 50;
  public MAX_RADIUS_BORDER = this.CLOCK_RADIUS + 52;

  public MIN_RADIUS_AM_COLLAPSED = this.MIN_RADIUS_AM;
  public MAX_RADIUS_AM_COLLAPSED = this.MAX_RADIUS_AM - 38;

  public MIN_RADIUS_PM_COLLAPSED = this.MIN_RADIUS_PM - 38;
  public MAX_RADIUS_PM_COLLAPSED = this.MAX_RADIUS_PM - 10;

  public MIN_RADIUS_BORDER_COLLAPSED = this.MIN_RADIUS_BORDER - 38;
  public MAX_RADIUS_BORDER_COLLAPSED = this.MAX_RADIUS_BORDER - 38;
}

@Component({
  selector: 'app-todo-clock',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './todo-clock.component.html',
})
export class TodoClockComponent implements OnInit, AfterViewInit {

  @ViewChild('modal') modal?: ModalComponent;

  selectedHours: number = 12;
  selectedMinutes: number = 30;

  private config = new ClockConfig();

  private location = inject(Location);
  private todosService = inject(TodosService);
  private clockSettingsService = inject(ClockSettingsService);

  private handData: any;

  private face: any;
  private todo_arc: any;

  private timeProgressArc: any;
  private timeProgressMeterFg: any;

  private todoarcAM_360: any;
  private todoarcPM_360: any;

  private tmpMouseMoveCircAM: any;
  private tmpMouseMoveCircPM: any;

  private todocircAM_360: any;
  private todocircPM_360: any;

  private showTime = true;
  private mouseIsDown = false;
  private mousedownAngle: number = 0;
  private mouseupAngle: number = 0;
  private mouseLastMove: number = 0;
  private todocircCount: number = 0;

  private fromMinutes: number = 0;
  private fromHours: number = 0;
  private untilMinutes: number = 0;
  private untilHours: number = 0;
  private diffMinutes: number = 0;

  private SpeechLastHour: number = new Date().getHours();

  constructor() { }

  /**
   * Returns the current daytime setting.
   * @returns {string} The current daytime setting ('AM' or 'PM').
   */
  get getDaytime(): string {
    return this.clockSettingsService.get("daytime")
  }

  /**
   * Returns the clock radius from the configuration.
   * @returns {string} The clock radius as a string.
   */
  get getClockRadius(): string {
    const { CLOCK_RADIUS } = this.config;
    return CLOCK_RADIUS.toString();
  }

  /**
   * Returns the canvas width from the configuration.
   * @returns {string} The canvas width as a string.
   */
  get getCanvasWidth(): string {
    var { CANVAS_WIDTH } = this.config;
    return CANVAS_WIDTH.toString();
  }

  /**
   * Returns the device width as a string.
   * @returns {string} The device width as a string.
   */
  get getDeviceWidth(): string {
    var { DEVICE_WIDTH } = this.config;
    return DEVICE_WIDTH.toString();
  }

  /**
   * Subscription to handle changes to the todos list.
   * Unsubscribed during component destruction.
   */
  private todosSubscription: Subscription = new Subscription();

  /**
   * Initializes the component and subscribes to todos changes.
   * When todos change, redraw the todo circle.
   */
  ngOnInit(): void {
    this.todosSubscription = this.todosService.getTodosChanged().subscribe(() => {
      this.redrawTodos();
    });
  }
  
  /**
   * Unsubscribes from todos changes when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.todosSubscription.unsubscribe();
  }

  /**
   * Called after the view is initialized. Sets up the clock, AM and PM circles,
   * redraws todos, initializes mouse events, and handles window resize events.
   */
  ngAfterViewInit(): void {
    this.initializeClock();
    this.initializeAMCircle();
    this.initializePMCircle();
    this.redrawTodos();
    this.initializeMouseEvents();

    window.addEventListener('resize', this.updateDimensions.bind(this));
  }

  /**
   * Updates the dimensions of the clock when the window is resized.
   * Resets the clock elements, updates the config with the new dimensions,
   * re-initializes the clock, AM and PM circles, redraws the todos, and
   * re-initializes the mouse events.
   */
  private updateDimensions(): void {
    // Reset old clock elements.
    this.resetClock();

    // Reset config with new dimensions.
    this.config = new ClockConfig();

    // Re-init clock.
    this.initializeClock();
    this.initializeAMCircle();
    this.initializePMCircle();
    this.redrawTodos();
    this.initializeMouseEvents();
  }

  /**
   * Event handler for time changes in the time selector.
   * Updates the component's selectedHours and selectedMinutes properties.
   * @param event Time changed event with hours and minutes properties.
   */
  onTimeChanged(event: { hours: number; minutes: number }): void {
    this.selectedHours = event.hours;
    this.selectedMinutes = event.minutes;
  }

  /** 
   * ***************
   * 
   * Initialize Clock and Display Clock Progress.
   * 
   * ***************
   * */

  /**
   * Removes the old clock.
   * This function is called when the window is resized.
   */
  resetClock(): void {
    d3.select("#todo-clock-chart").select("svg").remove();
  }

  /**
   * Initializes the d3 path-objects for clock and timeprogress.
   * This function is called on initialization and when the window is resized.
   */
  initializeClock(): void {
    var {
      RADIANS,
      CLOCK_RADIUS,
      CANVAS_MARGIN,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      HOUR_SCALE,
      MINUTE_SCALE,
      SECOND_SCALE,      
      HOUR_HAND_LENGTH,
      MINUTE_HAND_LENGTH,
      SECOND_HAND_LENGTH,
      SECOND_HAND_BALANCE,
      SECOND_TICK_START,
      SECOND_TICK_LENGTH,
      HOUR_TICK_START,
      HOUR_TICK_LENGTH,
      SECOND_LABEL_RADIUS,
      SECOND_LABEL_Y_OFFSET,
    } = this.config;

    this.handData = [
      {
        type: 'hour',
        value: 0,
        length: -HOUR_HAND_LENGTH,
        scale: HOUR_SCALE,
        percent: 0
      },
      {
        type: 'minute',
        value: 0,
        length: -MINUTE_HAND_LENGTH,
        scale: MINUTE_SCALE,
        percent: 0
      },
      {
        type: 'second',
        value: 0,
        length: -SECOND_HAND_LENGTH,
        scale: SECOND_SCALE,
        balance: SECOND_HAND_BALANCE,
        percent: 0
      }
    ];

    // Update clock data
    this.updateData(new Date());

    /**
     * Code structure from inside the clock to outside.
     */

    // Create SVG-canvas.
    var svg = d3.select("#todo-clock-chart").append("svg")
      .attr("width", CANVAS_WIDTH)
      .attr("height", CANVAS_HEIGHT);

    // Set clock / face position on canvas.
    this.face = svg.append('g')
      .attr('id', 'clock-face')
      .attr('transform', 'translate(' + (0.5 * CANVAS_WIDTH) + ',' + (0.5 * CANVAS_HEIGHT) + ')');

    // Create the black inner circle.
    var innercircle = this.face.append('g').attr('id', 'innercircle');
    var circleData = [
      { "cx": 0, "cy": 0, "radius": CLOCK_RADIUS - 20, "inner_radius": 50 }
    ];
    innercircle.selectAll('.inner-circle')
      .data(circleData).enter()
      .append('circle')
      .attr('class', 'inner-circle')
      .attr("cx", function (d: any) { return d.cx; })
      .attr("cy", function (d: any) { return d.cy; })
      .attr("r", function (d: any) { return d.radius; });

    // Add three rows of white text (day, time, date) inside the innercircle.
    innercircle.append("text")
              .attr("dy", ".35em")
              .style("text-anchor", "middle")
              .attr("class", "inner-circle-time")
              .text(function(d: Text) { 
                var t = new Date();
                return t.getHours()+':'+t.getMinutes(); 
    });
    innercircle.append("text")
              .attr("dy", "-2.0em")
              .style("text-anchor", "middle")
              .attr("class", "inner-circle-desc-top")
              .text(function(d: Text) { 
                return 'init txt top'; 
    });
    innercircle.append("text")
              .attr("dy", "3.0em")
              .style("text-anchor", "middle")
              .attr("class", "inner-circle-desc-bottom")
              .text(function(d: Text) { 
                return 'init txt bottom'; 
    });

    // Leave some space betweeen innercircle and clock tick stripes.

    // Mark every 15 minutes on INNER circle.
    this.face.selectAll('.clock-second-tick')
      .data(d3.range(0, 60)).enter()
      .append('line')
      .attr('class', 'clock-second-tick')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', SECOND_TICK_START)
      .attr('y2', SECOND_TICK_START + SECOND_TICK_LENGTH)
      .attr('transform', (d: number) => {
        return 'rotate(' + SECOND_SCALE(d) + ')';
      });

    // Mark every hour on INNER circle (inner circle).
    this.face.selectAll('.clock-hour-tick')
      .data(d3.range(0, 12)).enter()
      .append('line')
      .attr('class', 'clock-hour-tick')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', HOUR_TICK_START)
      .attr('y2', HOUR_TICK_START + HOUR_TICK_LENGTH)
      .attr('transform', (d: number) => {
        return 'rotate(' + HOUR_SCALE(d) + ')';
      });

    // Mark every hour on OUTER circle.
    this.face.selectAll('.clock-hour-tick-outer')
      .data(d3.range(0,12)).enter()
      .append('line')
      .attr('class', 'clock-hour-tick')
      .attr('x1',0)
      .attr('x2',0)
      .attr('y1',HOUR_TICK_START + 65 )
      .attr('y2',HOUR_TICK_START + 65 + HOUR_TICK_LENGTH)
      .attr('transform', (d: number) => {
        return 'rotate(' + HOUR_SCALE(d) + ')';
      });
      
    // Add hour labels to OUTER circle.
    this.face.selectAll('.clock-hour-label')
      .data(d3.range(1,13)).enter()
      .append('text')
      .attr('class', 'clock-hour-label')
      .attr('text-anchor','middle')
      .attr('x', (d: number) => {
        return SECOND_LABEL_RADIUS*Math.sin(HOUR_SCALE(d)*RADIANS);
      })
      .attr('y', (d: number) => {
        return -SECOND_LABEL_RADIUS*Math.cos(HOUR_SCALE(d)*RADIANS) + SECOND_LABEL_Y_OFFSET;
      })
      .text( (d: number) => {
        return d;
      });

    // Add the time progress bar around inner circle (show time as stripe).
    this.timeProgressArc = d3.arc()
      .startAngle(0)
      .innerRadius(CLOCK_RADIUS)
      .outerRadius(CLOCK_RADIUS + 10);
    var timeProgressMeter = this.face.append('g')
      .attr('class', 'time-progress-meter');
    // Background of progres meter (360 degree).
    var timeProgressMeterBg = timeProgressMeter.append('path')
      .attr('class', 'background')
      .attr('d', this.timeProgressArc.endAngle(2 * Math.PI) as any);
    // Foreground of progress meter (actual progress).
    this.timeProgressMeterFg = timeProgressMeter.append('path')
      .attr('class', 'foreground')

    // Refresh clock every 500ms.
    setInterval(() => {
      const date = new Date();
      this.updateData(date);
      this.updateClock(date);
      this.playSpeechAlert(date);
    }, 500);
  }

  /**
   * Updates the clock's data based on the current date.
   * Calculates the hour, minute, and second values and percentages.
   * @param date The current date object used to extract time information.
   */
  updateData(date: Date): void {
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours();

    this.handData = [
      {
        type: 'hour',
        value: (hours % 12) + minutes / 60,
        percent: (Math.PI * 2 / 12) * ((hours % 12) + minutes / 60)
      },
      {
        type: 'minute',
        value: minutes,
        percent: (Math.PI * 2 / 60) * minutes
      },
      {
        type: 'second',
        value: seconds,
        percent: (Math.PI * 2 / 60) * seconds
      }
    ];
  }

  /**
   * Updates the clock text and progress bar based on the current date.
   * Displays the day of the week, time, and date in the inner circle.
   * Also updates the clock's progress meter based on the hour hand position.
   * @param date The current date object used to extract time information.
   */
  updateClock(date: Date): void {
    // Update Clock-Text.
    // Do not show time, during selection.
    if (this.showTime) {
      d3.select('#innercircle').selectAll('.inner-circle-desc-top').text(() => { 
        const daysOfWeek = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
        return daysOfWeek[date.getDay()];
      });

      d3.select('#innercircle').selectAll('.inner-circle-time').text(() => { 
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
      });
      
      d3.select('#innercircle').selectAll('.inner-circle-desc-bottom').text(() => { 
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return (day < 10 ? '0' : '') + day + '.' + (month < 10 ? '0' : '') + month + '.' + year;
      });
    }

    // Update Clock-Progress.
    this.timeProgressMeterFg.attr('d', this.timeProgressArc.endAngle(this.handData[0].percent));
  }

  /**
   * Initializes the AM circle (todo-am-circle) around the clock face.
   * Sets up the 360-degree arc for new circle around the time progress circle.
   * Adds circle to canvas and background-path to circle.
   * Also adds marks / dividers each 15 minutes around circle.
   */
  initializeAMCircle() {
    const {
      SECOND_SCALE,
      HOUR_SCALE,
      MIN_RADIUS_AM,
      MAX_RADIUS_AM,
      CLOCK_RADIUS
    } = this.config;

    // todo-am-circle
    // Create 360-degree arc for new circle around time progress circle.
    this.todoarcAM_360 = d3.arc()
      .startAngle(0)
      .innerRadius(MIN_RADIUS_AM)
      .outerRadius(MAX_RADIUS_AM);  
    // Add circle to canvas.
    this.todocircAM_360 = this.face.append('g')
      .attr('class', 'todo-circ-background-am');
    // Add background-path to circle.
    this.todocircAM_360.append('path')
      .attr('class', 'background')
      .attr('d', this.todoarcAM_360.endAngle(2 * Math.PI));
    // Add marks / divider each 15 minutes around circle.
    this.todocircAM_360.selectAll('.todo-second-stripes')
      .data(d3.range(0,60)).enter()
      .append('line')
      .attr('stroke','#FFFFFF')
      .attr('stroke-width', '2')
      .attr('stroke-opacity', 0.4)
      .attr('x1',0)
      .attr('x2',0)
      .attr('y1', MIN_RADIUS_AM)
      .attr('y2', MAX_RADIUS_AM)
      .attr('transform', (d:any) => {
        return 'rotate(' + SECOND_SCALE(d) + ')';
      });    
  }

  /**
   * Initializes the PM circle (todo-pm-circle) around the clock face.
   * Sets up the 360-degree arc for new circle around the AM circle.
   * Adds circle to canvas and background-path to circle.
   * Also adds marks / dividers each 15 minutes around circle.
   */
  initializePMCircle() {
    const {
      SECOND_SCALE,
      HOUR_SCALE,
      MIN_RADIUS_PM,
      MAX_RADIUS_PM,
      CLOCK_RADIUS
    } = this.config;

    // todo-pm-circle
    // Create 360-degree arc for new circle around todo-am-circle.
    this.todoarcPM_360 = d3.arc()
      .startAngle(0)
      .innerRadius(MIN_RADIUS_PM)
      .outerRadius(MAX_RADIUS_PM); 
    // Add circle to canvas.
    this.todocircPM_360 = this.face.append('g')
      .attr('class', 'todo-circ-background-pm');
    // Add background-path to circle.
    this.todocircPM_360.append('path')
      .attr('class', 'background')
      .attr('d', this.todoarcPM_360.endAngle(2 * Math.PI)); 
    // Add marks / divider each 15 minutes around circle.
    this.todocircPM_360.selectAll('.todo-second-stripes')
      .data(d3.range(0,60)).enter()
      .append('line')
      .attr('stroke','#FFFFFF')
      .attr('stroke-width', '2')
      .attr('stroke-opacity', 0.4)
      .attr('x1',0)
      .attr('x2',0)
      .attr('y1', MIN_RADIUS_PM)
      .attr('y2', MAX_RADIUS_PM)
      .attr('transform', (d:any) => {
        return 'rotate(' + SECOND_SCALE(d) + ')';
      });    
  }

  /**
   * Redraws the Todo Circles after changes in the Todo List.
   * First calculates the duration and angles of each Todo and then
   * calls the function to draw the circles.
   */
  redrawTodos() {
    var helper: { from: number, duration: number } = {
      from: 0,
      duration: 0
    };

    var dataAM: number[]   = [];
    var colorsAM: string[] = [];
    var descriptionsAM: string[]   = [];

    var dataPM: number[]   = [];
    var colorsPM: string[] = [];
    var descriptionsPM: string[]   = [];

    console.log("redrawTodos()");

    var todosArray = this.todosService.getItems();

    // Loop through todos.
    for (var i = 0; i < todosArray.length; i++) {
      var todo = todosArray[i];
      var color = (todo.completed == false ? todo.color : '#CCCCCC');

      var fromAngle = this.getAngleFromMinutes(todo.from);
      var untilAngle = this.getAngleFromMinutes(todo.from + todo.duration);
      
      // First todo starts later than 0:00 AM, leave placeholder.
      if (i == 0 && fromAngle > 0) {
        dataAM.push(Math.min(todo.from, 12*60));
        colorsAM.push('transparent');
        descriptionsAM.push('');
      }

      // Todo ends before 12:00 AM.
      if (untilAngle <= 360) {
        // AM Circle

        dataAM.push(todo.duration);
        colorsAM.push(color);
        descriptionsAM.push(todo.title);

        // if there is another todo, which is also before 12:00 AM.
        if ((i + 1) < todosArray.length && todosArray[i + 1].from < 12 * 60) {
          // Add empty placeholder until beginning of next todo.
          helper.duration = todosArray[i + 1].from - todo.from - todo.duration;
        } else {
          // Add empty placeholder until 12:00 AM.
          helper.duration = (12 * 60) - todo.from - todo.duration;
        }
        // Add placeholder to AM circle as before defined.
        dataAM.push(helper.duration);
        colorsAM.push('transparent');
        descriptionsAM.push('');
      }

      if (untilAngle > 360) {
        // PM Circle

        // Todo starts before 12:00 AM and ends after 12:00 AM.
        if (fromAngle < 360) {
          // Add 1st part of todo to AM circle.
          dataAM.push((12 * 60) - todo.from);
          colorsAM.push(color);
          descriptionsAM.push(todo.title);

          // Add 2nd part of todo to PM circle.
          dataPM.push(todo.duration + todo.from - (12 * 60));
          colorsPM.push(color);
          descriptionsPM.push(todo.title);
        } else {
          // Todo starts later than 12:00 AM and there is no other todo before, leave placeholder
          // (i.e. its the first todo or there ist no todo between 12:00 AM and this todo).
          if (fromAngle > 360 && (i == 0 || (todosArray[i - 1].from + todosArray[i - 1].duration <= (60 * 12)))) {
            dataPM.push(todo.from - 12 * 60);
            colorsPM.push('transparent');
            descriptionsPM.push('');
          }

          // Add todo to PM Circle, limit to 12:00 PM.
          dataPM.push(Math.min(todo.duration, (2 * 12 * 60) - todo.from));
          colorsPM.push(color);
          descriptionsPM.push(todo.title);

          // Todo ends later than 12:PM.
          if (untilAngle > 720) {
            // Add 2nd part of todo to AM circle.
            // The 1st part was already added to the PM circle with a limit to 12:00 PM.
            // Calculate overflow from 12:00 PM until end of todo (AM).
            let overflow = todo.from + todo.duration - (2 * 12 * 60);
            if (dataAM.length > 0) {
                if (dataAM[0] > overflow) {
                  let old_duration = dataAM[0];
                  // Remove old AM placeholder.
                  dataAM.shift();
                  colorsAM.shift();
                  descriptionsAM.shift();

                  // Insert overflow of todo to AM circle at position 0, remove 0 elements.
                  dataAM.splice(0, 0, overflow);
                  colorsAM.splice(0, 0, color);
                  descriptionsAM.splice(0, 0, todo.title);

                  // Insert remaining AM placeholder at position 1, remove 0 elements.
                  dataAM.splice(1, 0, old_duration - overflow);
                  colorsAM.splice(1, 0, 'transparent');
                  descriptionsAM.splice(1, 0, '');
                } else {
                  console.log("Overflow of existing data on AM!")
                }
            }
          }
        }

        // Todo starts after 12:00 AM and ends before 12:00 PM, leave placeholder.
        if (untilAngle <= 720) {
          helper.from = todo.from + todo.duration;

          // If there is another todo, which is also before 12:00 PM.
          if ((i + 1) < todosArray.length) {
            // Add empty placeholder until beginning of next todo.
            helper.duration = todosArray[i + 1].from - helper.from;
          } else {
            // Add empty placeholder until 12:00 PM.
            helper.duration = (2 * 12 * 60) - helper.from;
          }
          // Add placeholder to PM circle as before defined.
          dataPM.push(helper.duration);
          colorsPM.push('transparent');
          descriptionsPM.push('');
        }
      }
    } // End for-loop

    // Clear temporary mouse move AM Circle.
    if (this.tmpMouseMoveCircAM != null && !this.tmpMouseMoveCircAM.empty()) {
      this.tmpMouseMoveCircAM.remove();
    }

    // Clear temporary mouse move PM Circle.
    if (this.tmpMouseMoveCircPM != null && !this.tmpMouseMoveCircPM.empty()) {
      this.tmpMouseMoveCircPM.remove();
    }

    // Redraw circles.
    this.drawTodoCircles(dataAM, colorsAM, dataPM, colorsPM);

    // Redraw descriptions.
    this.drawDescriptions(dataAM, descriptionsAM, colorsAM, dataPM, descriptionsPM, colorsPM);

    // Initiate transition.
    this.transition();
  }

  /**
   * Draws the todo circles on the clock face. This involves creating the AM, PM, 
   * and border circles based on the provided data and colors. The radius of these 
   * circles is adjusted based on the current daytime setting.
   * 
   * @param dataAM - Array of numbers representing the AM todo segments.
   * @param colorsAM - Array of strings representing the colors for AM segments.
   * @param dataPM - Array of numbers representing the PM todo segments.
   * @param colorsPM - Array of strings representing the colors for PM segments.
   */
  drawTodoCircles(
    dataAM: number[],
    colorsAM: string[],
    dataPM: number[],
    colorsPM: string[]
  ) {
    const {
      MIN_RADIUS_AM,
      MAX_RADIUS_AM,
      MIN_RADIUS_PM,
      MAX_RADIUS_PM,
      MIN_RADIUS_BORDER,
      MAX_RADIUS_BORDER,
      MIN_RADIUS_AM_COLLAPSED,
      MAX_RADIUS_AM_COLLAPSED,
      MIN_RADIUS_PM_COLLAPSED,
      MAX_RADIUS_PM_COLLAPSED,
      MIN_RADIUS_BORDER_COLLAPSED,
      MAX_RADIUS_BORDER_COLLAPSED
    } = this.config;

    // Get selected daytime of clock.
    const daytime = this.clockSettingsService.get('daytime');
    const circleDimensions = daytime === 'PM' ? {
      MIN_RADIUS_AM: MIN_RADIUS_AM_COLLAPSED,
      MAX_RADIUS_AM: MAX_RADIUS_AM_COLLAPSED,
      MIN_RADIUS_PM: MIN_RADIUS_PM_COLLAPSED,
      MAX_RADIUS_PM: MAX_RADIUS_PM_COLLAPSED,
      MIN_RADIUS_BORDER: MIN_RADIUS_BORDER_COLLAPSED,
      MAX_RADIUS_BORDER: MAX_RADIUS_BORDER_COLLAPSED
    } : {
      MIN_RADIUS_AM,
      MAX_RADIUS_AM,
      MIN_RADIUS_PM,
      MAX_RADIUS_PM,
      MIN_RADIUS_BORDER,
      MAX_RADIUS_BORDER
    };

    this.face.selectAll(".todo-circ-am, .todo-circ-border, .todo-circ-pm").remove();

    this.face.selectAll(".todo-circ-am")
      .data(this.getPieData(dataAM))
      .enter().append("g")
      .attr("class", "todo-circ-am")
      .append("path")
      .attr("fill", (d: any, i: any) => colorsAM[i])
      .attr("d", d3.arc()
        .innerRadius(circleDimensions.MIN_RADIUS_AM)
        .outerRadius(circleDimensions.MAX_RADIUS_AM));

    this.face.selectAll(".todo-circ-border")
      .data(this.getPieData([1]))
      .enter().append("g")
      .attr("class", "todo-circ-border")
      .append("path")
      .attr("d", d3.arc()
        .innerRadius(circleDimensions.MIN_RADIUS_BORDER)
        .outerRadius(circleDimensions.MAX_RADIUS_BORDER));

    this.face.selectAll(".todo-circ-pm")
      .data(this.getPieData(dataPM))
      .enter().append("g")
      .attr("class", "todo-circ-pm")
      .append("path")
      .attr("fill", (d: any, i: any) => colorsPM[i])
      .attr("d", d3.arc()
        .innerRadius(circleDimensions.MIN_RADIUS_PM)
        .outerRadius(circleDimensions.MAX_RADIUS_PM));
  }

  /**
   * Draws description labels around todo circles.
   * 
   * @param dataAM - Array of numbers representing the AM todo segments.
   * @param descriptionsAM - Array of strings representing the descriptions for AM segments.
   * @param colorsAM - Array of strings representing the colors for AM segments.
   * @param dataPM - Array of numbers representing the PM todo segments.
   * @param descriptionsPM - Array of strings representing the descriptions for PM segments.
   * @param colorsPM - Array of strings representing the colors for PM segments.
   */
  drawDescriptions(
    dataAM: number[],
    descriptionsAM: string[], 
    colorsAM: string[], 
    dataPM: number[], 
    descriptionsPM: string[],
    colorsPM: string[]
  ) {
    var {
      RADIANS,
      TODO_DESC_RADIUS,
    } = this.config;

    // Todo Description Labels.
    this.face.selectAll(".todo-desc-label-am").remove();
    this.face.selectAll(".todo-desc-label-pm").remove();

    // Add description labels around todo circ.
    var descriptionLabels = this.face.append('g').attr('id', 'todo-desc-labels');
    var descriptionActivated = this.clockSettingsService.get('descriptionActivated');
    if (!descriptionActivated) {
      descriptionLabels.style("opacity", 0);
    }

    // Add Labels for todo description (AM).
    descriptionLabels.selectAll('.todo-desc-label')
      .data(this.getPieData(dataAM))
      .enter()
      .append('text')
      .attr('class', 'todo-desc-label-am')
      .attr('text-anchor', 'middle')
      .attr('x', (d: any) => {
        return TODO_DESC_RADIUS * Math.sin(0.5 * (d.startAngle + d.endAngle));
      })
      .attr('y', (d: any) => {
        return -TODO_DESC_RADIUS * Math.cos(0.5 * (d.startAngle + d.endAngle));
      })
      .text((d: any, i: any) => {
        return descriptionsAM[i];
      }).attr('transform', (d: any) => {
        let rotateAngle = 0.5 * (d.startAngle + d.endAngle);
        rotateAngle += (((rotateAngle > 90 * RADIANS) && (rotateAngle <= 250 * RADIANS)) ? 180 * RADIANS : 0);

        return 'rotate(' + rotateAngle / RADIANS
          + ',' +
          TODO_DESC_RADIUS * Math.sin(0.5 * (d.startAngle + d.endAngle))
          + ',' +
          -TODO_DESC_RADIUS * Math.cos(0.5 * (d.startAngle + d.endAngle))
          + ')';
      });

    // Add Labels for todo description (PM).
    descriptionLabels.selectAll('.todo-desc-label')
      .data(this.getPieData(dataPM))
      .enter()
      .append('text')
      .attr('class', 'todo-desc-label-pm')
      .attr('text-anchor', 'middle')
      .attr('x', (d: any) => {
        return TODO_DESC_RADIUS * Math.sin(0.5 * (d.startAngle + d.endAngle));
      })
      .attr('y', (d: any) => {
        return -TODO_DESC_RADIUS * Math.cos(0.5 * (d.startAngle + d.endAngle));
      })
      .style("opacity", 1)
      .text((d: any, i: any) => {
        return descriptionsPM[i];
      })
      .attr('transform', (d: any) => {
        let rotateAngle = 0.5 * (d.startAngle + d.endAngle);
        rotateAngle += (((rotateAngle > 90 * RADIANS) && (rotateAngle <= 250 * RADIANS)) ? 180 * RADIANS : 0);

        return 'rotate(' + rotateAngle / RADIANS
          + ',' +
          TODO_DESC_RADIUS * Math.sin(0.5 * (d.startAngle + d.endAngle))
          + ',' +
          -TODO_DESC_RADIUS * Math.cos(0.5 * (d.startAngle + d.endAngle))
          + ')';
      });

    // Get selected daytime of clock.
    var daytime = this.clockSettingsService.get('daytime');

    // Fade out wrong daytime labels.
    if (daytime == 'PM') {
      this.face.selectAll(".todo-desc-label-am").style("opacity", 0);
    } else {
      this.face.selectAll(".todo-desc-label-pm").style("opacity", 0);
    }
  }

  /** 
   * *****************
   * 
   * MouseEvents
   * 
   * *****************
   * **/

  /**
   * Initialize mouse events for clock.
   * 
   * Listens for:
   *  - mousedown: Start mouse move event
   *  - mousemove: Update clock time on mouse move
   *  - mouseup: End mouse move event
   *  - touchmove: Update clock time on touch move
   *  - touchend: End touch move event
   * 
   * Also disables scroll on touch move and enables it on touch end.
   */
  initializeMouseEvents() {
    this.diffMinutes = 0;

    this.face.on("mousedown", (event: MouseEvent) => { 
      this.mouseDown(event, d3.pointer(event, this.face.node())); 
      this.showTime = false;
    });

    d3.select("#todo-clock-chart").on("mousemove", (event: MouseEvent) => { 
      this.mouseMove(d3.pointer(event, this.todocircAM_360.node())); 
    });

    d3.select("#todo-clock-chart").on("mouseup", (event: MouseEvent) => { 
      this.mouseUp(event);  
      this.showTime = true;
    });

    // TODO: Check touchmoves.
    this.todocircAM_360.on("touchmove", (event: MouseEvent) => { 
      if(this.diffMinutes==0){
        this.mouseDown(event, d3.pointer(event, this.face.node())); 
      }
      this.disableScroll();
      this.mouseMove(d3.pointer(event, this.face.node())); 
    });     

    // TODO: Check touchmoves.
    this.todocircAM_360.on("touchend", (event: MouseEvent) => {
      this.mouseUp(event); 
      this.enableScroll(); 
      this.showTime = true;
    });
  }

  /**
   * Handles the mouse down event on the clock face. Initializes the state for tracking
   * mouse movements, calculates the angle based on the initial pointer coordinates, and
   * creates temporary paths for visual feedback during the mouse move operation.
   * 
   * @param event - The mouse event
   * @param pointerCoordinates - The coordinates of the mouse pointer on the clock face.
   */
  mouseDown(event: MouseEvent, pointerCoordinates: any) {
    if (event.defaultPrevented) return;
    this.mouseIsDown = true;

    const initialAngle = this.getAngle(pointerCoordinates);
    this.mousedownAngle = initialAngle;

    this.tmpMouseMoveCircAM = this.todocircAM_360.append('path')
      .attr('class', 'tmp-mouse-move-circ')

    this.tmpMouseMoveCircPM = this.todocircAM_360.append('path')
      .attr('class', 'tmp-mouse-move-circ')
  }

  /**
   * Handles the mouse move event on the clock face. Updates the AM and PM circles based on
   * the mouse movement, calculates time intervals, and updates the inner circle text
   * to display the selected time range.
   * 
   * @param pointerCoordinates - The coordinates of the mouse pointer on the clock face.
   */
  mouseMove(pointerCoordinates: any) {
    if (this.mouseIsDown) {
      const initialAngle = this.mousedownAngle;
      const currentAngle = this.getAngle(pointerCoordinates);

      const steps = (30 / 24 / 60) * 360;

      let fromAngle = Math.floor(initialAngle / steps) * steps;
      let untilAngle = Math.ceil(currentAngle / steps) * steps;

      // If the current angle is less than the initial angle, add 360.
      // Happens when selecting from AM to PM.
      if (untilAngle < fromAngle) {
        untilAngle += 360;
      }

      const daytime = this.clockSettingsService.get('daytime');

      if (untilAngle <= 360 || daytime === 'PM') {
        // Draw only on AM or only on PM circle.
        this.tmpMouseMoveCircAM.attr('d', this.todoarcAM_360.startAngle(fromAngle / 360 * 2 * Math.PI))
                               .attr('d', this.todoarcAM_360.endAngle(untilAngle / 360 * 2 * Math.PI));
        this.tmpMouseMoveCircPM.attr('d', this.todoarcPM_360.startAngle(0))
                               .attr('d', this.todoarcPM_360.endAngle(0));
      } else {
        // Draw 1st part on AM circle and 2nd part on PM circle.
        this.tmpMouseMoveCircAM.attr('d', this.todoarcAM_360.startAngle(fromAngle / 360 * 2 * Math.PI))
                               .attr('d', this.todoarcAM_360.endAngle(360 / 360 * 2 * Math.PI));
        this.tmpMouseMoveCircPM.attr('d', this.todoarcPM_360.startAngle(0))
                               .attr('d', this.todoarcPM_360.endAngle((untilAngle - 360) / 360 * 2 * Math.PI));
      }

      // Update text inside circle on mousemove.
      const now = new Date().getTime();
      if (now - this.mouseLastMove >= 0) {
        this.mouseLastMove = now;

        const fromAllMinutes = Math.round(this.getMinutesFromAngle(fromAngle));
        this.fromHours = Math.floor(fromAllMinutes / 60);
        this.fromMinutes = Math.round(fromAllMinutes % 60);

        this.diffMinutes = Math.round(this.getMinutesFromAngle(untilAngle - fromAngle));

        const untilAllMinutes = Math.round(this.getMinutesFromAngle(untilAngle));
        this.untilHours = Math.floor(untilAllMinutes / 60);
        this.untilMinutes = Math.ceil(untilAllMinutes % 60);

        d3.select('#innercircle').selectAll('.inner-circle-desc-top').text(() => {
          return `${this.fromHours < 10 ? '0' : ''}${this.fromHours}:${this.fromMinutes < 10 ? '0' : ''}${this.fromMinutes} am`;
        });

        d3.select('#innercircle').selectAll('.inner-circle-time').text(() => {
          return `${Math.floor(this.diffMinutes / 60)}h ${Math.floor(this.diffMinutes % 60)}m`;
        });

        d3.select('#innercircle').selectAll('.inner-circle-desc-bottom').text(() => {
          return `${this.untilHours < 10 ? '0' : ''}${this.untilHours}:${this.untilMinutes < 10 ? '0' : ''}${this.untilMinutes} am`;
        });
      }
    }
  }

  /**
   * 
   * Handles the mouse up event on the clock face.
   * 
   * If the mouse was down and now isn't any more, it checks if the selected time range is larger than 15 minutes.
   * If it is, it opens the modal to add a new todo.
   * 
   * @param event Mouse up event.
   */
  mouseUp(event: MouseEvent){
    if (event.defaultPrevented) return;

    // Mark mousedown to false.
    this.mouseIsDown = false;

    if(this.diffMinutes >= 15){
      // Open modal to add new todo.
      const modalData: ModalInput = {
        fromHours: this.fromHours % 12,
        fromMinutes: this.fromMinutes,
        fromPeriod: this.clockSettingsService.get('daytime'),
        diffMinutes: this.diffMinutes,
      };
      this.modal?.openModal(modalData);
    }

    // Remove temporary mark on todo circ.
    this.tmpMouseMoveCircAM.remove();
    this.tmpMouseMoveCircPM.remove();
    this.redrawTodos();
  }

  /**
   * Handles the submission of the modal form.
   * Resets the time difference to zero and triggers a redraw of the todos.
   * 
   * @param success - Indicates whether the modal submission was successful.
   */
  onModalSubmit(success: boolean): void {
    this.diffMinutes = 0;
    this.redrawTodos();
  }

  /** 
   * ****************************
   * 
   * Helper Functions
   * 
   * ****************************
   * **/

  /**
   * Prevents the default event from being triggered.
   * This is used to disable the default scroll behavior when the user
   * interacts with the clock.
   * 
   * @param e - The event to prevent the default behavior from.
   */
  preventDefault(e: Event) {
    e = e || window.event;
    if (e.preventDefault)
        e.preventDefault();
    (e as any).returnValue = false;  
  }

  /**
   * Prevents the default behavior of the browser when the user presses the
   * up, down, left, right, spacebar, pageup, pagedown, end, or home keys.
   * This is used to disable the default scroll behavior when the user
   * interacts with the clock.
   * 
   * @param e - The event to prevent the default behavior from.
   * @returns `false` if the event was prevented, `true` otherwise.
   */
  preventDefaultForScrollKeys(e: KeyboardEvent): boolean {
      // left: 37, up: 38, right: 39, down: 40,
      // spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
      const keys: { [key: number]: number } = {37: 1, 38: 1, 39: 1, 40: 1};
      if (e.keyCode in keys) {
          this.preventDefault(e);
          return false;
      }
      return true;
  }

  /**
   * Disables the default scroll behavior of the browser when the user interacts
   * with the clock. This is needed to prevent the default scroll behavior when
   * the user interacts with the clock.
   */
  disableScroll() {
    if (window.addEventListener) // older FF
        window.addEventListener('DOMMouseScroll', this.preventDefault, false);
    window.onwheel = this.preventDefault; // modern standard
    //window.onmousewheel = document.onmousewheel = this.preventDefault; // older browsers, IE
    window.ontouchmove  = this.preventDefault; // mobile
    document.onkeydown  = this.preventDefaultForScrollKeys;
  }

  /**
   * Enables the default scroll behavior of the browser after being disabled.
   * This is needed to allow the default scroll behavior when the user is no
   * longer interacting with the clock.
   */
  enableScroll() {
      if (window.removeEventListener) // older FF
          window.removeEventListener('DOMMouseScroll', this.preventDefault, false);
      window.onwheel = null; // modern standard
      window.ontouchmove = null; // mobile
      document.onkeydown = null;
  }

  /**
   * Calculate the minutes from an angle in degrees.
   * 
   * @param angle - The angle in degrees.
   * @returns The minutes.
   */
  getMinutesFromAngle(angle: number): number {
    var minutes = (angle/360)*60*12;
    return minutes;
  } 

  /**
   * Calculate the angle in degrees from the given minutes.
   * 
   * @param minutes - The minutes to calculate the angle from.
   * @returns The angle in degrees.
   */
  getAngleFromMinutes(minutes: number): number {
    var minutes = (minutes*360)/60/12;
    return minutes;
  } 
  
  /**
   * Calculate the angle of the point given by the coordinates array.
   * 
   * If daytime is set to 'PM', the angle is shifted by 360 degrees.
   * 
   * @param coordinates - The coordinates of the point as an array of two numbers.
   * @returns The angle in degrees.
   */
  getAngle(coordinates: any[]): number {
    var daytime = this.clockSettingsService.get("daytime");
    var angle   = Math.atan2(coordinates[1], coordinates[0])*(180/Math.PI) + 90;
  
    angle = (angle + 720) % 360;
    angle = (daytime == 'AM' ? angle : angle + 360);

    return angle;
  }

  /**
   * Return the color for the given index, picked from a predefined array.
   * 
   * @param i - The index of the color to retrieve.
   * @returns The color.
   */
  getColor(i: number): string {
    var colors = ['#31a354','#74c476','#a1d99b','#c7e9c0','#a1d99b','#74c476' // green
              /**
              '#c6dbef','#9ecae1','#6baed6','#3182bd', // Blue
              '#756bb1',' #9e9ac8','#bcbddc','#dadaeb'
              **/
              ];
    var index = i%6;
    return colors[index]; 
  }

  /**
   * Returns the pie chart data for the given array of numbers.
   * 
   * This function takes an array of numbers and generates a pie chart data
   * structure using the d3.pie() function. The returned data structure is an
   * array of objects, each with the following properties:
   * 
   * - startAngle: The angle at which the arc starts.
   * - endAngle: The angle at which the arc ends.
   * - value: The value of the arc.
   * 
   * @param data - The array of numbers to generate the pie chart data from.
   * @returns The pie chart data.
   */
  getPieData(data: number[]): any {
    // Create pie layout.
    var pie = d3.pie().sort(null);
    
    // Get the pie chart data.
    var pieData = pie(data);

    // Return pie chart data.
    return pieData;
  }
  /**
   * Changes the daytime of the clock to the given daytime.
   * 
   * Triggers the transition animation.
   * 
   * @param toDaytime - The daytime to set the clock to ('AM' or 'PM').
   */
  changeDaytime(toDaytime: string){
    this.clockSettingsService.update('daytime', (toDaytime === 'AM' ? 'AM' : 'PM'));
    this.transition();
  }

  /**
   * Changes the daytime of the clock to the given daytime and triggers the transition animation.
   * 
   * This function changes the daytime of the clock to the given daytime and triggers the transition animation.
   * The transition animation is a smooth animation between the current daytime and the target daytime.
   * The animation is done by interpolating the arc of a pie chart segment from the current data to the target data.
   */
  transition(): void {
    var {
      MIN_RADIUS_AM,
      MAX_RADIUS_AM,
      MIN_RADIUS_PM,
      MAX_RADIUS_PM,
      MIN_RADIUS_BORDER,
      MAX_RADIUS_BORDER,
      MIN_RADIUS_AM_COLLAPSED,
      MAX_RADIUS_AM_COLLAPSED,
      MIN_RADIUS_PM_COLLAPSED,
      MAX_RADIUS_PM_COLLAPSED,
      MIN_RADIUS_BORDER_COLLAPSED,
      MAX_RADIUS_BORDER_COLLAPSED
    } = this.config;

    let daytime = this.clockSettingsService.get('daytime');

    if(daytime == 'PM'){
      this.face.selectAll(".todo-desc-label-am").style("opacity", 0);
      this.face.selectAll(".todo-desc-label-pm").style("opacity", 1);

      var circleDimensions = {
        MIN_RADIUS_AM: MIN_RADIUS_AM_COLLAPSED,
        MAX_RADIUS_AM: MAX_RADIUS_AM_COLLAPSED,
        MIN_RADIUS_PM: MIN_RADIUS_PM_COLLAPSED,
        MAX_RADIUS_PM: MAX_RADIUS_PM_COLLAPSED,
        MIN_RADIUS_BORDER: MIN_RADIUS_BORDER_COLLAPSED,
        MAX_RADIUS_BORDER: MAX_RADIUS_BORDER_COLLAPSED
      }
    } else {
      this.face.selectAll(".todo-desc-label-am").style("opacity", 1);
      this.face.selectAll(".todo-desc-label-pm").style("opacity", 0);

      var circleDimensions = {
        MIN_RADIUS_AM: MIN_RADIUS_AM,
        MAX_RADIUS_AM: MAX_RADIUS_AM,
        MIN_RADIUS_PM: MIN_RADIUS_PM,
        MAX_RADIUS_PM: MAX_RADIUS_PM,
        MIN_RADIUS_BORDER: MIN_RADIUS_BORDER,
        MAX_RADIUS_BORDER: MAX_RADIUS_BORDER
      }
    }

    // Animate am-circle from old-radius to new-radius.
    var path = d3.selectAll(".todo-circ-am > path");
    var t0 = path.transition()
        .duration(1000)
        .attrTween(
          "d", 
          this.tweenArc((_d: any, _i: number) => ({
            innerRadius:  circleDimensions.MIN_RADIUS_AM,
            outerRadius: circleDimensions.MAX_RADIUS_AM,
            startAngle: _d.startAngle,
            endAngle: _d.endAngle,
          }))
        );

    // Animate am-pm-divider from old-radius to new-radius.
    var path = d3.selectAll(".todo-circ-border > path");
    var t1 = path.transition()
        .duration(1000)
        .attrTween(
          "d", 
          this.tweenArc((_d: any, _i: number) => ({
            innerRadius: circleDimensions.MIN_RADIUS_BORDER,
            outerRadius: circleDimensions.MAX_RADIUS_BORDER,
            startAngle: _d.startAngle,
            endAngle: _d.endAngle,
          }))
        );

    // Animate pm-circle from old-radius to new-radius.
    var path = d3.selectAll(".todo-circ-pm > path");
    var t3 = path.transition()
        .duration(1000)
        .attrTween(
          "d", 
          this.tweenArc((_d: any, _i: number) => ({
            innerRadius:  circleDimensions.MIN_RADIUS_PM,
            outerRadius: circleDimensions.MAX_RADIUS_PM,
            startAngle: _d.startAngle,
            endAngle: _d.endAngle,
          }))
        );
  }

  /**
   * Interpolates the arc of a pie chart segment from the current data to the target data.
   * 
   * @param b - The target data.
   * @returns A function that takes a transition time t and returns the interpolated arc string.
   */
  tweenArc(b: (a: any, i: number) => any) {
    return (a: any, i: number): (t: number) => string => {
      // Calculate the target data for the transition.
      const target = b.call(this, a, i);
  
      // Create an interpolator between the current and target data structures.
      const interpolator = d3.interpolateObject(a, target);
  
      // Update the data of the element
      Object.assign(a, target);
  
      // Return the interpolation function for the transition.
      return (t: number): string => d3.arc()(interpolator(t))!;
    };
  }

  /**
   * Toggles the description labels on the clock face.
   * 
   * When description is activated, the labels are displayed.
   * When description is deactivated, the labels are hidden.
   */
  toggleDescription(){
    this.clockSettingsService.update("descriptionActivated", !this.clockSettingsService.get("descriptionActivated"));
    
    if (this.clockSettingsService.get("descriptionActivated")) {
      // Activate Description Labels.
      this.face = d3.select("#todo-clock-chart svg #clock-face");
      this.face.selectAll("#todo-desc-labels").style("opacity", 1);
    } else {
      // Remove Description Labels.
      this.face = d3.select("#todo-clock-chart svg #clock-face");
      this.face.selectAll("#todo-desc-labels").style("opacity", 0);
    }
  }

  /**
   * Toggles the sound effects on the clock face.
   * 
   * When sound is activated, the sound effects are played.
   * When sound is deactivated, the sound effects are muted.
   */
  toggleSound(){
    this.clockSettingsService.update("soundActivated", !this.clockSettingsService.get("soundActivated"));
    // Play sound when activating sound effect.
    if (this.clockSettingsService.get("soundActivated")) {
      this.clockSettingsService.playSound('/assets/audio/soundactivated.ogg');
    }
  }

  /**
   * Plays a speech alert, once an hour, when the hour changes and sound is activated.
   * @param date The current date object.
   */
  playSpeechAlert(date: Date): void {
    if (this.clockSettingsService.get("soundActivated")) {
      const hours: number = date.getHours();
      const minutes: number = date.getMinutes();

      if (this.SpeechLastHour !== hours) {
        const hour: number = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
        const daytime: string = hours < 12 ? 'am' : 'pm';
        this.clockSettingsService.playSound(`/assets/audio/${hour}${daytime}.ogg`);
        this.SpeechLastHour = hours;
      }
    }
  }

}
