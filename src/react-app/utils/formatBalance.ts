/**
 * Форматирует TON баланс согласно требованиям:
 * - До 10 TON: показывать с 2 знаками после запятой (0.01, 0.10, 1.00, 5.00)
 * - От 10 TON и выше: показывать без дробной части (10, 100, 1000)
 */
export function formatTonBalance(balance: string | number): string {
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (isNaN(numBalance)) {
    return '0.00';
  }
  
  if (numBalance < 10) {
    return numBalance.toFixed(2);
  } else {
    // Для значений >= 10: показываем дробную часть только если она есть
    // Удаляем лишние нули в конце
    return numBalance.toString();
  }
}
