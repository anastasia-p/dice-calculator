const SCREENS = ['start', 'calculator', 'setup', 'waiting', 'results'];
let currentMode = 'solo'; // 'solo' | 'team'

function showScreen(name) {
  SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('screen-' + name);
  if (target) target.style.display = 'flex';

  if (name === 'calculator') initCalculator();
  if (name === 'setup') initSetup();
}

document.addEventListener('DOMContentLoaded', () => {
  showScreen('start');
});
