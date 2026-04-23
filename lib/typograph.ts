const NBSP = '\u00A0';

// Short words that should not be separated from the next word
const SHORT_WORDS = new Set([
  // предлоги
  'в', 'к', 'о', 'с', 'у', 'на', 'за', 'из', 'от', 'до', 'по', 'об', 'при', 'для', 'без', 'над', 'под', 'про',
  // союзы
  'и', 'а', 'но', 'же', 'ли', 'бы', 'да',
  // частицы
  'не', 'ни',
  // местоимения ≤ 3 букв
  'он', 'мы', 'вы', 'их', 'его', 'её', 'ее',
  // прочие короткие
  'что', 'как', 'так', 'все', 'это', 'уже', 'где', 'кто',
]);

/**
 * Автоматический типограф для русского текста.
 * - Неразрывные пробелы после коротких слов (предлоги, союзы)
 * - Неразрывный пробел перед тире
 * - Неразрывный пробел между числом и следующим словом
 * - Кавычки-ёлочки
 */
export function typograph(text: string): string {
  if (!text) return text;

  let result = text;

  // 1. Неразрывный пробел ПОСЛЕ коротких слов
  // Split by whitespace, then rejoin with nbsp after short words
  const words = result.split(/(\s+)/);
  const parts: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    // Check if this word is a short word and next token is whitespace
    if (SHORT_WORDS.has(w.toLowerCase()) && i + 1 < words.length && /^\s+$/.test(words[i + 1])) {
      parts.push(w);
      parts.push(NBSP); // replace whitespace with nbsp
      i++; // skip the whitespace token
    } else {
      parts.push(w);
    }
  }
  result = parts.join('');

  // 2. Неразрывный пробел перед тире (— и –)
  result = result.replace(/\s+([—–])/g, NBSP + '$1');

  // 3. Неразрывный пробел между числом и следующим словом
  result = result.replace(/(\d)\s+(?=[а-яёА-ЯЁa-zA-Z])/g, '$1' + NBSP);

  // 4. Кавычки-ёлочки
  result = result.replace(/"([^"]+)"/g, '«$1»');

  return result;
}
