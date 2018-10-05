# Stadtreinigung Hamburg Google Calendar Sync

The Stadtreinigung Hamburg publishes the garbage collection dates at their website.
You can also subscribe to an email reminder service as well as download all dates 6 month in advance.

However, both options aren't perfect:
* The email service spams your inbox.
* The ICS-Calendar file opiton requires a manual download at least every 6 months and doesn't capture short-term changes.
* Also, all events are dated to the day before collection at 17:00 which is the reminder date - not the actual collection date.

## What does this service do?

* It regularily checks the collection events from the Stadtreinigung Hamburg page at your address.
* It changes the date to the actual collection date.
* You can configure any Google notification.
* It sanitizes the event title and description.
* It sets the corresponding color (Paper = blue, Plastic = yellow, ...)
* It synchronizes these sanitized events with a given Google Calendar.

<img src="./img/Google_Kalender_-_Terminübersicht_ab_Montag__1__Oktober_2018.jpg" style="margin: auto">

## Setup

### Create a config file
1. copy the `config-example.json` to `config.json`.

### Create Google Project Credentials
You need a technical user that you will give access to your private calendar.  
1. Log in to https://console.cloud.google.com/apis/api/calendar-json.googleapis.com
2. Click "activate"
3. Click "create credentials"
4. Select "Google Calendar API", "Webserver (eg NodeJS)", "Application Data"
5. Download JSON credentials
6. Open JSON and copy and paste the values of "client_email" and "private_key" into the `./config.json` file.

### Create a new Google Calendar, set reminder time and share it with the technical user
1. Open calendar.google.com 
2. Create a new calendar (e.g. named "Müllabfuhr")
3. Go to calendar settings
4. Share calendar with the client email from the `config.json` (read and write access)
5. Copy the calendar ID (`something@group.calendar.google.com`) and paste it into the `./config.json` file.
6. If you want each garbage entry with the corresponding color, remove the `"defaultCalendarEventColorId": "8"`. Otherwise all garbage entries will be in graphite.

### Configure your notifications
1. Under notifications, add your preferred notification method and time. I use "popup" and "13h before".
Which is 17:00 the day before as notification on my mobile phone.

### Configure your address
*  Set your street name and your house number in `config.json`.
This has to match the data from Stadtreinigung Hamburg. You can verify it
[here](https://www.stadtreinigung.hamburg/privatkunden/abfuhrkalender/index.html)

### Other Configurations
* *Sync Frequency* Stadtreinigung Hamburg states that they'll update the collection events every 4 weeks.
I suggest synchronizing the the garbage calendar at least once a week. My cron expression is:
`"0 0 0 * * Mon"` which is every Monday at 00:00. You can find more information on cron scheduling at [here](https://crontab.guru/).
* *Colors* You can disable the different colors for each garbage collection event by setting `disableColors` to `true`.
Events will then have the default calendar color.

## Run

* Download and install Docker
* run `docker build -t garbage_calendar_service .`
* run `docker run garbage_calendar_service`
* first sync will start directly
