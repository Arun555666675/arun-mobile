const state = { events: [] };

const eventGrid = document.getElementById('eventGrid');
const registerForm = document.getElementById('registerForm');
const feedbackForm = document.getElementById('feedbackForm');
const adminStats = document.getElementById('adminStats');
const loginForm = document.getElementById('loginForm');
const registerNotice = document.getElementById('registerNotice');
const feedbackNotice = document.getElementById('feedbackNotice');
const loginNotice = document.getElementById('loginNotice');

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function showNotice(element, type, message) {
  element.className = `notice ${type}`;
  element.textContent = message;
}

function renderEvents(events) {
  if (!eventGrid) return;

  eventGrid.innerHTML = events.map((event) => `
    <article class="card">
      <div class="event-image">${event.icon || '🎉'}</div>
      <div class="event-info">
        <h3>${event.name}</h3>
        <div class="list">
          <div><span>📅 ${event.date}</span><span>${event.category}</span></div>
          <div><span>📍 ${event.venue}</span><span>${event.spotsLeft} left</span></div>
          <div><span>👥 ${event.attendees} attending</span><span>${event.mode}</span></div>
        </div>
        <div class="event-footer">
          <div class="price">₹${event.price}</div>
          <button class="btn btn-primary" type="button" data-event-name="${event.name}">Register</button>
        </div>
      </div>
    </article>
  `).join('');

  eventGrid.querySelectorAll('[data-event-name]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = document.getElementById('eventSelect');
      if (selected) {
        selected.value = state.events.find((event) => event.name === button.dataset.eventName)?.id || selected.value;
      }
      document.getElementById('register').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function populateEventOptions(events) {
  const eventSelect = document.getElementById('eventSelect');
  if (!eventSelect) return;

  eventSelect.innerHTML = events.map((event) => `
    <option value="${event.id}">${event.name}</option>
  `).join('');
}

async function loadEvents() {
  const data = await fetchJSON('/api/events');
  state.events = data.events || [];
  renderEvents(state.events);
  populateEventOptions(state.events);
}

async function loadStats() {
  const data = await fetchJSON('/api/admin/stats');
  const stats = data.stats || {};

  const statCards = [
    { label: 'Total Events', value: stats.totalEvents || 0 },
    { label: 'Registrants', value: stats.totalRegistrations || 0 },
    { label: 'Feedback', value: stats.totalFeedback || 0 },
    { label: 'Students', value: stats.totalStudents || 0 },
  ];

  if (adminStats) {
    adminStats.innerHTML = statCards.map((item) => `
      <div class="stat-box">
        <strong>${item.value}</strong>
        <span>${item.label}</span>
      </div>
    `).join('');
  }
}

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const payload = {
    name: formData.get('name'),
    email: formData.get('email'),
    eventId: formData.get('eventId'),
    phone: formData.get('phone'),
    college: formData.get('college'),
    message: formData.get('message'),
  };

  try {
    await fetchJSON('/api/registrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    showNotice(registerNotice, 'success', 'Registration submitted successfully.');
    registerForm.reset();
    await loadStats();
  } catch (error) {
    showNotice(registerNotice, 'error', error.message);
  }
});

feedbackForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(feedbackForm);

  try {
    await fetchJSON('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        rating: formData.get('rating'),
        message: formData.get('message'),
      }),
    });
    showNotice(feedbackNotice, 'success', 'Thank you for your feedback!');
    feedbackForm.reset();
    await loadStats();
  } catch (error) {
    showNotice(feedbackNotice, 'error', error.message);
  }
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);

  try {
    const data = await fetchJSON('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
    });
    showNotice(loginNotice, 'success', `Welcome back, ${data.user.name}!`);
    loginForm.reset();
  } catch (error) {
    showNotice(loginNotice, 'error', error.message);
  }
});

(async function init() {
  try {
    await loadEvents();
    await loadStats();
  } catch (error) {
    console.error('Initial app load failed:', error);
  }
})();
