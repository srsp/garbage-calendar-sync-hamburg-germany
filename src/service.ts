import { CronJob } from 'cron';
import { Config, GoogleCalendarEvent } from './models';
import * as _ from 'lodash';
import { GoogleCalendar } from './services/google-calendar';
import { StadtreinigungHamburgIcsService } from './services/stadtreinigung-hamburg-ics-service';
import moment = require('moment');

const config: Config = require('../config.json');

class GarbageService {
  cron: string = config.cron;
  hnId: string = config.hnId;
  asId: string = config.asId;
  address: string = config.address;
  privateKey: string = config.privateKey;
  clientEmail: string = config.clientEmail;
  calendarId: string = config.calendarId;
  defaultCalendarEventColorId: string = config.defaultCalendarEventColorId;

  private googleCalendar: GoogleCalendar;
  private stadtReinigungHamburgIcsService: StadtreinigungHamburgIcsService;

  constructor() {
    this.googleCalendar = new GoogleCalendar(this.privateKey, this.clientEmail, this.calendarId);
    this.stadtReinigungHamburgIcsService = new StadtreinigungHamburgIcsService(this.hnId, this.asId, this.address, this.defaultCalendarEventColorId);

    //one time at startup time
    this.synchronizeCalendars();

    //as cron job
    new CronJob(this.cron, () => this.synchronizeCalendars(), null, true, 'Europe/Berlin');
  }

  private async synchronizeCalendars() {
    try {

      console.log();
      console.log();
      console.log(`Starting Calendar Sync at ${moment().toISOString()}`);

      const upcomingEventsFromIcs: GoogleCalendarEvent[] = await this.stadtReinigungHamburgIcsService.getUpcomingEvents();
      console.log(`┣━ Successfully loaded ${upcomingEventsFromIcs.length} garbage events from Stadtreinigung Hamburg API.`);

      await this.googleCalendar.initialize();
      console.log(`┣━ Successfully authenticated and connected to Google Calendar.`);

      const eventsFromGoogleCalendar: GoogleCalendarEvent[] = await this.googleCalendar.getUpcomingEvents();
      console.log(`┣━ Retrieved ${eventsFromGoogleCalendar.length} upcoming events from Google Calendar. `);
      console.log(`┣━ Calculating sync...`);

      const missingEvents: GoogleCalendarEvent[] = _.differenceWith(
        upcomingEventsFromIcs,
        eventsFromGoogleCalendar,
        this.compareEvents);
      console.log(`┃  ┣━ Found ${missingEvents.length} missing events.`);
      let deletedEvents: GoogleCalendarEvent[] = _.differenceWith(
        eventsFromGoogleCalendar,
        upcomingEventsFromIcs,
        this.compareEvents);
      //only take events, created by this service account (do not delete other events)
      deletedEvents = <GoogleCalendarEvent[]> _.filter(deletedEvents, {creator: {email: this.clientEmail}});
      //only take events, that are in the future
      deletedEvents = <GoogleCalendarEvent[]> _.filter(deletedEvents, (event: GoogleCalendarEvent) => moment(event.start.dateTime).isAfter());
      console.log(`┃  ┗━ Found ${deletedEvents.length} deleted events.`);

      console.log(`┣━ Starting insertion of missing events...`);
      for (const missingEvent of missingEvents) {
        await this.googleCalendar.insertEvent(missingEvent);
        console.log(`┃  ┣━ Inserted ${missingEvent.summary} at ${moment(missingEvent.start.dateTime).format('YYYY-DD-MM')}.`);
      }
      console.log(`┃  ┗━ Done.`);

      console.log(`┣━ Starting deletion of deleted events...`);
      for (const deletedEvent of deletedEvents) {
        await this.googleCalendar.deleteEvent(deletedEvent);
        console.log(`┃  ┣━ Deleted ${deletedEvent.summary} at ${moment(deletedEvent.start.dateTime).format('YYYY-DD-MM')}.`);
      }
      console.log(`┃  ┗━ Done.`);
      console.log(`┗━ Done. Going back to sleep...`);
      console.log();
      console.log();
    } catch (e) {
      console.error('Calendar Sync failed!');
      console.error(e);
    }
  }

  private compareEvents(eventA: GoogleCalendarEvent, eventB: GoogleCalendarEvent): boolean {
    return (eventA.description === eventB.description);
  }

}

new GarbageService();


