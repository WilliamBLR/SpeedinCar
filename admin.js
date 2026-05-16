const ADMIN_DRAFT_KEY = 'speedInCar.adminDraftVehicles';

let adminCars = loadLocalDrafts();
let firebaseApi = null;
let unsubscribeVehicles = null;
let currentUser = null;

const adminFields = {
  id: document.getElementById('vehicle-id'),
  brand: document.getElementById('vehicle-brand'),
  model: document.getElementById('vehicle-model'),
  year: document.getElementById('vehicle-year'),
  km: document.getElementById('vehicle-km'),
  price: document.getElementById('vehicle-price'),
  category: document.getElementById('vehicle-category'),
  status: document.getElementById('vehicle-status'),
  featured: document.getElementById('vehicle-featured'),
  engine: document.getElementById('vehicle-engine'),
  transmission: document.getElementById('vehicle-transmission'),
  traction: document.getElementById('vehicle-traction'),
  body: document.getElementById('vehicle-body'),
  fuel: document.getElementById('vehicle-fuel'),
  location: document.getElementById('vehicle-location'),
  cover: document.getElementById('vehicle-cover'),
  images: document.getElementById('vehicle-images'),
  tags: document.getElementById('vehicle-tags'),
  highlights: document.getElementById('vehicle-highlights'),
};

function loadLocalDrafts() {
  try {
    const stored = localStorage.getItem(ADMIN_DRAFT_KEY);
    return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(window.SPEEDINCAR_INVENTORY || []));
  } catch {
    return JSON.parse(JSON.stringify(window.SPEEDINCAR_INVENTORY || []));
  }
}

