import { GoogleCalendarEvent } from '../models';
import * as _ from 'lodash';
import request = require('request-promise-native');
import moment = require('moment');

const ical = require('ical.js');


export class StadtreinigungHamburgIcsService {
  private icsUrl: string;
  private hnId: string;
  private asId: string;

  constructor(private street: string, private houseNumber: string, private disableColors: boolean, private wholeDay: boolean, private asIdFromConfig: string, private hnIdFromConfig: string) {
  }

  public async getUpcomingEvents(): Promise<GoogleCalendarEvent[]> {
    const ics: string = await this.downloadIcs();
    const eventsFromIcs: GoogleCalendarEvent[] = this.parseEvents(ics);

    return _.filter(
      eventsFromIcs,
      (event: GoogleCalendarEvent) => moment(event.getStart()).isAfter()
    );
  }

  private async downloadIcs(): Promise<string> {
    if (!this.hnId || !this.asId) {
      console.log(`┣━ Trying to find Stadtreinigung-specific IDs...`);
      [this.hnId, this.asId] = await this.loadHnAsIds();
      console.log(`┣━ HN-ID: ${this.hnId}`);
      console.log(`┣━ AS-ID: ${this.asId}`);
      console.log(`┣━ Address: ${this.street} ${this.houseNumber}`);

      if (!this.hnId || !this.asId) {
        throw new Error('hnId or asID not found. Please check your address and house number or set it in the config.json.');
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
    try {
    //search for: <input type="hidden" name="asId" value="122" />
    // 						<input type="hidden" name="hnId" value="322222" />
    const hnId = webpage.match(/<input type="hidden" name="hnId" value="([0-9]+)" \/>/)[1];
    const asId = webpage.match(/<input type="hidden" name="asId" value="([0-9]+)" \/>/)[1];
    return [hnId, asId];
    } catch {
      console.log(`┣━ Failed to find IDs, using values from config...`);
      return [this.hnIdFromConfig, this.asIdFromConfig]
    }

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

    const event: GoogleCalendarEvent = new GoogleCalendarEvent();
    if (this.wholeDay) {
      event.start = {
        date: moment(data[7][3]).add(12, 'hours').format('YYYY-MM-DD')
      };
      event.end = {
        date: moment(data[7][3]).add(14, 'hours').format('YYYY-MM-DD')
      };
    } else {
      event.start = {
        dateTime: moment(data[7][3]).add(12, 'hours').toDate()
      };
      event.end = {
        dateTime: moment(data[7][3]).add(14, 'hours').toDate()
      };
    }

    event.kind = 'calendar#event';
    event.created = new Date();
    event.updated = new Date();
    event.colorId = colorId;
    event.summary = title;
    event.description = data[4][3];
    event.reminders = {
      useDefault: true
    };

    return event;
  }
}
