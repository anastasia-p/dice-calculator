# DICE-калькулятор | Quality Trek

Telegram Mini App для оценки вероятности успешного внедрения изменений по методологии BCG (Boston Consulting Group).

Автор: Анастасия Пономарева, Quality Trek (quality-trek.ru)

---

## Суть продукта

DICE — фреймворк BCG для оценки инициатив по 4 параметрам:
- **D** (Duration) — частота пересмотра прогресса, коэффициент ×1
- **I** (Integrity) — компетентность команды, коэффициент ×2
- **C1** (Commitment) — поддержка руководства, коэффициент ×2
- **C2** (Commitment) — вовлеченность команды, коэффициент ×1
- **E** (Effort) — нагрузка сверх основной работы, коэффициент ×1

**Формула:** `D + 2×I + 2×C1 + C2 + E`
- Выигрыш: 7–13 (зеленый #639922)
- Беспокойство: 14–17 (желтый #BA7517)
- Проблема: 18+ (красный #E24B4A)

Каждый параметр оценивается по шкале 1–4. Минимальный балл = 7, максимальный = 28.

---

## Архитектура проекта

```
dice-calculator/
├── index.html              # точка входа, подключает все скрипты
├── CLAUDE.md               # этот файл
├── css/
│   └── main.css            # все стили
├── js/
│   ├── app.js              # роутер, глобальное состояние, DOMContentLoaded
│   ├── config.js           # константы: цвета, тексты, формула, env-переключатель
│   ├── logic.js            # ES-модуль: чистая бизнес-логика → window.DICE
│   ├── firebase.js         # ES-модуль: Firebase Realtime DB → window.FB
│   └── screens/
│       ├── start.js        # экран 1 — выбор режима
│       ├── setup.js        # экран 2 — настройка командной сессии
│       ├── calculator.js   # экран 3 — калькулятор (соло и командный)
│       ├── waiting.js      # экран 4 — ожидание участников
│       └── results.js      # экран 5 — результаты командной сессии
├── tests/
│   └── logic.test.js       # Vitest-тесты бизнес-логики
├── package.json            # только vitest, node_modules в gitignore
└── bot/                    # Telegram-бот (Python / aiogram 3, не развернут)
    ├── main.py
    ├── handlers.py
    └── firebase_client.py
```

### Как подключаются скрипты (index.html)

```html
<!-- ES-модули (firebase, logic) должны быть выше обычных скриптов -->
<script type="module" src="js/firebase.js"></script>
<script type="module" src="js/logic.js"></script>
<!-- Обычные скрипты читают window.FB и window.DICE -->
<script src="js/config.js"></script>
<script src="js/app.js"></script>
<script src="js/screens/start.js"></script>
<script src="js/screens/setup.js"></script>
<script src="js/screens/calculator.js"></script>
<script src="js/screens/waiting.js"></script>
<script src="js/screens/results.js"></script>
```

ES-модули завершают инициализацию асинхронно, поэтому `app.js` читает `window.FB` только внутри `DOMContentLoaded`.

---

## Окружения (dev / prod)

| | **prod** | **dev** |
|---|---|---|
| Ветка | `main` | `dev` |
| Хостинг | GitHub Pages (автодеплой) | локально (`python3 -m http.server`) |
| Telegram-бот | `@DICE_bcg_bot` | `@DICE_bcg_test_bot` |
| Мини-апп short name | `dice` | `test_dice` |
| Firebase | `dice-calculator-test` | `dice-calculator-test` |

**Переключение окружения** — `js/config.js`:
```js
const IS_PROD = location.hostname.includes('github.io');
const BOT_USERNAME   = IS_PROD ? 'DICE_bcg_bot'      : 'DICE_bcg_test_bot';
const APP_SHORT_NAME = IS_PROD ? 'dice'               : 'test_dice';
```

Firebase-конфиг сейчас один (test) — когда придет время выводить в реальный прод, нужно будет создать `dice-calculator-prod`, добавить конфиг в `firebase.js` и переключать по `IS_PROD`.

Ссылка на сессию строится в `setup.js`:
```js
sessionLink = 'https://t.me/' + BOT_USERNAME + '/' + APP_SHORT_NAME + '?startapp=' + id;
```

---

## Глобальное состояние (app.js)

```js
let currentMode = 'solo';    // 'solo' | 'team'
let currentSessionId = null; // ID сессии в Firebase
let currentSession = null;   // полные данные сессии (объект из Firebase)
```

Переменные объявлены в `app.js`, доступны во всех `screens/*.js` как глобальные (не через модули).

### Роутер `showScreen(name)`

- Скрывает все экраны (`screen-start`, `screen-calculator` и т.д.)
- Показывает нужный
- Вызывает `init*()` соответствующего экрана
- При уходе с экрана `waiting` вызывает `window.FB.stopListening(currentSessionId)`

### DOMContentLoaded — флоу участника

```js
const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
if (startParam && window.FB) {
  // Участник открыл приложение по ссылке
  currentMode = 'team';
  currentSessionId = startParam;
  const session = await window.FB.getSession(startParam);
  if (session?.status === 'active') {
    currentSession = session;
    // копируем labels из сессии в глобальный объект labels
    showScreen('calculator');
  } else {
    showScreen('start');
  }
}
```

---

## Бизнес-логика (js/logic.js → window.DICE)

ES-модуль с чистыми функциями, без побочных эффектов.

```js
calcScore(answers)           // D + 2I + 2C1 + C2 + E
getZone(score)               // { label, cls } — Выигрыш/Беспокойство/Проблема
getDiscrepancy(values)       // 'unanimous' | 'discord' | 'critical'
getMajorityZone(participants) // зона по большинству голосов (пессимизм при ничье)
```

`getDiscrepancy`: critical = присутствуют одновременно оценки 1 и 4.

`getMajorityZone`: при ничье выбирает более плохую зону (fail > warn > win).

Экспортируется как ES-модуль (для тестов) и через `window.DICE` (для обычных скриптов).

---

## Firebase (js/firebase.js → window.FB)

**Проект:** `dice-calculator-test` (europe-west1)

### API

```js
window.FB.userId              // Telegram userId или dev_XXXX из localStorage
window.FB.createSession(name, labelsObj, participantCount) // → sessionId (8 символов uppercase)
window.FB.getSession(sessionId)          // → объект сессии или null
window.FB.submitAnswers(sessionId, name, answers, isOrganizer)
window.FB.completeSession(sessionId)     // set status = 'completed'
window.FB.listenToSession(sessionId, cb) // realtime подписка
window.FB.stopListening(sessionId)       // отписка
```

### Идентификация пользователя

```js
function resolveUserId() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser?.id) return String(tgUser.id);
  // Фоллбек для тестов вне Telegram:
  let uid = localStorage.getItem('dice_uid');
  if (!uid) { uid = 'dev_' + Math.random().toString(36).slice(2, 10); localStorage.setItem('dice_uid', uid); }
  return uid;
}
```

### Структура данных в Firebase

```json
{
  "sessions": {
    "ABC12345": {
      "projectName": "Внедрение автотестов",
      "createdAt": 1234567890,
      "organizerId": "123456789",
      "status": "active | completed",
      "participantCount": 4,
      "labels": {
        "D": ["Раз в 1–2 недели", "Раз в 3–4 недели", "Раз в 2 месяца", "Во всех остальных случаях"],
        "I": ["...", "...", "...", "..."],
        "C1": ["...", "...", "...", "..."],
        "C2": ["...", "...", "...", "..."],
        "E": ["...", "...", "...", "..."]
      },
      "participants": {
        "123456789": {
          "name": "Анастасия",
          "colorIndex": 0,
          "isOrganizer": true,
          "answers": { "D": 1, "I": 2, "C1": 1, "C2": 2, "E": 3 },
          "submittedAt": 1234567891
        }
      }
    }
  }
}
```

### Firebase Security Rules

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": "!data.exists()",
        "status": {
          ".write": "data.parent().child('status').val() === 'active' || !data.exists()"
        },
        "participants": {
          "$userId": { ".write": true }
        }
      }
    }
  }
}
```

Логика: создать сессию может кто угодно (новый узел), завершить — только если статус `active`, ответы участника — писать всегда по своему userId.

---

## Экраны

### Экран 1 — Старт (start.js)

Две карточки:
- **Оценю сам** → `currentMode = 'solo'`, `showScreen('calculator')`
- **Работа в команде** → `showScreen('setup')`

SVG-иконки вместо emoji на карточках режимов.

---

### Экран 2 — Настройка сессии (setup.js)

Поля:
- Название проекта
- Количество участников (вместе с организатором, необязательное)
- Параметры D/I/C1/C2/E с кнопкой ✎ для редактирования вариантов

**Состояние при навигации:** `initSetup()` не сбрасывает поля, если `sessionId` уже есть. Сбрасывается только когда пользователь меняет название проекта или количество участников (`invalidateSession()` вызывается через `oninput`).

**После создания сессии:**
1. Кнопка меняется на `#41bfd0` / "Сессия создана" (disabled)
2. Появляется бирюзовая плашка с подсказкой
3. Кнопка "⬆ Поделиться" / подсказка: "Выберите чат для отправки"
4. Кнопка "⎘ Скопировать" / подсказка: "Скопировать ссылку в буфер обмена"
5. Разделитель
6. "→ Перейти к заполнению"

