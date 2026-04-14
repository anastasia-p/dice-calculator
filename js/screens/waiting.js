// Экран 4 — Ожидание

function initWaiting() {
  document.getElementById('waiting-project-name').textContent =
    currentSession?.projectName || 'Без названия';

  window.FB.listenToSession(currentSessionId, session => {
    if (!session) return;
    currentSession = session;

    const isOrg = session.organizerId === window.FB.userId;
    document.getElementById('waiting-organizer-actions').style.display = isOrg ? 'flex' : 'none';
    document.getElementById('waiting-participant-info').style.display = isOrg ? 'none' : 'block';

    const participants = session.participants
      ? Object.values(session.participants).sort((a, b) => a.colorIndex - b.colorIndex)
      : [];
    renderWaiting(participants);

    // Сессия завершена — переводим всех на результаты
    if (session.status === 'completed') {
      window.FB.stopListening(currentSessionId);
      showScreen('results');
    }
  });
}

function renderWaiting(participants) {
  const expected = currentSession?.participantCount || participants.length;
  const answered = participants.filter(p => p.submittedAt).length;
  const pct = expected > 0 ? Math.round((answered / expected) * 100) : 0;

  document.getElementById('waiting-progress-text').textContent = 'Ответили ' + answered + ' из ' + expected;
  document.getElementById('waiting-bar-fill').style.width = pct + '%';

  const container = document.getElementById('waiting-participants');
  container.innerHTML = '';
  participants.forEach(p => {
    const color = PARTICIPANT_COLORS[p.colorIndex % PARTICIPANT_COLORS.length];
    const row = document.createElement('div');
    row.className = 'waiting-participant-row';
    row.innerHTML =
      '<div class="participant-avatar" style="background:' + color.bg + ';color:' + color.text + '">' +
        p.name.charAt(0).toUpperCase() +
      '</div>' +
      '<div class="waiting-participant-name">' + p.name +
        (p.isOrganizer ? ' <span class="organizer-badge">организатор</span>' : '') +
      '</div>' +
      '<div class="waiting-status ' + (p.submittedAt ? 'waiting-status-done' : 'waiting-status-wait') + '">' +
        (p.submittedAt ? '✓' : 'ждем') +
      '</div>';
    container.appendChild(row);
  });
}

function shareAgain() {
  if (!sessionLink) return;
  const shareUrl = 'https://t.me/share/url?url=' + encodeURIComponent(sessionLink)
    + '&text=' + encodeURIComponent('Присоединяйся к оценке проекта в DICE-калькуляторе');

  if (navigator.share) {
    navigator.share({ title: 'DICE-калькулятор', url: sessionLink });
  } else if (window.Telegram?.WebApp) {
    Telegram.WebApp.openLink(shareUrl);
  } else {
    const btn = event.target;
    copyToClipboard(sessionLink, btn, '⬆ Поделиться ссылкой еще раз');
  }
}

function finishSession() {
  const participants = currentSession?.participants
    ? Object.values(currentSession.participants)
    : [];
  const expected = currentSession?.participantCount || 0;
  const answered = participants.filter(p => p.submittedAt).length;

  if (expected > 0 && answered < expected) {
    // Не все ответили — показываем диалог
    document.getElementById('finish-overlay').style.display = 'block';
    document.getElementById('finish-dialog').style.display = 'block';
  } else {
    doFinishSession();
  }
}

function cancelFinish() {
  const btn = document.querySelector('.finish-dialog-wait');
  if (btn) {
    btn.textContent = 'Хорошо, ждем';
    btn.style.background = '#41bfd0';
    btn.style.borderColor = '#41bfd0';
    btn.style.color = '#ffffff';
    btn.disabled = true;
  }
  setTimeout(() => {
    document.getElementById('finish-overlay').style.display = 'none';
    document.getElementById('finish-dialog').style.display = 'none';
    if (btn) {
      btn.textContent = 'Дождаться';
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.disabled = false;
    }
  }, 2000);
}

function confirmFinish() {
  closeFinishDialog();
  doFinishSession();
}

function closeFinishDialog() {
  document.getElementById('finish-overlay').style.display = 'none';
  document.getElementById('finish-dialog').style.display = 'none';
}

async function doFinishSession() {
  const btn = document.getElementById('waiting-finish-btn');
  btn.style.background = '#41bfd0'; btn.style.borderColor = '#41bfd0';
  btn.style.color = '#ffffff'; btn.style.cursor = 'default';
  btn.textContent = 'Завершаем...'; btn.disabled = true;

  try {
    await window.FB.completeSession(currentSessionId);
    // Листенер сам обнаружит status === 'completed' и перейдет на результаты
  } catch (e) {
    console.error('Ошибка завершения сессии:', e);
    btn.textContent = 'Ошибка — попробуйте еще раз';
    btn.disabled = false;
  }
}
