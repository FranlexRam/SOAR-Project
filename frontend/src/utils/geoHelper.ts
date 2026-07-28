// Helper optimizado y nativo para transformar códigos ISO (ej. 'VE', 'ID', 'US', 'CN') en emojis de banderas de forma instantánea
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode) return '🌐';
  
  // Si es tráfico interno corporativo (redes privadas RFC 1918), retornamos un indicador corporativo limpio
  if (countryCode.toUpperCase() === 'INT' || countryCode.toUpperCase() === 'LOCAL') {
    return '🏢';
  }

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}