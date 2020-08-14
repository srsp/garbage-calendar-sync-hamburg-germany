/**
 * https://developers.google.com/calendar/v3/reference/events
 */
import moment = require('moment');

export class GoogleCalendarEventJson {
  id?: any;
  kind: string;
  colorId?: string;
  created: Date;
  updated: Date;
  description: string;
  summary: string;
  start: {
    date?: string;
    dateTime?: Date;
  };
  end: {
    date?: string;
    dateTime?: Date;
  };
  reminders: {
    useDefault: boolean,
    overrides?: GoogleCalendarEventReminder[]
  };
}

export class GoogleCalendarEvent extends GoogleCalendarEventJson {

  getStart() {
    return this.start.dateTime || this.start.date;
  }

  getEnd() {
    return this.end.dateTime || this.end.date;
  }

  static fromJson(json: GoogleCalendarEventJson): GoogleCalendarEvent {
    const event = new GoogleCalendarEvent();
    event.id = json.id;
    event.kind = json.kind;
    event.colorId = json.colorId;
    event.created = json.created;
    event.updated = json.updated;
    event.description = json.description;
    event.summary = json.summary;
    event.start = json.start;
    event.end = json.end;
    event.reminders = json.reminders;
    return event;
  }

}

export interface GoogleCalendarEventReminder {
  method: string;
  minutes: number;
}

export type IcalEvent = [string, {}, string, string][];

/*
{
  "kind": "calendar#event",
  "etag": etag,
  "id": string,
  "status": string,
  "htmlLink": string,
  "created": datetime,
  "updated": datetime,
  "summary": string,
  "description": string,
  "location": string,
  "colorId": string,
  "creator": {
    "id": string,
    "email": string,
    "displayName": string,
    "self": boolean
  },
  "organizer": {
    "id": string,
    "email": string,
    "displayName": string,
    "self": boolean
  },
  "start": {
    "date": date,
    "dateTime": datetime,
    "timeZone": string
  },
  "end": {
    "date": date,
    "dateTime": datetime,
    "timeZone": string
  },
  "endTimeUnspecified": boolean,
  "recurrence": [
    string
  ],
  "recurringEventId": string,
  "originalStartTime": {
    "date": date,
    "dateTime": datetime,
    "timeZone": string
  },
  "transparency": string,
  "visibility": string,
  "iCalUID": string,
  "sequence": integer,
  "attendees": [
    {
      "id": string,
      "email": string,
      "displayName": string,
      "organizer": boolean,
      "self": boolean,
      "resource": boolean,
      "optional": boolean,
      "responseStatus": string,
      "comment": string,
      "additionalGuests": integer
    }
  ],
  "attendeesOmitted": boolean,
  "extendedProperties": {
    "private": {
      (key): string
    },
    "shared": {
      (key): string
    }
  },
  "hangoutLink": string,
  "conferenceData": {
    "createRequest": {
      "requestId": string,
      "conferenceSolutionKey": {
        "type": string
      },
      "status": {
        "statusCode": string
      }
    },
    "entryPoints": [
      {
        "entryPointType": string,
        "uri": string,
        "label": string,
        "pin": string,
        "accessCode": string,
        "meetingCode": string,
        "passcode": string,
        "password": string
      }
    ],
    "conferenceSolution": {
      "key": {
        "type": string
      },
      "name": string,
      "iconUri": string
    },
    "conferenceId": string,
    "signature": string,
    "notes": string
  },
  "gadget": {
    "type": string,
    "title": string,
    "link": string,
    "iconLink": string,
    "width": integer,
    "height": integer,
    "display": string,
    "preferences": {
      (key): string
    }
  },
  "anyoneCanAddSelf": boolean,
  "guestsCanInviteOthers": boolean,
  "guestsCanModify": boolean,
  "guestsCanSeeOtherGuests": boolean,
  "privateCopy": boolean,
  "locked": boolean,
  "reminders": {
    "useDefault": boolean,
    "overrides": [
      {
        "method": string,
        "minutes": integer
      }
    ]
  },
  "source": {
    "url": string,
    "title": string
  },
  "attachments": [
    {
      "fileUrl": string,
      "title": string,
      "mimeType": string,
      "iconLink": string,
      "fileId": string
    }
  ]
}
 */


export interface GooglePrivateKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export interface Config {
  street: string;
  houseNumber: string;
  enableCron: boolean;
  cron: string;
  privateKey: string;
  clientEmail: string;
  calendarId: string;
  calendarEntryWholeDay: boolean;
  disableColors: boolean;
  asId: string;
  hnId: string;
}
