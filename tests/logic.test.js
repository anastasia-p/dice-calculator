import { describe, it, expect } from 'vitest';
import { calcScore, getZone, getDiscrepancy, getMajorityZone } from '../js/logic.js';

// --- calcScore ---
describe('calcScore', () => {
  it('минимальный балл: все по 1', () => {
    expect(calcScore({ D: 1, I: 1, C1: 1, C2: 1, E: 1 })).toBe(7);
  });

  it('максимальный балл: все по 4', () => {
    expect(calcScore({ D: 4, I: 4, C1: 4, C2: 4, E: 4 })).toBe(28);
  });

  it('формула: D + 2I + 2C1 + C2 + E', () => {
    expect(calcScore({ D: 2, I: 3, C1: 2, C2: 3, E: 1 })).toBe(2 + 6 + 4 + 3 + 1);
  });
});

// --- getZone ---
describe('getZone', () => {
  it('7 — Выигрыш', () => {
    expect(getZone(7).label).toBe('Выигрыш');
    expect(getZone(7).cls).toBe('zone-win');
  });

  it('13 — граница Выигрыша', () => {
    expect(getZone(13).label).toBe('Выигрыш');
  });

  it('14 — начало Беспокойства', () => {
    expect(getZone(14).label).toBe('Беспокойство');
    expect(getZone(14).cls).toBe('zone-warn');
  });

  it('17 — граница Беспокойства', () => {
    expect(getZone(17).label).toBe('Беспокойство');
  });

  it('18 — Проблема', () => {
    expect(getZone(18).label).toBe('Проблема');
    expect(getZone(18).cls).toBe('zone-fail');
  });

  it('28 — максимум, Проблема', () => {
    expect(getZone(28).label).toBe('Проблема');
  });
});

// --- getDiscrepancy ---
describe('getDiscrepancy', () => {
  it('все одинаковые — единодушно', () => {
    expect(getDiscrepancy([2, 2, 2])).toBe('unanimous');
  });

  it('есть 1 и 4 — критическое', () => {
    expect(getDiscrepancy([1, 3, 4])).toBe('critical');
  });

  it('разные, но без 1+4 — расхождение', () => {
    expect(getDiscrepancy([1, 2, 3])).toBe('discord');
    expect(getDiscrepancy([2, 3, 4])).toBe('discord');
  });
});

// --- getMajorityZone ---
describe('getMajorityZone', () => {
  const p = (D, I, C1, C2, E) => ({ answers: { D, I, C1, C2, E } });

  it('большинство в Выигрыше — Выигрыш', () => {
    const participants = [
      p(1, 1, 1, 1, 1), // 7 — Выигрыш
      p(1, 1, 1, 1, 1), // 7 — Выигрыш
      p(4, 4, 4, 4, 4), // 28 — Проблема
    ];
    expect(getMajorityZone(participants).label).toBe('Выигрыш');
  });

  it('большинство в Беспокойстве — Беспокойство', () => {
    const participants = [
      p(1, 1, 1, 1, 1), // 7 — Выигрыш
      p(2, 3, 2, 2, 2), // 15 — Беспокойство
      p(3, 2, 3, 2, 2), // 15 — Беспокойство
    ];
    expect(getMajorityZone(participants).label).toBe('Беспокойство');
  });

  it('ничья — выбирается более пессимистичная зона', () => {
    const participants = [
      p(1, 1, 1, 1, 1), // 7 — Выигрыш
      p(4, 4, 4, 4, 4), // 28 — Проблема
    ];
    expect(getMajorityZone(participants).label).toBe('Проблема');
  });
});
