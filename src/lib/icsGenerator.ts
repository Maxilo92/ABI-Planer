export interface ICSEvent {
  title: string;
  description?: string;
  location?: string;
  start_date: string; // ISO string
  end_date: string;   // ISO string
}

function formatDate(date: string) {
  return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function generateICS(event: ICSEvent) {
  const { title, description, location, start_date, end_date } = event;
  const start = formatDate(start_date);
  const end = formatDate(end_date);
  const now = formatDate(new Date().toISOString());

  // Use a unique UID for the event
  const uid = `${now}-${Math.random().toString(36).substring(2, 11)}@abi-planer.de`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ABI Planer//NONSGML Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
  ];

  if (description) {
    // Escape newlines and commas in description
    const escapedDescription = description
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
    icsLines.push(`DESCRIPTION:${escapedDescription}`);
  }

  if (location) {
    // Escape newlines and commas in location
    const escapedLocation = location
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
    icsLines.push(`LOCATION:${escapedLocation}`);
  }

  icsLines.push('END:VEVENT');
  icsLines.push('END:VCALENDAR');

  return icsLines.join('\r\n');
}

export function downloadICS(event: ICSEvent) {
  const content = generateICS(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // For iOS/Safari compatibility: 
  // 1. Try a hidden link first (most common)
  // 2. Fallback to window.open if it's potentially blocked or fails
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  
  // Give Safari a moment to process the download link before revoking
  setTimeout(() => {
    document.body.removeChild(link);
    // On iOS, window.open with a blob URL can sometimes trigger the "Open in Calendar" dialog
    // if the anchor click didn't work.
    URL.revokeObjectURL(url);
  }, 100);
}
