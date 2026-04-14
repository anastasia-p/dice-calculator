const SCREENS = ['start', 'calculator', 'setup', 'waiting', 'results'];

let currentMode = 'solo'; // 'solo' | 'team'
let currentSessionId = null;  // ID текущей сессии
let currentSession = null;    // Полные данные сессии из Firebase

function showScreen(name) {
  // При уходе с экрана ожидания — останавливаем листенер
  if (name !== 'waiting' && currentSessionId && window.FB) {
    window.FB.stopListening(currentSessionId);
  }

  SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('screen-' + name);
  if (target) target.style.display = 'flex';

  if (name === 'calculator') initCalculator();
  if (name === 'setup')      initSetup();
  if (name === 'waiting')    initWaiting();
  if (name === 'results')    initResults();
}

document.addEventListener('DOMContentLoaded', async () => {
  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;

  if (startParam && window.FB) {
    // Флоу участника: открыли приложение по ссылке с sessionId
    currentMode = 'team';
    currentSessionId = startParam;
    try {
      const session = await window.FB.getSession(startParam);
      if (session && session.status === 'active') {
        currentSession = session;
        Object.keys(session.labels || {}).forEach(p => { labels[p] = session.labels[p]; });
        document.getElementById('project-name-display').textContent = session.projectName;
        document.getElementById('waiting-project-name').textContent = session.projectName;
        showScreen('calculator');
      } else {
        showScreen('start');
      }
    } catch (e) {
      console.error('Ошибка загрузки сессии:', e);
      showScreen('start');
    }
  } else {
    showScreen('start');
  }
});
