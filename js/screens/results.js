// Экран 5 — Результаты
// Чистые функции живут в js/logic.js → window.DICE
const calcScore      = (answers)      => window.DICE.calcScore(answers);
const getZone        = (score)        => window.DICE.getZone(score);
const getDiscrepancy = (values)       => window.DICE.getDiscrepancy(values);
const getMajorityZone = (participants) => window.DICE.getMajorityZone(participants);

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

  // Итоговая зона — по большинству голосов
  const avgZone = getMajorityZone(participants);
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
  const projectName = currentSession?.projectName || 'Без названия';
  const date = new Date().toLocaleDateString('ru-RU');

  const participants = currentSession?.participants
    ? Object.values(currentSession.participants)
        .filter(p => p.answers)
        .sort((a, b) => a.colorIndex - b.colorIndex)
    : [];

  const majorityZone = participants.length ? getMajorityZone(participants).label : '—';

  const discLabels = { unanimous: 'единодушно', discord: 'расхождение', critical: 'критическое' };
  const paramNames = { D: 'D ', I: 'I ', C1: 'C1', C2: 'C2', E: 'E ' };

  const lines = [
    'DICE-калькулятор | Quality Trek',
    '================================', '',
    'Проект: ' + projectName,
    'Дата:   ' + date, '',
    'ИТОГ',
    majorityZone, '',
    'ОЦЕНКИ УЧАСТНИКОВ',
  ];

  participants.forEach(p => {
    const score = calcScore(p.answers);
    const zone = getZone(score);
    lines.push(p.name + ' — ' + score + '  (' + zone.label + ')');
  });

  lines.push('', 'РАСХОЖДЕНИЯ ПО ПАРАМЕТРАМ');
  order.forEach(param => {
    const values = participants.map(p => p.answers[param]);
    const disc = discLabels[getDiscrepancy(values)];
    lines.push(paramNames[param] + '  ' + disc.padEnd(14) + values.join(' / '));
  });

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
