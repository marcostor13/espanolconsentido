import { google } from 'googleapis'

export async function createCalendarEvent({ summary, description, start, end, attendeeEmail }) {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  })

  const calendar = google.calendar({ version: 'v3', auth })
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!calendarId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Configuración de Google Calendar incompleta')
  }

  const event = {
    summary,
    description: description || '',
    start: {
      dateTime: start,
      timeZone: 'Europe/Madrid',
    },
    end: {
      dateTime: end,
      timeZone: 'Europe/Madrid',
    },
  }

  if (attendeeEmail) {
    event.attendees = [{ email: attendeeEmail }]
  }

  const res = await calendar.events.insert({
    calendarId,
    requestBody: event,
    sendUpdates: attendeeEmail ? 'all' : 'none',
  })

  return res.data
}
