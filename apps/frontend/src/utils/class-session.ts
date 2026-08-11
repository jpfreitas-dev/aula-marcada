type ClassSessionTiming = {
  date: string;
  endTime: string;
};

export function isClassSessionEnded(
  session: ClassSessionTiming,
  reference = new Date(),
): boolean {
  const endAt = new Date(`${session.date}T${session.endTime}:00`);
  return reference.getTime() >= endAt.getTime();
}
