export function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}

export function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const { hours, minutes } = parseTime(time);
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(total / 60) % 24;
  const nextMinutes = total % 60;
  return formatTime(nextHours, nextMinutes);
}

export function minutesBetween(start: string, end: string): number {
  const startTotal = parseTime(start).hours * 60 + parseTime(start).minutes;
  const endTotal = parseTime(end).hours * 60 + parseTime(end).minutes;
  return endTotal - startTotal;
}

export function periodFromStartTime(
  startTime: string,
): 'morning' | 'afternoon' {
  return parseTime(startTime).hours < 12 ? 'morning' : 'afternoon';
}

export function defaultStartTimeForPeriod(
  period: 'morning' | 'afternoon',
): string {
  return period === 'morning' ? '08:00' : '19:00';
}

export function formatHoursLabel(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours)
    ? `${hours}h`
    : `${hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h`;
}
