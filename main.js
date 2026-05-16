const WHATSAPP_NUMBER = '56998261166';
const WSP_BASE = `https://wa.me/${WHATSAPP_NUMBER}?text=`;

const state = {
  filter: 'all',
  query: '',
  sort: 'featured',
  currentCarId: null,
};

let inventory = (window.SPEEDINCAR_INVENTORY || []).map(normalizeCar);
let remoteUnsubscribe = null;

function currency(value) {
  const number = Number(value) || 0;
  return `$${number.toLocaleString('es-CL')}`;
}

function kmLabel(value) {
  const number = Number(value) || 0;
  return `${number.toLocaleString('es-CL')} km`;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(/[\n,;]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function uniqueList(list) {
  return [...new Set(list.filter(Boolean))];
}

function normalizeCar(car) {
  const cover = car.cover || (Array.isArray(car.images) ? car.images[0] : '') || 'images/logo.png';
  const images = uniqueList([cover, ...normalizeList(car.images)]).map(src => src.replace(/\\/g, '/'));

  return {
    id: car.id,
    category: car.category || 'suv',
    brand: car.brand || 'Marca',
    model: car.model || 'Modelo',
    year: Number(car.year) || 0,
    km: Number(car.km) || 0,
    price: Number(car.price) || 0,
    status: car.status || 'Disponible',
    fuel: car.fuel || 'Por confirmar',
    engine: car.engine || 'Por confirmar',
    transmission: car.transmission || 'Por confirmar',
    traction: car.traction || 'Por confirmar',
    body: car.body || 'Por confirmar',
    location: car.location || 'Santiago',
    cover,
    images,
    tags: normalizeList(car.tags),
    highlights: normalizeList(car.highlights),
    featured: Boolean(car.featured),
  };
}

function categoryLabel(category) {
  return {
    suv: 'SUV',
    hatchback: 'Sed\u00e1n / Hatch',
  }[category] || category;
}

function statusClass(status) {
  return normalizeText(status).replace(/\s+/g, '-');
}

function whatsappLink(car, intent = 'availability') {
  const title = `${car.brand} ${car.model} ${car.year}`.trim();
  const messages = {
    availability: `Hola Speed in Car, me interesa el ${title} publicado en ${currency(car.price)}. \u00bfSigue disponible?`,
    video: `Hola Speed in Car, \u00bfme pueden enviar un video del ${title}?`,
    visit: `Hola Speed in Car, quiero agendar una visita para ver el ${title}.`,
  };

  return WSP_BASE + encodeURIComponent(messages[intent] || messages.availability);
}

function carUrl(car) {
  return `/auto?id=${encodeURIComponent(car.id)}`;
}

function setImageFallback(scope = document) {
  scope.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = 'true';
      img.src = 'images/logo.png';
    });
  });
}

function carSearchText(car) {
  return normalizeText([
    car.brand,
    car.model,
    car.year,
    car.price,
    car.km,
    car.status,
    car.engine,
    car.transmission,
    car.body,
    categoryLabel(car.category),
    ...car.tags,
    ...car.highlights,
  ].join(' '));
}

function getFilteredCars() {
  const query = normalizeText(state.query);
  let cars = inventory.filter(car => {
    const matchesFilter = state.filter === 'all' || car.category === state.filter;
    const matchesQuery = !query || carSearchText(car).includes(query);
    return matchesFilter && matchesQuery;
  });

  cars = [...cars].sort((a, b) => {
    if (state.sort === 'price-asc') return a.price - b.price;
    if (state.sort === 'price-desc') return b.price - a.price;
    if (state.sort === 'year-desc') return b.year - a.year;
    if (state.sort === 'km-asc') return a.km - b.km;
    return Number(b.featured) - Number(a.featured) || b.year - a.year;
  });

  return cars;
}

