const SCREENS = ['start', 'calculator', 'setup', 'waiting', 'results'];

function showScreen(name) {
  SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('screen-' + name);
  if (target) target.style.display = 'flex';

  if (name === 'calculator') initCalculator();
}

document.addEventListener('DOMContentLoaded', () => {
  showScreen('start');
});
