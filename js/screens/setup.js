// Экран 2 — Настройка сессии

let sessionId = null;
let sessionLink = null;

async function createSession() {
  const name = document.getElementById('setup-project-name').value.trim() || 'Без названия';
  const participantCount = parseInt(document.getElementById('setup-participant-count').value) || 0;

  const btn = document.getElementById('create-btn');
  btn.style.background = '#41bfd0';
  btn.style.borderColor = '#41bfd0';
  btn.style.color = '#ffffff';
  btn.style.cursor = 'default';
  btn.textContent = 'Создаем...';
  btn.disabled = true;

  try {
    const id = await window.FB.createSession(name, JSON.parse(JSON.stringify(labels)), participantCount);
    sessionId = id;
    sessionLink = 'https://t.me/' + BOT_USERNAME + '/' + APP_SHORT_NAME + '?startapp=' + id;
    currentSessionId = id;
    currentSession = {
      projectName: name,
      organizerId: window.FB.userId,
      status: 'active',
      participantCount,
      labels: JSON.parse(JSON.stringify(labels))
    };

    btn.textContent = 'Сессия создана';
    setTimeout(() => {
      document.getElementById('setup-after').style.display = 'flex';
    }, 1000);
  } catch (e) {
    console.error('Ошибка создания сессии:', e);
    btn.textContent = 'Ошибка — попробуйте еще раз';
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.style.color = '';
    btn.style.cursor = '';
    btn.disabled = false;
  }
}

function shareSession() {
  if (!sessionLink) return;
  const btn = document.getElementById('share-btn');
  const shareUrl = 'https://t.me/share/url?url=' + encodeURIComponent(sessionLink)
    + '&text=' + encodeURIComponent('Присоединяйся к оценке проекта в DICE-калькуляторе');

  if (navigator.share) {
    navigator.share({ title: 'DICE-калькулятор', url: sessionLink });
  } else if (window.Telegram?.WebApp) {
    Telegram.WebApp.openLink(shareUrl);
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
    document.getElementById('setup-participant-count').value = '';
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
  document.getElementById('setup-participant-count').oninput = invalidateSession;
}