function buildCard(car) {
  const title = `${car.brand} ${car.model}`;
  const tags = uniqueList([categoryLabel(car.category), car.transmission, ...car.tags]).slice(0, 3);

  return `
    <article class="car-card" data-car-id="${escapeHTML(car.id)}">
      <a href="${carUrl(car)}" class="car-image-button" aria-label="Ver ficha de ${escapeHTML(title)}">
        <img src="${escapeHTML(car.cover)}" alt="${escapeHTML(title)}" class="car-img" loading="lazy" />
        <span class="car-badge ${escapeHTML(statusClass(car.status))}">${escapeHTML(car.status)}</span>
        <span class="car-shine"></span>
      </a>
      <div class="car-info">
        <div class="car-kicker">${escapeHTML(car.brand)}</div>
        <h3>${escapeHTML(car.model)}</h3>
        <div class="car-meta">
          <span>${escapeHTML(String(car.year))}</span>
          <span>${escapeHTML(kmLabel(car.km))}</span>
          <span>${escapeHTML(car.location)}</span>
        </div>
        <div class="tag-row">
          ${tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}
        </div>
        <div class="car-footer">
          <strong>${escapeHTML(currency(car.price))}</strong>
          <button type="button" class="icon-btn open-modal-btn" data-car-id="${escapeHTML(car.id)}" aria-label="Abrir detalle">+</button>
        </div>
        <div class="car-actions">
          <a href="${whatsappLink(car)}" target="_blank" class="btn btn-whatsapp">Consultar</a>
          <a href="${carUrl(car)}" class="btn btn-outline">Ver ficha</a>
        </div>
      </div>
    </article>
  `;
}

function renderCards(target, cars) {
  if (!target) return;
  target.innerHTML = cars.length
    ? cars.map(buildCard).join('')
    : '<p class="catalog-empty">No hay vehiculos para esta busqueda.</p>';
  setImageFallback(target);
  setupRevealTargets(target.querySelectorAll('.car-card'));
  revealOnScroll();
}

function renderHome() {
  const count = document.getElementById('inventory-count');
  const grid = document.getElementById('home-featured-grid');
  if (count) count.textContent = String(inventory.length);
  if (grid) {
    const featured = inventory
      .filter(car => car.featured)
      .concat(inventory.filter(car => !car.featured))
      .slice(0, 3);
    renderCards(grid, featured);
  }
}

function renderCatalog() {
  const grid = document.getElementById('cars-grid');
  if (!grid) return;

  const searchInput = document.getElementById('vehicle-search');
  if (searchInput) state.query = searchInput.value;

  const cars = getFilteredCars();
  renderCards(grid, cars);

  const total = document.getElementById('catalog-total');
  const count = document.getElementById('catalog-count');
  if (total) total.textContent = String(inventory.length);
  if (count) count.textContent = `${cars.length} veh\u00edculo${cars.length === 1 ? '' : 's'} encontrados`;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === state.filter);
  });
}

function spec(label, value) {
  return `
    <div class="modal-spec-item">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </div>
  `;
}

function openModal(id) {
  const car = inventory.find(item => item.id === id);
  const modal = document.getElementById('car-modal');
  if (!car || !modal) return;

  state.currentCarId = id;

  const mainImg = document.getElementById('modal-main-img');
  const thumbs = document.getElementById('modal-thumbs');
  if (!mainImg || !thumbs) return;

  mainImg.src = car.images[0] || car.cover;
  mainImg.alt = `${car.brand} ${car.model}`;

  thumbs.innerHTML = car.images.length > 1
    ? car.images.map((src, index) => `
      <button type="button" class="modal-thumb ${index === 0 ? 'active' : ''}" data-src="${escapeHTML(src)}" aria-label="Foto ${index + 1}">
        <img src="${escapeHTML(src)}" alt="${escapeHTML(car.model)} foto ${index + 1}" />
      </button>
    `).join('')
    : '';

  thumbs.querySelectorAll('.modal-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      thumbs.querySelectorAll('.modal-thumb').forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      mainImg.src = btn.dataset.src;
    });
  });

  document.getElementById('modal-status').textContent = car.status;
  document.getElementById('modal-brand').textContent = car.brand;
  document.getElementById('modal-title').textContent = car.model;
  document.getElementById('modal-price').textContent = currency(car.price);
  document.getElementById('modal-specs-grid').innerHTML =
    spec('A\u00f1o', String(car.year)) +
    spec('Kilometraje', kmLabel(car.km)) +
    spec('Motor', car.engine) +
    spec('Transmisi\u00f3n', car.transmission) +
    spec('Tracci\u00f3n', car.traction) +
    spec('Carrocer\u00eda', car.body);

  document.getElementById('modal-features').innerHTML = car.highlights.length
    ? car.highlights.map(item => `<li>${escapeHTML(item)}</li>`).join('')
    : '<li>Informaci&oacute;n detallada por confirmar.</li>';

  document.getElementById('modal-wsp-btn').href = whatsappLink(car, 'availability');
  document.getElementById('modal-video-btn').href = whatsappLink(car, 'video');
  document.getElementById('modal-visit-btn').href = whatsappLink(car, 'visit');

  setImageFallback(modal);
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('car-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  state.currentCarId = null;
}

