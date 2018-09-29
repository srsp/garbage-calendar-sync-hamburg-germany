import { GoogleCalendarEvent, GooglePrivateKey } from '../models';
import { GoogleApis } from 'googleapis';
import { JWT } from 'google-auth-library';
import moment = require('moment');

//how to find calendars IDs
//calendar.calendarList.list({}, (err: any, res: any) => console.log(res.data.items));
export class GoogleCalendar {
  calendar: any;

  constructor(private googlePrivateKey: string,
              private googleClientEmail: string,
              private calendarId: string) {
  }

  public async initialize() {
    const jwt: JWT = new JWT(
      this.googleClientEmail,
      null,
      this.googlePrivateKey,
      ['https://www.googleapis.com/auth/calendar']
    );

    return new Promise<JWT>((resolve, reject) => {
      jwt.authorize((err: any, tokens: any) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {

          this.calendar = new GoogleApis().calendar({version: 'v3', auth: jwt});

          resolve(jwt);
        }
      });
    });

  }

  public async getUpcomingEvents(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: moment().add(24, 'hours').toISOString(),
        maxResults: 100, //usually about 60 events per half a year
        singleEvents: true,
        orderBy: 'startTime'
      }, (err: any, res: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(<GoogleCalendarEvent[]> res.data.items);
        }
      });
    });
  }

  public async insertEvent(missingEvent: GoogleCalendarEvent): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.calendar.events.insert({
        calendarId: this.calendarId,
        resource: missingEvent
      }, function (err: any, event: any) {
        if (err) {
          reject(err);
        } else {
          resolve(event);
        }
      });
    });
  }

  public async deleteEvent(deletedEvent: GoogleCalendarEvent): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: deletedEvent.id
      }, function (err: any, result: any) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}
