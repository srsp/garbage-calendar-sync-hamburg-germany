import { GoogleCalendarEvent } from '../models';
import request = require('request-promise-native');
const ical = require('ical.js');
import { Moment } from 'moment';
import moment = require('moment');
import * as _ from 'lodash';

export class StadtreinigungHamburgIcsService {
  private icsUrl: string;
  private defaultColorId: string;
  private wholeDay: boolean;

  constructor(private hnId: string, private asId: string, private address: string, private colorId: string, calendarEntryWholeDay: boolean) {
    this.icsUrl = `http://www.stadtreinigung.hamburg/privatkunden/abfuhrkalender/Abfuhrtermin.ics?asId=${asId}&hnId=${hnId}&adresse=${address.replace(/\s/g, '')}`;
    this.defaultColorId = colorId;
    this.wholeDay = calendarEntryWholeDay;
  }

  public async getUpcomingEvents(): Promise<GoogleCalendarEvent[]> {
    const ics: string = await this.downloadIcs();
    const eventsFromIcs: GoogleCalendarEvent[] = this.parseEvents(ics);
    const tomorrow = moment().add(24, 'h');

    return _.filter(
      eventsFromIcs,
      (event: GoogleCalendarEvent) => moment(event.start.dateTime).isAfter(tomorrow) || moment(event.start.date).isAfter(tomorrow)
    );
  }

  private async downloadIcs(): Promise<string> {
    console.log(`┣━ Downloading events from ${this.icsUrl}.`);
    return request.get(this.icsUrl);
  }

  private parseEvents(ics: string): GoogleCalendarEvent[] {
    const [header1, header2, parsedIcal]: [string, any[], any[][]] = ical.parse(ics);

    return parsedIcal.map((event: [string, any[]]) => this.parseEvent(event));
  }

  private parseEvent([eventType, data]: [string, any[]]): GoogleCalendarEvent {

    const title: string = data[3][3]
      .replace('Erinnerung: Abfuhr', '')
      .replace('morgen ab 6 Uhr', '')
      .replace('schwarze', '')
      .replace('gelbe', '')
      .replace('grüne', '')
      .replace('blaue', '')
      .replace('(falls Sie welche gekauft haben)', '')
      .replace('Hamburger Wertstofftonne bzw. gelber Hamburger Wertstoffsack', 'Wertstofftonne')
      .trim();

    let colorId: string;

    if (this.defaultColorId == null) {

        switch (title) {
            case 'Wertstofftonne':
                colorId = '5'; //yellow
                break;
            case 'Papiertonne':
                colorId = '7'; //blue
                break;
            case 'Restmülltonne':
                colorId = '8'; //graphit
                break;
            case 'Biotonne':
                colorId = '2'; //green
                break;
            default:
                colorId = undefined; //default color
                break;
        }
    } else {
      colorId = this.defaultColorId;
    }

    const startDate: Moment = this.wholeDay ? moment(data[7][3]).add(12, 'hours') : undefined;
    const startDateTime: Moment = this.wholeDay ? undefined : moment(data[7][3]).add(12, 'hours');
    const endDate: Moment = this.wholeDay ? moment(startDate).add(2, 'hours') : undefined;
    const endDateTime: Moment = this.wholeDay ? undefined : moment(startDate).add(2, 'hours');

    return {
      kind: 'calendar#event',
      created: new Date(),
      updated: new Date(),
      colorId: colorId,
      summary: title,
      description: data[4][3],
      start: {
          date: startDate.format('YYYY-MM-DD'),
          dateTime: startDateTime == null ? undefined : startDateTime.toDate()
      },
      end: {
          date: endDate.format('YYYY-MM-DD'),
          dateTime: endDateTime == null ? undefined : endDateTime.toDate()
      },
      reminders: {
        useDefault: true
      },
      wholeDay: this.wholeDay,
    };

  }
}
