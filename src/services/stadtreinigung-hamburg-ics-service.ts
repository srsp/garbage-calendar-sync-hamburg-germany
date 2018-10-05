import { GoogleCalendarEvent } from '../models';
import request = require('request-promise-native');
const ical = require('ical.js');
import { Moment } from 'moment';
import moment = require('moment');
import * as _ from 'lodash';

export class StadtreinigungHamburgIcsService {
  private icsUrl: string;
  private hnId: string;
  private asId: string;

  constructor(private street: string, private houseNumber: string, private disableColors: boolean, private calendarEntryWholeDay: boolean) {
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
    if (!this.hnId || !this.asId) {
      console.log(`┣━ Trying to find Stadtreinigung-specific IDs...`);
      [this.hnId, this.asId] = await this.loadHnAsIds();
      console.log(`┣━ HN-ID: ${this.hnId}`);
      console.log(`┣━ AS-ID: ${this.asId}`);

      if (!this.hnId || !this.asId) {
        throw new Error('hnId or asID not found. Please check your address and house number.');
      }
    }
    this.icsUrl = `http://www.stadtreinigung.hamburg/privatkunden/abfuhrkalender/Abfuhrtermin.ics?asId=${this.asId}&hnId=${this.hnId}&adresse=${this.street}+${this.houseNumber}`;

    console.log(`┣━ Downloading events from ${this.icsUrl}.`);
    return request.get(this.icsUrl);
  }

  private parseEvents(ics: string): GoogleCalendarEvent[] {
    const [header1, header2, parsedIcal]: [string, any[], any[][]] = ical.parse(ics);

    return parsedIcal.map((event: [string, any[]]) => this.parseEvent(event));
  }

  private async loadHnAsIds(): Promise<[string, string]> {
    const webpage = await request.post('https://www.stadtreinigung.hamburg/privatkunden/abfuhrkalender/index.html', {
      form: {
        strasse: this.street,
        hausnummer: this.houseNumber,
        bestaetigung: true,
        suche: 'Abfuhrtermine suchen',
        hnId: undefined,
        asId: undefined,
        mode: 'search'
      }
    });
    //search for: <input type="hidden" name="asId" value="122" />
    // 						<input type="hidden" name="hnId" value="322222" />
    const hnId = webpage.match(/<input type="hidden" name="hnId" value="([0-9]+)" \/>/)[1];
    const asId = webpage.match(/<input type="hidden" name="asId" value="([0-9]+)" \/>/)[1];

    return [hnId, asId];
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

    if (!this.disableColors) {
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
      }
    };

  }
}
