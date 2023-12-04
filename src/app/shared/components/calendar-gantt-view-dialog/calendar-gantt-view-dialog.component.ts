import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { DialogComponent } from "../../service/dialog";

/* Range-wise calendar depedency */
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import allLocales from '@fullcalendar/core/locales-all';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import * as _moment from 'moment';
import { TillService } from '../../service/till.service';
const moment = (_moment as any).default ? (_moment as any).default : _moment;

const aColorCode = [
  '#3ba68c',
  '#3b8aa6',
  '#3F4254',
  '#A1A5B7',
  '#F1FAFF',
];

@Component({
  selector: 'app-calendar-gantt-view-dialog',
  templateUrl: './calendar-gantt-view-dialog.component.html',
  styleUrls: ['./calendar-gantt-view-dialog.component.scss']
})
export class CalendarGanttViewDialogComponent implements OnInit {
  dialogRef: DialogComponent;
  faTimes = faTimes;
  aWorkStation: any;
  aLocation: any;
  selectedWorkStation: any;
  aSelectedLocation: any;
  sDayClosureMethod: string;
  sSelectedLanguage: string = 'nl';

  aCalendarEvent: any;
  oCalendarSelectedData: any;
  eType: string; /* from-state or to-state */
  calendarOptions: any /* CalendarOptions */ = {
    headerToolbar: {
      left: 'prev,today,next',
      center: 'title',
      right: 'dayGridMonth'
    },
    validRange: {
      end: new Date()
    },
    initialView: 'dayGridMonth',
    firstDay: 1,
    plugins: [dayGridPlugin],
    events: [],
    displayEventTime: false,
    locales: allLocales,
    locale: this.sSelectedLanguage,
    // themeSystem: 'standard',
    // buttonIcons: {
    //   prev: 'fas fa-chevron-left',
    //   next: 'chevron-right fas fa-chevron-right',
    // },
    eventClick: this.handleEventClick.bind(this),
  };

  constructor(
    private viewContainerRef: ViewContainerRef,
    private tillService: TillService
  ) {
    const _injector = this.viewContainerRef.parentInjector
    this.dialogRef = _injector.get<DialogComponent>(DialogComponent);
    this.sSelectedLanguage = localStorage.getItem('language') || 'nl';
    this.calendarOptions.locale = this.sSelectedLanguage;
  }

  ngOnInit(): void {
    let nColorIndex = 0;
    const aArray = this.sDayClosureMethod == 'workstation' ? this.aWorkStation : this.aLocation;
    aArray.map((oElement: any) => {
      const sColor = aColorCode[nColorIndex];
      nColorIndex = (nColorIndex + 1) % aColorCode.length;
      oElement.backgroundColor = sColor
      return;
    })
    if (this.aCalendarEvent?.length) this.processingTheEvent();
  }

  getRandomColor() {
    const randomIndex = Math.floor(Math.random() * aColorCode.length);
    return aColorCode[randomIndex];
  }

  processingTheEvent(__aCalendarEvent?: any) {
    const _aCalendarEvent = __aCalendarEvent ? __aCalendarEvent : JSON.parse(JSON.stringify(this.aCalendarEvent));
    const aArray = this.sDayClosureMethod == 'workstation' ? this.aWorkStation : this.aLocation;
    /* FROM-STATE */
    if (this.eType === 'FROM_STATE') {
      this.calendarOptions.validRange.start = undefined;
      if (this.oCalendarSelectedData.dCloseDate) this.calendarOptions.validRange.end = this.oCalendarSelectedData.dCloseDate;

      this.calendarOptions.events = _aCalendarEvent?.filter((oEvent: any) => oEvent?.start)?.map((oEvent: any) => {
        const dOpenDate = oEvent.customProperty?.oDayClosure?.dOpenDate;
        let iId = oEvent.customProperty?.oDayClosure?.iWorkstationId
        if (this.sDayClosureMethod != 'workstation') iId = oEvent.customProperty?.oDayClosure?.iLocationId;
        oEvent.backgroundColor = (aArray.find((oElement: any) => oElement._id == iId))?.backgroundColor || this.getRandomColor();
        const nTotalRevenue = this.tillService.getSum(oEvent.customProperty?.oDayClosure?.aRevenuePerArticleGroupAndProperty, 'nTotalRevenue');
        oEvent.title = `${oEvent.title} (${(moment(dOpenDate).format('HH:mm'))}) | ${this.tillService.currency + nTotalRevenue}`
        return oEvent;
      })
    } else {
      /* TO_STATE */

      this.calendarOptions.validRange.end = new Date();
      if (this.oCalendarSelectedData.dOpenDate) this.calendarOptions.validRange.start = this.oCalendarSelectedData.dOpenDate;

      this.calendarOptions.events = _aCalendarEvent?.filter((oEvent: any) => oEvent?.end)?.map((oEvent: any) => {
        const dCloseDate = oEvent.customProperty?.oDayClosure?.dCloseDate;
        oEvent.backgroundColor = (this.aWorkStation.find((oWorkstation: any) => oWorkstation._id == oEvent.customProperty?.oDayClosure?.iWorkstationId))?.backgroundColor || this.getRandomColor();

        const nTotalRevenue = this.tillService.getSum(oEvent.customProperty?.oDayClosure?.aRevenuePerArticleGroupAndProperty, 'nTotalRevenue');
        oEvent.title = `${oEvent.title} (${(moment(dCloseDate).format('HH:mm'))}) | ${this.tillService.currency} ${nTotalRevenue}`
        // oEvent.title = `${oEvent.title} (${(moment(dCloseDate).format('DD-MM-yyyy hh:mm'))})`
        return oEvent;
      })
    }

  }

  handleEventClick(info: any): void {
    const oData = info.event; /* title, start, end, extendedProps.customProperty */
    oData.selectedWorkStation = this.selectedWorkStation;
    oData.aSelectedLocation = this.aSelectedLocation;
    this.close({ isChosen: true, oData });
  }

  onChangeDropdown(eType: string) {
    let _aCalendarEvent = JSON.parse(JSON.stringify(this.aCalendarEvent))
    if (this.selectedWorkStation?.length) _aCalendarEvent = _aCalendarEvent.filter((oEvent: any) => this.selectedWorkStation.includes(oEvent?.customProperty?.oDayClosure?.iWorkstationId?.toString()))
    if (this.aSelectedLocation?.length) _aCalendarEvent = _aCalendarEvent.filter((oEvent: any) => this.aSelectedLocation.includes(oEvent?.customProperty?.oDayClosure?.iLocationId?.toString()))
    this.processingTheEvent(_aCalendarEvent);
  }

  close(oData?: any): void {
    this.dialogRef.close.emit(oData)
  }
}
