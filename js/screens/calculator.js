const vals = { D: null, I: null, C1: null, C2: null, E: null };
let currentScore = null, currentZone = '', currentDesc = '', currentZoneObj = null;
let editingParam = null;

function setIdleStyle(btn, label) {
  btn.style.background = '#ffffff'; btn.style.borderColor = '#e8e8e8';
  btn.style.color = '#1a1a1a'; btn.style.cursor = 'pointer';
  btn.innerHTML = label; btn.disabled = false;
  btn.onmouseenter = () => { btn.style.background = '#EEF8FA'; };
  btn.onmouseleave = () => { btn.style.background = '#ffffff'; };
}

function renderOptions(param) {
  const container = document.getElementById(param);
  container.innerHTML = '';
  labels[param].forEach((text, i) => {
    const div = document.createElement('div');
    div.className = 'option' + (vals[param] === i + 1 ? ' selected' : '');
    div.onclick = () => sel(param, i + 1, div);
    div.innerHTML = '<div class="option-dot"></div><div class="option-text">' + text + '</div><span class="option-num">' + (i + 1) + '</span>';
    container.appendChild(div);
  });
}

function openHint(p) {
  const h = hints[p];
  document.getElementById('hint-letter').textContent = p;
  document.getElementById('hint-title').textContent = h.title;
  document.getElementById('hint-weight').textContent = h.weight;
  document.getElementById('hint-body').textContent = h.body;
  document.getElementById('overlay').classList.add('open');
  document.getElementById('hint-sheet').classList.add('open');
}

function openEdit(p) {
  editingParam = p;
  document.getElementById('edit-sheet-title').textContent = 'Варианты для ' + p;
  const fields = document.getElementById('edit-fields');
  fields.innerHTML = '';
  labels[p].forEach((text, i) => {
    const row = document.createElement('div');
    row.className = 'edit-field-row';
    row.innerHTML = '<span class="edit-field-num">' + (i + 1) + '</span><input class="edit-field-input" id="ef-' + i + '" value="' + text + '" maxlength="80" />';
    fields.appendChild(row);
  });
  setIdleStyle(document.getElementById('edit-save-btn'), 'Применить');
  document.getElementById('overlay').classList.add('open');
  document.getElementById('edit-sheet').classList.add('open');
}

function applyEdit() {
  if (!editingParam) return;
  for (let i = 0; i < 4; i++) {
    const val = document.getElementById('ef-' + i).value.trim();
    if (val) labels[editingParam][i] = val;
  }
  renderOptions(editingParam);
  if (typeof ym !== 'undefined') ym(108173318, 'reachGoal', 'edit_labels', { param: editingParam });
  const btn = document.getElementById('edit-save-btn');
  btn.onmouseenter = null; btn.onmouseleave = null;
  btn.style.background = '#41bfd0'; btn.style.borderColor = '#41bfd0';
  btn.style.color = '#ffffff'; btn.style.cursor = 'default';
  btn.textContent = 'Применено'; btn.disabled = true;
  setTimeout(() => { setIdleStyle(btn, 'Применить'); }, 3000);
}

function closeAll() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('hint-sheet').classList.remove('open');
  document.getElementById('edit-sheet').classList.remove('open');
}