**Шаринг:** `navigator.share()` — нативная шторка iOS. На Android в Telegram WebView системного шита нет, открывается диалог пересылки в Telegram. Фоллбек — `navigator.clipboard`.

---

### Экран 3 — Калькулятор (calculator.js)

Единый для соло и командного режима.

**В командном режиме:**
- Карточка с названием проекта (только чтение)
- Поле "Ваше имя" (необязательно, дефолт "Участник N" по `colorIndex + 1`)
- Кнопки ✎ редактирования скрыты

**Сохранение значений при возврате:** если `currentMode === 'team'` и `vals` уже заполнены, `initCalculator()` не сбрасывает их (пользователь вернулся с экрана ожидания).

**Отправка оценки (`saveResult`):**
- Вызывает `window.FB.submitAnswers()`
- Кнопка → `#41bfd0` / "Оценка отправлена"
- Через 1 сек → `showScreen('waiting')`

---

### Экран 4 — Ожидание (waiting.js)

Реалтайм через `window.FB.listenToSession()`. Когда `session.status === 'completed'` — автоматически `showScreen('results')`.

**Для всех:**
- Название проекта
- Прогресс-бар: "Ответили X из Y" (Y = `participantCount` или фактическое количество)
- Список участников: аватарка (буква + цвет) + имя + статус (✓ / ждем)
- Плашка: "Результаты появятся когда организатор завершит сессию"