function navigateModal(direction) {
  if (!state.currentCarId || !inventory.length) return;
  const index = inventory.findIndex(car => car.id === state.currentCarId);
  const next = inventory[(index + direction + inventory.length) % inventory.length];
  if (next) openModal(next.id);
}

function setupCatalogControls() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter || 'all';
      renderCatalog();
    });
  });

  const search = document.getElementById('vehicle-search');
  if (search) search.value = '';
  search?.addEventListener('input', event => {
    state.query = event.target.value;
    renderCatalog();
  });
  search?.addEventListener('search', event => {
    state.query = event.target.value;
    renderCatalog();
  });

  const sort = document.getElementById('vehicle-sort');
  sort?.addEventListener('change', event => {
    state.sort = event.target.value;
    renderCatalog();
  });
}

function setupModal() {
  const modal = document.getElementById('car-modal');
  const close = document.getElementById('modal-close');
  const prev = document.getElementById('modal-prev');
  const next = document.getElementById('modal-next');
  if (!modal || !close || !prev || !next) return;

  document.addEventListener('click', event => {
    const btn = event.target.closest('.open-modal-btn');
    if (!btn) return;
    event.preventDefault();
    openModal(btn.dataset.carId);
  });

  close.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  prev.addEventListener('click', () => navigateModal(-1));
  next.addEventListener('click', () => navigateModal(1));

  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('open')) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowLeft') navigateModal(-1);
    if (event.key === 'ArrowRight') navigateModal(1);
  });
}

function setupNavbar() {
  const header = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav-links');
  if (!header || !hamburger || !nav) return;

  const page = document.body.dataset.page || 'home';
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.navPage === page);
  });

  const updateHeader = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('mobile-open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('mobile-open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth',
      });
    });
  });
}

function setupRevealTargets(targets) {
  targets.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.transitionDelay = `${(index % 4) * 50}ms`;
  });
}

function revealOnScroll() {
  document.querySelectorAll('.reveal').forEach(element => {
    if (element.getBoundingClientRect().top < window.innerHeight - 80) {
      element.classList.add('visible');
    }
  });
}

function setupWhatsappFloat() {
  const btn = document.getElementById('wsp-float');
  if (!btn) return;
  const update = () => {
    btn.classList.toggle('visible', window.scrollY > 420);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function updateFooterYear() {
  document.querySelectorAll('#footer-year').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });
}

function hydrateFromRemote(cars) {
  if (!Array.isArray(cars) || !cars.length) return;
  inventory = cars.map(normalizeCar);
  renderHome();
  renderCatalog();
}

async function setupRemoteInventory() {
  const config = window.SPEEDINCAR_FIREBASE_CONFIG || {};
  if (!config.apiKey || !config.projectId || !config.appId) return;

  try {
    const firebase = await import('./firebase-service.js');
    if (!firebase.isFirebaseConfigured()) return;
    remoteUnsubscribe = firebase.subscribeVehicles(hydrateFromRemote, error => {
      console.warn('No se pudo leer inventario remoto', error);
    });
  } catch (error) {
    console.warn('Firebase no disponible', error);
  }
}

function init() {
  renderHome();
  setupCatalogControls();
  renderCatalog();
  setupModal();
  setupNavbar();
  setupSmoothScroll();
  setupWhatsappFloat();
  updateFooterYear();
  setupRemoteInventory();
  setupRevealTargets(document.querySelectorAll('.service-card, .timeline-item, .trust-grid, .contact-layout'));
  revealOnScroll();
  window.addEventListener('scroll', revealOnScroll, { passive: true });
  setImageFallback();
}

init();