function saveLocalDrafts() {
  localStorage.setItem(ADMIN_DRAFT_KEY, JSON.stringify(adminCars));
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function splitLines(value) {
  return String(value || '')
    .split(/[\n,;]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function money(value) {
  return `$${(Number(value) || 0).toLocaleString('es-CL')}`;
}

function normalizeAdminCar(car) {
  const cover = car.cover || (Array.isArray(car.images) ? car.images[0] : '') || 'images/logo.png';
  return {
    id: car.id,
    category: car.category || 'suv',
    brand: car.brand || '',
    model: car.model || '',
    year: Number(car.year) || '',
    km: Number(car.km) || '',
    price: Number(car.price) || '',
    status: car.status || 'Disponible',
    fuel: car.fuel || 'Bencina',
    engine: car.engine || '',
    transmission: car.transmission || '',
    traction: car.traction || '',
    body: car.body || '',
    location: car.location || 'Santiago',
    cover,
    images: [...new Set([cover, ...splitLines(car.images)].filter(Boolean))],
    tags: splitLines(car.tags),
    highlights: splitLines(car.highlights),
    featured: Boolean(car.featured),
  };
}

function showMessage(message) {
  const el = document.getElementById('admin-message');
  if (!el) return;
  el.textContent = message;
  window.clearTimeout(showMessage.timer);
  showMessage.timer = window.setTimeout(() => {
    el.textContent = '';
  }, 3500);
}

function showLoginMessage(message) {
  const el = document.getElementById('admin-login-message');
  if (el) el.textContent = message;
}

function setModeLabel() {
  const mode = document.getElementById('admin-mode');
  const setup = document.getElementById('admin-setup');
  const login = document.getElementById('admin-login');
  const workspace = document.getElementById('admin-workspace');
  const signout = document.getElementById('admin-signout');
  const save = document.getElementById('vehicle-save');
  const configured = Boolean(firebaseApi?.isFirebaseConfigured?.());

  if (mode) mode.textContent = configured ? (currentUser ? 'Firebase activo' : 'Firebase conectado') : 'Modo local';
  if (save) save.textContent = configured && currentUser ? 'Guardar en Firebase' : 'Guardar borrador local';
  setup?.classList.toggle('visible', !configured);
  login?.classList.toggle('visible', configured && !currentUser);
  workspace?.classList.toggle('visible', !configured || Boolean(currentUser));
  signout?.classList.toggle('visible', configured && Boolean(currentUser));
}

function resetForm() {
  Object.values(adminFields).forEach(field => {
    if (field) field.value = '';
  });
  adminFields.category.value = 'suv';
  adminFields.status.value = 'Disponible';
  adminFields.featured.value = 'false';
  adminFields.fuel.value = 'Bencina';
  adminFields.location.value = 'Santiago';
}

function fillForm(car) {
  const clean = normalizeAdminCar(car);
  adminFields.id.value = clean.id;
  adminFields.brand.value = clean.brand;
  adminFields.model.value = clean.model;
  adminFields.year.value = clean.year;
  adminFields.km.value = clean.km;
  adminFields.price.value = clean.price;
  adminFields.category.value = clean.category;
  adminFields.status.value = clean.status;
  adminFields.featured.value = String(Boolean(clean.featured));
  adminFields.engine.value = clean.engine;
  adminFields.transmission.value = clean.transmission;
  adminFields.traction.value = clean.traction;
  adminFields.body.value = clean.body;
  adminFields.fuel.value = clean.fuel;
  adminFields.location.value = clean.location;
  adminFields.cover.value = clean.cover;
  adminFields.images.value = clean.images.join('\n');
  adminFields.tags.value = clean.tags.join('\n');
  adminFields.highlights.value = clean.highlights.join('\n');
  adminFields.brand.focus();
}

function carFromForm() {
  const fallbackId = slugify(`${adminFields.brand.value}-${adminFields.model.value}-${adminFields.year.value}`);
  const id = adminFields.id.value || fallbackId || `auto-${Date.now()}`;
  const cover = adminFields.cover.value.trim();
  const images = [...new Set([cover, ...splitLines(adminFields.images.value)].filter(Boolean))];

  return {
    id,
    category: adminFields.category.value,
    brand: adminFields.brand.value.trim(),
    model: adminFields.model.value.trim(),
    year: Number(adminFields.year.value),
    km: Number(adminFields.km.value),
    price: Number(adminFields.price.value),
    status: adminFields.status.value,
    fuel: adminFields.fuel.value.trim() || 'Bencina',
    engine: adminFields.engine.value.trim(),
    transmission: adminFields.transmission.value.trim(),
    traction: adminFields.traction.value.trim(),
    body: adminFields.body.value.trim(),
    location: adminFields.location.value.trim() || 'Santiago',
    cover,
    images,
    tags: splitLines(adminFields.tags.value),
    highlights: splitLines(adminFields.highlights.value),
    featured: adminFields.featured.value === 'true',
  };
}

function renderList() {
  const list = document.getElementById('admin-list');
  const count = document.getElementById('admin-count');
  if (count) count.textContent = String(adminCars.length);
  if (!list) return;

  list.innerHTML = adminCars.length ? adminCars.map(car => {
    const clean = normalizeAdminCar(car);
    return `
      <article class="admin-list-item">
        <img src="${clean.cover}" alt="${clean.brand} ${clean.model}" />
        <div>
          <strong>${clean.brand} ${clean.model}</strong>
          <span>${clean.year} &middot; ${money(clean.price)} &middot; ${clean.status}</span>
          <small>${clean.km.toLocaleString('es-CL')} km &middot; ${clean.location}</small>
        </div>
        <button type="button" data-edit="${clean.id}">Editar</button>
      </article>
    `;
  }).join('') : '<p class="admin-empty">No hay autos publicados.</p>';
}

async function uploadSelectedImages(carId) {
  if (!firebaseApi?.isFirebaseConfigured?.() || !currentUser) return;

  const coverFile = document.getElementById('vehicle-cover-file').files[0];
  const galleryFiles = [...document.getElementById('vehicle-gallery-files').files];
  const uploaded = [];

  if (coverFile) {
    const coverUrl = await firebaseApi.uploadVehicleImage(carId, coverFile);
    adminFields.cover.value = coverUrl;
    uploaded.push(coverUrl);
  }

  for (const file of galleryFiles) {
    uploaded.push(await firebaseApi.uploadVehicleImage(carId, file));
  }

  if (uploaded.length) {
    const existing = splitLines(adminFields.images.value);
    adminFields.images.value = [...new Set([...uploaded, ...existing])].join('\n');
  }
}

async function saveVehicle(event) {
  event.preventDefault();
  let car = carFromForm();

  try {
    await uploadSelectedImages(car.id);
    car = carFromForm();

    if (firebaseApi?.isFirebaseConfigured?.() && currentUser) {
      await firebaseApi.saveVehicle(car);
      showMessage('Ficha guardada en Firebase.');
    } else {
      const index = adminCars.findIndex(item => item.id === car.id);
      if (index >= 0) adminCars[index] = car;
      else adminCars.unshift(car);
      saveLocalDrafts();
      renderList();
      showMessage('Ficha guardada en modo local.');
    }
    resetForm();
  } catch (error) {
    showMessage(error.message || 'No se pudo guardar la ficha.');
  }
}

async function deleteSelectedVehicle() {
  const id = adminFields.id.value;
  if (!id) {
    showMessage('Selecciona una ficha para eliminar.');
    return;
  }

  if (!window.confirm('Eliminar esta ficha?')) return;

  try {
    if (firebaseApi?.isFirebaseConfigured?.() && currentUser) {
      await firebaseApi.deleteVehicle(id);
      showMessage('Ficha eliminada de Firebase.');
    } else {
      adminCars = adminCars.filter(car => car.id !== id);
      saveLocalDrafts();
      renderList();
      showMessage('Ficha eliminada del borrador local.');
    }
    resetForm();
  } catch (error) {
    showMessage(error.message || 'No se pudo eliminar la ficha.');
  }
}

async function setupFirebase() {
  const config = window.SPEEDINCAR_FIREBASE_CONFIG || {};
  if (!config.apiKey || !config.projectId || !config.appId) {
    setModeLabel();
    renderList();
    return;
  }

  try {
    firebaseApi = await import('./firebase-service.js');
    if (!firebaseApi.isFirebaseConfigured()) {
      setModeLabel();
      renderList();
      return;
    }

    firebaseApi.watchAuth(user => {
      currentUser = firebaseApi.isAllowedAdmin(user) ? user : null;
      setModeLabel();

      if (unsubscribeVehicles) unsubscribeVehicles();
      if (currentUser) {
        unsubscribeVehicles = firebaseApi.subscribeVehicles(cars => {
          adminCars = cars;
          renderList();
        }, error => showMessage(error.message || 'No se pudo leer Firestore.'));
      } else {
        renderList();
      }
    });
  } catch (error) {
    console.warn('Firebase no disponible', error);
    setModeLabel();
    renderList();
  }
}

function setupEvents() {
  document.getElementById('vehicle-form')?.addEventListener('submit', saveVehicle);
  document.getElementById('vehicle-new')?.addEventListener('click', resetForm);
  document.getElementById('vehicle-delete')?.addEventListener('click', deleteSelectedVehicle);

  document.getElementById('admin-list')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-edit]');
    if (!btn) return;
    const car = adminCars.find(item => item.id === btn.dataset.edit);
    if (car) fillForm(car);
  });

  document.getElementById('admin-login-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    showLoginMessage('');
    try {
      await firebaseApi.signInAdmin(
        document.getElementById('admin-email').value,
        document.getElementById('admin-password').value
      );
    } catch (error) {
      showLoginMessage(error.message || 'No se pudo iniciar sesion.');
    }
  });

  document.getElementById('admin-signout')?.addEventListener('click', async () => {
    if (firebaseApi?.signOutAdmin) await firebaseApi.signOutAdmin();
  });
}

resetForm();
setupEvents();
setupFirebase();
renderList();