**Только для организатора** (`session.organizerId === window.FB.userId`):
- "⬆ Поделиться ссылкой ещё раз"
- Разделитель
- "⏹ Завершить сессию"

**Диалог подтверждения завершения** (если ответили не все):
- "Завершить сейчас" → `confirmFinish()` → `closeFinishDialog()` + `doFinishSession()`
- "Дождаться" → `cancelFinish()` → 2-сек анимация в `#41bfd0` + текст "Хорошо, ждем", потом возврат в исходное состояние

Важно: `confirmFinish()` вызывает `closeFinishDialog()` (без анимации), а не `cancelFinish()` — иначе кнопка "Дождаться" подсвечивалась бы при нажатии "Завершить".

---

### Экран 5 — Результаты (results.js)

Кнопки "назад" нет — экран финальный.

**Блок итоговых баллов:**
- Каждый участник: цветная аватарка + имя + балл + зона
- Итог: зона большинства (`getMajorityZone`) без числа и без префикса "Зона большинства:"

**Блок расхождений:**
- Подзаголовок: "! — стоит обсудить с командой"
- Легенда: зеленая точка (единодушно), желтая (расхождение), красная (критическое)
- Разделитель
- Для каждого параметра: буква + название + плашка статуса + кнопка ?
- Чипы: аватарка участника + его цифра

**Кнопка "⎘ Скопировать результаты"** — текстовый отчет в буфер обмена.

---

## Дизайн-система

### Цвета
| Назначение | Значение |
|---|---|
| Фон шапки | `#0d3d47` |
| Акцент (бирюзовый) | `#42becf` |
| Светлый акцент | `rgba(66,190,207,0.1)` |
| Поверхность | `#f7f7f5` |
| Граница | `#e8e8e8` |
| Темный текст | `#1a1a1a` |
| Серый текст | `#6b6b6b` |
| Кнопка после действия | `#41bfd0` |
| Hover кнопки | `#EEF8FA` |

