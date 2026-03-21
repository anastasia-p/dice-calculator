// Экран 4 — Ожидание

// Заглушка: будет заменена на данные из Firebase
let waitingParticipants = [];
let isOrganizer = false;

function initWaiting() {
  // Название проекта
  const projectName = document.getElementById('project-name-display').textContent || 'Без названия';
  document.getElementById('waiting-project-name').textContent = projectName;

  // Заглушка: организатор уже ответил
  const participantName = document.getElementById('participant-name').value.trim() || 'Участник 1';
  waitingParticipants = [
    { name: participantName, colorIndex: 0, submitted: true, isOrganizer: true }
  ];
  isOrganizer = true;

  renderWaiting();

  // Показываем кнопки организатора
  document.getElementById('waiting-organizer-actions').style.display = isOrganizer ? 'flex' : 'none';
}

function renderWaiting() {
  const total = waitingParticipants.length;
  const answered = waitingParticipants.filter(p => p.submitted).length;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  document.getElementById('waiting-progress-text').textContent = 'Ответили ' + answered + ' из ' + total;
  document.getElementById('waiting-bar-fill').style.width = pct + '%';

  const container = document.getElementById('waiting-participants');
  container.innerHTML = '';
  waitingParticipants.forEach(p => {
    const color = PARTICIPANT_COLORS[p.colorIndex % PARTICIPANT_COLORS.length];
    const row = document.createElement('div');
    row.className = 'waiting-participant-row';
    row.innerHTML =
      '<div class="participant-avatar" style="background:' + color.bg + ';color:' + color.text + '">' +
        p.name.charAt(0).toUpperCase() +
      '</div>' +
      '<div class="waiting-participant-name">' + p.name + (p.isOrganizer ? ' <span class="organizer-badge">организатор</span>' : '') + '</div>' +
      '<div class="waiting-status ' + (p.submitted ? 'waiting-status-done' : 'waiting-status-wait') + '">' +
        (p.submitted ? '✓' : 'ждем') +
      '</div>';
    container.appendChild(row);
  });
}

function shareAgain() {
  if (!sessionLink) return;
  if (navigator.share) {
    navigator.share({ title: 'DICE-калькулятор', url: sessionLink });
  } else {
    const btn = event.target;
    copyToClipboard(sessionLink, btn, '⬆ Поделиться ссылкой ещё раз');
  }
}

function finishSession() {
  const btn = event.target;
  btn.style.background = '#41bfd0'; btn.style.borderColor = '#41bfd0';
  btn.style.color = '#ffffff'; btn.style.cursor = 'default';
  btn.textContent = 'Сессия завершена'; btn.disabled = true;
  setTimeout(() => { showScreen('results'); }, 800);
}
