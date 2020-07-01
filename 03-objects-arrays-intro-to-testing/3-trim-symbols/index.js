/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (size === 0) return '';
  if (!size) return string;

  let counter = 0;
  let currentSymbol = null;
  let result = '';

  for (const symbol of string) {
    if (symbol !== currentSymbol) {
      currentSymbol = symbol;
      counter = 0;
    }

    if (counter < size) {
      result += currentSymbol;
      counter++;
    }
  }

  return result;
}