### Состояния кнопок
- **Покой:** белый фон, рамка `#e8e8e8`, темный текст
- **Hover:** фон `#EEF8FA`
- **После действия:** фон `#41bfd0`, белый текст, 3 секунды, потом возврат в покой

### Цвета участников
```js
const PARTICIPANT_COLORS = [
  { bg: 'rgba(66,190,207,0.2)',   text: '#0a7a8a' }, // бирюзовый
  { bg: 'rgba(139,92,246,0.15)',  text: '#6d28d9' }, // фиолетовый
  { bg: 'rgba(249,115,22,0.15)',  text: '#c2410c' }, // оранжевый
  { bg: 'rgba(16,185,129,0.15)',  text: '#065f46' }, // зеленый
  { bg: 'rgba(236,72,153,0.15)',  text: '#9d174d' }, // розовый
  { bg: 'rgba(234,179,8,0.15)',   text: '#854d0e' }, // желтый
  { bg: 'rgba(99,102,241,0.15)',  text: '#3730a3' }, // индиго
  { bg: 'rgba(239,68,68,0.15)',   text: '#991b1b' }, // красный
];
// colorIndex = порядковый номер входа в сессию (0, 1, 2...)
// Цвет = PARTICIPANT_COLORS[colorIndex % PARTICIPANT_COLORS.length]
```

### Компоненты
- Карточки: `border-radius 12px`, `border 0.5px`
- Кнопки: `border-radius 10px`, `padding 11px`
- Опции параметров: radio-dot слева, цифра справа, selected = бирюзовый фон
- Progress dots: 5 точек, бирюзовые когда заполнено
- Bottom sheet (шторка): подсказки для параметров + редактирование вариантов (только соло)

---

## Тесты (Vitest)

```bash
npx vitest run   # прогнать один раз
npx vitest       # watch-mode
```

Тесты: `tests/logic.test.js` — покрывают `calcScore`, `getZone`, `getDiscrepancy`, `getMajorityZone`.

`logic.js` защищен от `window is not defined` в Node:
```js
if (typeof window !== 'undefined') { window.DICE = { ... }; }
```

---

## Деплой

- **Фронтенд:** GitHub Pages — автодеплой из ветки `main` (URL: `anastasia-p.github.io/dice-calculator`)
- **Бот:** не развернут (код есть в `bot/`, стек Python + aiogram 3)
- **База:** Firebase Realtime Database, тариф Spark (бесплатный)

Netlify удален. Тестирование ведется локально (`python3 -m http.server`) + через `@DICE_bcg_test_bot`.

---

## Аналитика (Яндекс Метрика)

Счетчик: `108173318`

| Цель | Когда |
|---|---|
| `calculator_filled` | Все 5 параметров заполнены |
| `zone_win` | Результат — Выигрыш |
| `zone_warn` | Результат — Беспокойство |
| `zone_fail` | Результат — Проблема |
| `copy_result` | Скопирован результат (соло) |
| `edit_labels` | Отредактированы варианты ответов |

---

## Важные UX-решения

1. **Результат не показывается** пока не заполнены все 5 параметров
2. **Имя участника необязательно** — дефолт "Участник N" по порядку входа (`colorIndex + 1`)
3. **Редактировать варианты ответов** может только организатор (экран 2), участники видят уже отредактированные варианты из `session.labels`
4. **Завершить сессию** может только организатор (кнопка на экране 4)
5. **Переоценки нет** — MVP-ограничение, слишком сложная логика
6. **Количество участников** — необязательное поле, если не указано, прогресс-бар показывает фактическое количество
7. **Итог командной оценки** — зона большинства (без числа), при ничье выбирается более пессимистичная зона
8. **Кнопка назад** есть на всех экранах кроме результатов

---

## Что планируется (не MVP)

- Создать `dice-calculator-prod` Firebase-проект и переключить прод на него
- Развернуть Telegram-бота (Railway или аналог)
- Firebase App Check для защиты от DoS (настраивается через Firebase Console + добавляется инициализация в `firebase.js`)
