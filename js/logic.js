// js/logic.js — чистая бизнес-логика DICE-калькулятора
// ES-модуль: импортируется в тестах напрямую, в приложении — через window.DICE

export function calcScore(answers) {
  return answers.D + 2 * answers.I + 2 * answers.C1 + answers.C2 + answers.E;
}

export function getZone(score) {
  if (score <= 13) return { label: 'Выигрыш',      cls: 'zone-win' };
  if (score <= 17) return { label: 'Беспокойство', cls: 'zone-warn' };
  return                   { label: 'Проблема',     cls: 'zone-fail' };
}

export function getDiscrepancy(values) {
  const unique = [...new Set(values)];
  if (unique.length === 1) return 'unanimous';
  if (values.includes(1) && values.includes(4)) return 'critical';
  return 'discord';
}

export function getMajorityZone(participants) {
  const counts = { 'zone-win': 0, 'zone-warn': 0, 'zone-fail': 0 };
  participants.forEach(p => { counts[getZone(calcScore(p.answers)).cls]++; });
  const max = Math.max(counts['zone-win'], counts['zone-warn'], counts['zone-fail']);
  if (counts['zone-fail'] === max) return { label: 'Проблема',     cls: 'zone-fail' };
  if (counts['zone-warn'] === max) return { label: 'Беспокойство', cls: 'zone-warn' };
  return                                   { label: 'Выигрыш',      cls: 'zone-win' };
}

// Экспорт в глобальный scope для использования в обычных скриптах (только в браузере)
if (typeof window !== 'undefined') {
  window.DICE = { calcScore, getZone, getDiscrepancy, getMajorityZone };
}
