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
  const total = participants.length;
  const answered = participants.filter(p => p.submittedAt).length;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  document.getElementById('waiting-progress-text').textContent = 'Ответили ' + answered + ' из ' + total;
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

  if (window.Telegram?.WebApp) {
    Telegram.WebApp.openLink(shareUrl);
  } else if (navigator.share) {
    navigator.share({ title: 'DICE-калькулятор', url: sessionLink });
  } else {
    const btn = event.target;
    copyToClipboard(sessionLink, btn, '⬆ Поделиться ссылкой ещё раз');
  }
}

async function finishSession() {
  const btn = event.target;
  btn.style.background = '#41bfd0'; btn.style.borderColor = '#41bfd0';
  btn.style.color = '#ffffff'; btn.style.cursor = 'default';
  btn.textContent = 'Завершаем...'; btn.disabled = true;

  try {
    await window.FB.completeSession(currentSessionId);
    // Листенер сам обнаружит status === 'completed' и перейдёт на результаты
  } catch (e) {
    console.error('Ошибка завершения сессии:', e);
    btn.textContent = 'Ошибка — попробуйте ещё раз';
    btn.disabled = false;
  }
}
