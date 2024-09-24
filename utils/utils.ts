export function getGMTOffset() {
  const offset = new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset <= 0 ? '+' : '-';
  return `GMT${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}