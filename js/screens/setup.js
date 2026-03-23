// Экран 2 — Настройка сессии

let sessionId = null;
let sessionLink = null;

function createSession() {
  const name = document.getElementById('setup-project-name').value.trim() || 'Без названия';

  const btn = document.getElementById('create-btn');
  btn.style.background = '#41bfd0';
  btn.style.borderColor = '#41bfd0';
  btn.style.color = '#ffffff';
  btn.style.cursor = 'default';
  btn.textContent = 'Сессия создана';
  btn.disabled = true;

  // Заглушка: генерируем ID сессии (позже заменится на Firebase)
  sessionId = Math.random().toString(36).slice(2, 10).toUpperCase();
  sessionLink = 'https://t.me/DICE_bcg_bot?startapp=' + sessionId;

  setTimeout(() => {
    document.getElementById('setup-after').style.display = 'flex';
  }, 1000);
}

function shareSession() {
  if (!sessionLink) return;
  const btn = document.getElementById('share-btn');

  if (navigator.share) {
    navigator.share({ title: 'DICE-калькулятор', url: sessionLink });
  } else {
    copyToClipboard(sessionLink, btn, '⬆ Поделиться');
  }
}

function copySessionLink() {
  if (!sessionLink) return;
  const btn = document.getElementById('copy-link-btn');
  copyToClipboard(sessionLink, btn, '⎘ Скопировать');
  setTimeout(() => {
    if (window.Telegram && Telegram.WebApp) Telegram.WebApp.minimize();
  }, 500);
}

function copyToClipboard(text, btn, originalLabel) {
  const onCopied = () => {
    btn.textContent = 'Скопировано';
    btn.style.background = '#41bfd0';
    btn.style.borderColor = '#41bfd0';
    btn.style.color = '#ffffff';
    setTimeout(() => {
      btn.textContent = originalLabel;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 3000);
  };

  navigator.clipboard.writeText(text).then(onCopied).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    onCopied();
  });
}

function goToCalculator() {
  currentMode = 'team';
  const name = document.getElementById('setup-project-name').value.trim() || 'Без названия';
  document.getElementById('project-name-display').textContent = name;
  showScreen('calculator');
}

function invalidateSession() {
  if (!sessionId) return;
  sessionId = null;
  sessionLink = null;
  document.getElementById('setup-after').style.display = 'none';
  const btn = document.getElementById('create-btn');
  btn.textContent = 'Создать сессию';
  btn.style.background = '';
  btn.style.borderColor = '';
  btn.style.color = '';
  btn.style.cursor = '';
  btn.disabled = false;
}

function initSetup() {
  if (sessionId) {
    // Возврат с уже созданной сессией — восстанавливаем состояние
    document.getElementById('setup-after').style.display = 'flex';
    const btn = document.getElementById('create-btn');
    btn.style.background = '#41bfd0';
    btn.style.borderColor = '#41bfd0';
    btn.style.color = '#ffffff';
    btn.style.cursor = 'default';
    btn.textContent = 'Сессия создана';
    btn.disabled = true;
  } else {
    sessionId = null;
    sessionLink = null;
    document.getElementById('setup-project-name').value = '';
    document.getElementById('setup-after').style.display = 'none';
    const btn = document.getElementById('create-btn');
    btn.textContent = 'Создать сессию';
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.style.color = '';
    btn.style.cursor = '';
    btn.disabled = false;
  }

  document.getElementById('setup-project-name').oninput = invalidateSession;
}