function sel(param, val, el) {
  vals[param] = val;
  document.querySelectorAll('#' + param + ' .option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  update();
}

function setIdleBtn() {
  setIdleStyle(document.getElementById('save-btn'), '<span>⎘</span> Скопировать результат');
}

function applyZoneToInput(z) {
  const input = document.getElementById('project-name');
  input.onfocus = () => { input.style.borderColor = z.barColor; input.style.boxShadow = '0 0 0 3px ' + z.inputShadow; };
  input.onblur = () => { input.style.borderColor = ''; input.style.boxShadow = ''; };
}

function update() {
  const done = order.filter(p => vals[p] !== null).length;
  order.forEach(p => { document.getElementById('pd-' + p).classList.toggle('done', vals[p] !== null); });
  const allDone = done === 5;
  document.getElementById('progress-label').textContent = allDone ? 'Все параметры заполнены' : 'Заполнено ' + done + ' из 5';
  const wasDone = document.getElementById('result-filled').style.display === 'block';
  document.getElementById('result-empty').style.display = allDone ? 'none' : 'block';
  document.getElementById('result-filled').style.display = allDone ? 'block' : 'none';
  if (!allDone) return;
  if (!wasDone && typeof ym !== 'undefined') ym(108173318, 'reachGoal', 'calculator_filled');

  const score = vals.D + 2 * vals.I + 2 * vals.C1 + vals.C2 + vals.E;
  currentScore = score;
  document.getElementById('score').textContent = score;
  document.getElementById('chip-D').textContent = 'D=' + vals.D;
  document.getElementById('chip-I').textContent = '2xI=' + (2 * vals.I);
  document.getElementById('chip-C1').textContent = '2xC1=' + (2 * vals.C1);
  document.getElementById('chip-C2').textContent = 'C2=' + vals.C2;
  document.getElementById('chip-E').textContent = 'E=' + vals.E;
  const pct = Math.round(((score - 7) / 21) * 100);
  document.getElementById('bar').style.width = pct + '%';

  const zone = document.getElementById('zone'), desc = document.getElementById('desc');
  if (score <= 13) {
    document.getElementById('bar').style.background = zones.win.barColor;
    zone.className = 'result-zone zone-win'; zone.textContent = 'Выигрыш';
    currentZone = 'Выигрыш (7–13)'; currentDesc = 'Высокая вероятность успеха. Проект хорошо подготовлен — команда компетентна, руководство поддерживает, прогресс под контролем.'; currentZoneObj = zones.win;
    if (typeof ym !== 'undefined') ym(108173318, 'reachGoal', 'zone_win');
  } else if (score <= 17) {
    document.getElementById('bar').style.background = zones.warn.barColor;
    zone.className = 'result-zone zone-warn'; zone.textContent = 'Беспокойство';
    currentZone = 'Беспокойство (14–17)'; currentDesc = 'Рискованная зона. Нужно внимательно следить и устранять слабые места — иначе проект может забуксовать.'; currentZoneObj = zones.warn;
    if (typeof ym !== 'undefined') ym(108173318, 'reachGoal', 'zone_warn');
  } else {
    document.getElementById('bar').style.background = zones.fail.barColor;
    zone.className = 'result-zone zone-fail'; zone.textContent = 'Проблема';
    currentZone = 'Проблема (18+)'; currentDesc = 'Высокий риск провала. Особенно опасно от 19 баллов — стоит пересмотреть команду, поддержку или сам формат инициативы.'; currentZoneObj = zones.fail;
    if (typeof ym !== 'undefined') ym(108173318, 'reachGoal', 'zone_fail');
  }
  desc.textContent = currentDesc;
  setIdleBtn();
  applyZoneToInput(currentZoneObj);
}

function saveResult() {
  const name = document.getElementById('project-name').value.trim() || 'Без названия';
  const date = new Date().toLocaleDateString('ru-RU');
  const lines = [
    'DICE-калькулятор | Quality Trek', '================================', '',
    'Проект: ' + name, 'Дата:   ' + date, '',
    'ПАРАМЕТРЫ', '---------',
    'D  (Duration):', vals.D + ' — ' + labels.D[vals.D - 1], '',
    'I  (Integrity):', vals.I + ' — ' + labels.I[vals.I - 1], '',
    'C1 (Commitment — рук-во):', vals.C1 + ' — ' + labels.C1[vals.C1 - 1], '',
    'C2 (Commitment — команда):', vals.C2 + ' — ' + labels.C2[vals.C2 - 1], '',
    'E  (Effort):', vals.E + ' — ' + labels.E[vals.E - 1],
    '', 'РЕЗУЛЬТАТ', '---------',
    'Формула: D + 2×I + 2×C1 + C2 + E',
    '       = ' + vals.D + ' + ' + (2 * vals.I) + ' + ' + (2 * vals.C1) + ' + ' + vals.C2 + ' + ' + vals.E + ' = ' + currentScore,
    '', 'Зона:    ' + currentZone, 'Вывод:   ' + currentDesc,
    '', '================================', 'https://quality-trek.ru'
  ];
  const text = lines.join('\n');
  const btn = document.getElementById('save-btn');

  const onCopied = () => {
    if (typeof ym !== 'undefined') ym(108173318, 'reachGoal', 'copy_result');
    btn.onmouseenter = null; btn.onmouseleave = null;
    btn.style.background = '#41bfd0'; btn.style.borderColor = '#41bfd0';
    btn.style.color = '#ffffff'; btn.style.cursor = 'default';
    btn.textContent = 'Скопировано';
    setTimeout(() => { setIdleBtn(); }, 3000);
  };

  navigator.clipboard.writeText(text).then(onCopied).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    onCopied();
  });
}

function initCalculator() {
  order.forEach(p => renderOptions(p));
  update();
}
