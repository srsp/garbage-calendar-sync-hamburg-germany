import { GoogleCalendarEvent } from '../models';
import request = require('request-promise-native');
const ical = require('ical.js');
import { Moment } from 'moment';
import moment = require('moment');
import * as _ from 'lodash';

export class StadtreinigungHamburgIcsService {
  private icsUrl: string;

  constructor(private asId: string, private hnId: string, private address: string) {
    this.icsUrl = `http://www.stadtreinigung.hamburg/privatkunden/abfuhrkalender/Abfuhrtermin.ics?asId=${asId}&hnId=${hnId}&adresse=${address.replace(/\s/g, '')}`;
  }

  public async getUpcomingEvents(): Promise<GoogleCalendarEvent[]> {
    const ics: string = await this.downloadIcs();
    const eventsFromIcs: GoogleCalendarEvent[] = this.parseEvents(ics);
    const tomorrow = moment().add(24, 'h');

    return _.filter(
      eventsFromIcs,
      (event: GoogleCalendarEvent) => moment(event.start.dateTime).isAfter(tomorrow)
    );
  }

  private async downloadIcs(): Promise<string> {
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
      .replace('(falls Sie welche gekauft haben)', '(optional)')
      .replace('Hamburger Wertstofftonne bzw. gelber Hamburger Wertstoffsack', 'Gelbe Tonne')
      .replace('Papiertonne', 'Papiermüll')
      .replace('Restmülltonne', 'Restmüll')
      .replace('Biotonne', 'Biomüll')
      .trim();

    let colorId: string;
    switch (title) {
      case 'Gelbe Tonne':
        colorId = '5'; //yellow
        break;
      case 'Papiermüll':
        colorId = '7'; //blue
        break;
      case 'Restmüll':
        colorId = '8'; //graphit
        break;
      case 'Biomüll':
        colorId = '2'; //green
        break;
      default:
        colorId = undefined; //default color
        break;
    }

    const start: Moment = moment(data[7][3]).add(12, 'hours');
    const end: Moment = moment(start).add(2, 'hours');

    return {
      kind: 'calendar#event',
      created: new Date(),
      updated: new Date(),
      colorId: colorId,
      summary: title,
      description: data[4][3],
      start: {dateTime: start.toDate()},
      end: {dateTime: end.toDate()},
      reminders: {
        useDefault: true
      }
    };

  }
}
