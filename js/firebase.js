// js/firebase.js — Firebase интеграция
// Загружается как type="module", экспортирует window.FB для остальных скриптов

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js';
import { getDatabase, ref, set, get, update, onValue, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDlf8ylMrWgHE-NRIfZaKgMhdqdPO1FqZo',
  authDomain: 'dice-calculator-test.firebaseapp.com',
  databaseURL: 'https://dice-calculator-test-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'dice-calculator-test',
  storageBucket: 'dice-calculator-test.firebasestorage.app',
  messagingSenderId: '154177412932',
  appId: '1:154177412932:web:1f36e2f596434c9e198111'
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Хранилище функций отписки от листенеров
const unsubscribers = {};

// Определить ID пользователя: Telegram userId или временный из localStorage (для тестов)
function resolveUserId() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser?.id) return String(tgUser.id);
  let uid = localStorage.getItem('dice_uid');
  if (!uid) {
    uid = 'dev_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('dice_uid', uid);
  }
  return uid;
}

const userId = resolveUserId();

// Создать новую сессию (только организатор)
async function createSession(projectName, labelsObj) {
  const sessionId = Math.random().toString(36).slice(2, 10).toUpperCase();
  await set(ref(db, 'sessions/' + sessionId), {
    projectName,
    createdAt: serverTimestamp(),
    organizerId: userId,
    status: 'active',
    labels: labelsObj
  });
  return sessionId;
}

// Получить данные сессии один раз
async function getSession(sessionId) {
  const snap = await get(ref(db, 'sessions/' + sessionId));
  return snap.exists() ? snap.val() : null;
}

// Отправить ответы участника (создаёт запись если её нет)
async function submitAnswers(sessionId, name, answers, isOrganizer) {
  const partRef = ref(db, 'sessions/' + sessionId + '/participants/' + userId);
  const snap = await get(partRef);

  let colorIndex;
  if (snap.exists()) {
    colorIndex = snap.val().colorIndex;
  } else {
    const allSnap = await get(ref(db, 'sessions/' + sessionId + '/participants'));
    colorIndex = allSnap.exists() ? Object.keys(allSnap.val()).length : 0;
  }

  await set(partRef, {
    name: name || 'Участник ' + (colorIndex + 1),
    colorIndex,
    isOrganizer: !!isOrganizer,
    answers,
    submittedAt: serverTimestamp()
  });
}

// Завершить сессию (только организатор)
async function completeSession(sessionId) {
  await set(ref(db, 'sessions/' + sessionId + '/status'), 'completed');
}

// Подписаться на изменения сессии в реальном времени
function listenToSession(sessionId, callback) {
  stopListening(sessionId); // сначала отписаться от предыдущего
  unsubscribers[sessionId] = onValue(ref(db, 'sessions/' + sessionId), snap => {
    callback(snap.exists() ? snap.val() : null);
  });
}

// Отписаться от листенера
function stopListening(sessionId) {
  if (unsubscribers[sessionId]) {
    unsubscribers[sessionId]();
    delete unsubscribers[sessionId];
  }
}

window.FB = {
  userId,
  createSession,
  getSession,
  submitAnswers,
  completeSession,
  listenToSession,
  stopListening
};
