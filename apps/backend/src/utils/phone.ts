export function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, '').length >= 10;
}
