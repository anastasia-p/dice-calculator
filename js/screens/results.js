// Экран 5 — Результаты

function calcScore(answers) {
  return answers.D + 2 * answers.I + 2 * answers.C1 + answers.C2 + answers.E;
}

function getZone(score) {
  if (score <= 13) return { label: 'Выигрыш', cls: 'zone-win' };
  if (score <= 17) return { label: 'Беспокойство', cls: 'zone-warn' };
  return { label: 'Проблема', cls: 'zone-fail' };
}

function getDiscrepancy(values) {
  const unique = [...new Set(values)];
  if (unique.length === 1) return 'unanimous';
  if (values.includes(1) && values.includes(4)) return 'critical';
  return 'discord';
}

function avatarHtml(p) {
  const color = PARTICIPANT_COLORS[p.colorIndex % PARTICIPANT_COLORS.length];
  return '<div class="participant-avatar" style="background:' + color.bg + ';color:' + color.text + '">' +
    p.name.charAt(0).toUpperCase() + '</div>';
}

function initResults() {
  if (!currentSession) return;

  document.getElementById('results-project-name').textContent =
    currentSession.projectName || 'Без названия';

  const participants = currentSession.participants
    ? Object.values(currentSession.participants)
        .filter(p => p.answers)
        .sort((a, b) => a.colorIndex - b.colorIndex)
    : [];

  renderScores(participants);
  renderParams(participants);
}

function renderScores(participants) {
  const container = document.getElementById('results-scores');
  container.innerHTML = '';

  let totalScore = 0;
  participants.forEach(p => {
    const score = calcScore(p.answers);
    totalScore += score;
    const zone = getZone(score);
    const color = PARTICIPANT_COLORS[p.colorIndex % PARTICIPANT_COLORS.length];

    const row = document.createElement('div');
    row.className = 'results-score-row';
    row.innerHTML =
      '<div class="participant-avatar" style="background:' + color.bg + ';color:' + color.text + '">' +
        p.name.charAt(0).toUpperCase() +
      '</div>' +
      '<div class="results-participant-name">' + p.name + '</div>' +
      '<div class="results-participant-score">' + score + '</div>' +
      '<div class="result-zone ' + zone.cls + '">' + zone.label + '</div>';
    container.appendChild(row);
  });

  // Итоговая зона — по большинству голосов, при ничьей берётся более пессимистичная
  const counts = { 'zone-win': 0, 'zone-warn': 0, 'zone-fail': 0 };
  participants.forEach(p => { counts[getZone(calcScore(p.answers)).cls]++; });
  const max = Math.max(counts['zone-win'], counts['zone-warn'], counts['zone-fail']);
  const avgZone = counts['zone-fail'] === max
    ? { label: 'Проблема',     cls: 'zone-fail' }
    : counts['zone-warn'] === max
      ? { label: 'Беспокойство', cls: 'zone-warn' }
      : { label: 'Выигрыш',      cls: 'zone-win' };
  const avgZoneEl = document.getElementById('results-avg-zone');
  avgZoneEl.textContent = avgZone.label;
  const zoneColors = { 'zone-win': '#4a7c59', 'zone-warn': '#8a6a2a', 'zone-fail': '#c0392b' };
  avgZoneEl.style.color = zoneColors[avgZone.cls];
}

function renderParams(participants) {
  const paramNames = {
    D: 'Duration', I: 'Integrity',
    C1: 'Commitment — руководство', C2: 'Commitment — команда', E: 'Effort'
  };
  const container = document.getElementById('results-params');
  container.innerHTML = '';

  order.forEach(param => {
    const values = participants.map(p => p.answers[param]);
    const disc = getDiscrepancy(values);

    const badgeMap = {
      unanimous: { label: 'единодушно', cls: 'badge-unanimous' },
      discord:   { label: '! расхождение', cls: 'badge-discord' },
      critical:  { label: '! критическое', cls: 'badge-critical' },
    };
    const badge = badgeMap[disc];

    const block = document.createElement('div');
    block.className = 'results-param-block';

    // Заголовок строки
    const header = document.createElement('div');
    header.className = 'results-param-header';
    header.innerHTML =
      '<span class="param-letter">' + param + '</span>' +
      '<span class="results-param-name">' + paramNames[param] + '</span>' +
      '<span class="results-badge ' + badge.cls + '">' + badge.label + '</span>' +
      '<div class="hint-btn" onclick="openHint(\'' + param + '\')">?</div>';
    block.appendChild(header);

    // Чипы участников
    const chips = document.createElement('div');
    chips.className = 'results-chips';
    participants.forEach(p => {
      const color = PARTICIPANT_COLORS[p.colorIndex % PARTICIPANT_COLORS.length];
      const chip = document.createElement('div');
      chip.className = 'results-chip';
      chip.innerHTML =
        '<div class="results-chip-avatar" style="background:' + color.bg + ';color:' + color.text + '">' +
          p.name.charAt(0).toUpperCase() +
        '</div>' +
        '<span class="results-chip-num">' + p.answers[param] + '</span>';
      chips.appendChild(chip);
    });
    block.appendChild(chips);
    container.appendChild(block);

    // Разделитель (кроме последнего)
    if (param !== order[order.length - 1]) {
      const div = document.createElement('div');
      div.className = 'results-param-divider';
      container.appendChild(div);
    }
  });
}

function copyResults() {
  const btn = document.getElementById('copy-results-btn');
  const projectName = document.getElementById('waiting-project-name').textContent;
  const lines = ['DICE-калькулятор | Quality Trek', '================================', '', 'Проект: ' + projectName, ''];

  // TODO: сформировать полный текст после Firebase интеграции
  lines.push('Результаты командной сессии скопированы.');
  lines.push('', '================================', 'https://quality-trek.ru');

  const text = lines.join('\n');
  const onCopied = () => {
    btn.textContent = 'Скопировано';
    btn.style.background = '#41bfd0'; btn.style.borderColor = '#41bfd0';
    btn.style.color = '#fff'; btn.style.cursor = 'default';
    setTimeout(() => {
      btn.innerHTML = '<span>⎘</span> Скопировать результаты';
      btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = ''; btn.style.cursor = '';
    }, 3000);
  };
  navigator.clipboard.writeText(text).then(onCopied).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); onCopied();
  });
}
