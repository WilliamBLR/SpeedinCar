/* =============================================
   SPEED IN CAR - JavaScript
   ============================================= */

const WHATSAPP_NUMBER = '56912345678';
const WSP_BASE = `https://wa.me/${WHATSAPP_NUMBER}?text=`;
const CUSTOM_CARS_KEY = 'speedInCar.customCars';

const BASE_CARS = {
  scirocco: {
    category: 'sedan',
    brand: 'Volkswagen',
    model: 'Scirocco',
    year: '2017',
    km: '118.000 km',
    shortSpec: '1.4 Turbo TSI DSG',
    engine: '1.4 Turbo TSI',
    transmission: 'DSG (automático)',
    traction: 'Delantera',
    doors: '3 puertas',
    price: '$14.800.000',
    status: 'Disponible',
    images: ['images/scirocco.png'],
    features: [
      'Motor Turbo 1.4 TSI 122 HP',
      'Caja DSG de doble embrague',
      'Control de crucero activo',
      'Alzavidrios eléctricos x4',
      'Pantalla multimedia integrada',
      'Revisión técnica al día',
    ],
  },
  tucson: {
    category: 'suv',
    brand: 'Hyundai',
    model: 'Tucson TL',
    year: '2018',
    km: '55.000 km',
    shortSpec: '2.0 4x2 MT',
    engine: '2.0 GDI',
    transmission: 'Manual (MT)',
    traction: '4x2',
    doors: '5 puertas',
    price: '$13.000.000',
    status: 'Disponible',
    images: ['images/tucson.png'],
    features: [
      'Motor 2.0 GDI 150 HP',
      'Transmisión manual 6 velocidades',
      'Cámara de retroceso',
      'Climatizador automático',
      'Control de estabilidad ESC',
      'Revisión técnica al día',
    ],
  },
  grandcreta: {
    category: 'suv',
    brand: 'Hyundai',
    model: 'Grand Creta',
    year: '2024',
    km: '15.500 km',
    shortSpec: '2.0 AT',
    engine: '2.0 MPI',
    transmission: 'Automática (AT)',
    traction: 'Delantera',
    doors: '5 puertas',
    price: '$18.500.000',
    status: 'Disponible',
    images: ['images/grandcreta.png'],
    features: [
      'Motor 2.0 MPI 165 HP',
      'Caja automática de 6 velocidades',
      'Pantalla táctil 10.25"',
      'Apple CarPlay / Android Auto',
      'Control de crucero adaptativo',
      'Casi nueva - solo 15.500 km',
    ],
  },
  mokka: {
    category: 'suv',
    brand: 'Opel',
    model: 'Mokka Elegance',
    year: '2025',
    km: '3.600 km',
    shortSpec: '1.2T AT',
    engine: '1.2 Turbo',
    transmission: 'Automática (AT)',
    traction: 'Delantera',
    doors: '5 puertas',
    price: '$16.800.000',
    status: 'Disponible',
    images: ['images/mokka.png'],
    features: [
      'Motor 1.2T de 130 HP',
      'Caja automática 8 velocidades',
      'Diseño interior "Pixel" Visor',
      'Adaptive Cruise Control',
      'Asientos calefaccionados',
      'Prácticamente nuevo - 3.600 km',
    ],
  },
  evoltis: {
    category: 'suv',
    brand: 'Subaru',
    model: 'Evoltis Limited AWD',
    year: '2021',
    km: '60.000 km',
    shortSpec: 'AWD',
    engine: '2.5 Boxer',
    transmission: 'Automática CVT',
    traction: 'AWD Simétrica',
    doors: '5 puertas',
    price: '$24.500.000',
    status: 'Disponible',
    images: ['images/evoltis.png'],
    features: [
      'Motor Boxer 2.5L 185 HP',
      'Tracción AWD Simétrica permanente',
      'EyeSight - seguridad activa',
      'Cuero genuino con calefacción',
      'Apertura y arranque sin llave',
      'Panoramic Moonroof',
    ],
  },
};

let customCars = loadCustomCars();
let CARS = {};
let CAR_IDS = [];
let currentCarId = null;
let activeFilter = 'all';
let statsAnimated = false;

const CHECK_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function normalizeImages(images) {
  const list = Array.isArray(images) ? images : String(images || '').split(/[\n,;]+/);
  const cleaned = list
    .map(src => String(src).trim().replace(/\\/g, '/'))
    .filter(Boolean);

  return cleaned.length ? cleaned : ['images/logo.png'];
}

function normalizeFeatures(features) {
  if (Array.isArray(features)) return features.filter(Boolean);
  return String(features || '')
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeCar(car) {
  return {
    category: car.category || 'suv',
    brand: car.brand || 'Marca',
    model: car.model || 'Modelo',
    year: car.year || 'Año',
    km: car.km || 'Kilometraje',
    shortSpec: car.shortSpec || car.engine || 'Motor',
    engine: car.engine || car.shortSpec || 'Motor',
    transmission: car.transmission || 'Por confirmar',
    traction: car.traction || 'Por confirmar',
    doors: car.doors || 'Por confirmar',
    price: car.price || '$0',
    status: car.status || 'Disponible',
    images: normalizeImages(car.images),
    features: normalizeFeatures(car.features),
  };
}

function loadCustomCars() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_CARS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCustomCars() {
  localStorage.setItem(CUSTOM_CARS_KEY, JSON.stringify(customCars));
}

function refreshCars() {
  CARS = {};
  Object.entries({ ...BASE_CARS, ...customCars }).forEach(([id, car]) => {
    CARS[id] = normalizeCar(car);
  });
  CAR_IDS = Object.keys(CARS);
}

function whatsappLink(car, intent = 'availability') {
  const title = `${car.brand} ${car.model} ${car.year}`.trim();
  const messages = {
    availability: `Hola Speed in Car! Me interesa el ${title} en ${car.price}. ¿Sigue disponible?`,
    video: `Hola Speed in Car! ¿Me pueden enviar un video del ${title}?`,
    visit: `Hola Speed in Car! Quiero agendar una visita para ver el ${title}.`,
  };

  return WSP_BASE + encodeURIComponent(messages[intent] || messages.availability);
}

function setImageFallback(scope = document) {
  scope.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      if (!img.dataset.fallbackApplied) {
        img.dataset.fallbackApplied = 'true';
        img.src = 'images/logo.png';
      }
    });
  });
}

function buildSpec(label, value) {
  return `<div class="modal-spec-item">
    <span class="modal-spec-label">${escapeHTML(label)}</span>
    <span class="modal-spec-value">${escapeHTML(value)}</span>
  </div>`;
}

function buildCard(id, car) {
  const badgeClass = car.status.toLowerCase() === 'vendido' ? 'vendido' : 'disponible';
  const specs = [car.shortSpec, car.year, car.km].filter(Boolean);
  const specHTML = specs.map((spec, index) => `
    ${index ? '<span class="spec-dot">&bull;</span>' : ''}
    <span class="spec">${escapeHTML(spec)}</span>
  `).join('');

  return `<div class="car-card" data-category="${escapeHTML(car.category)}" data-car-id="${escapeHTML(id)}" id="card-${escapeHTML(id)}">
    <div class="car-img-wrap">
      <img src="${escapeHTML(car.images[0])}" alt="${escapeHTML(`${car.brand} ${car.model} ${car.year}`)}" class="car-img" loading="lazy" />
      <div class="car-badge ${badgeClass}">${escapeHTML(car.status)}</div>
      <div class="car-overlay">
        <button class="car-overlay-btn open-modal-btn" data-car-id="${escapeHTML(id)}">Ver detalles</button>
      </div>
    </div>
    <div class="car-info">
      <div class="car-brand">${escapeHTML(car.brand)}</div>
      <h3 class="car-name">${escapeHTML(car.model)}</h3>
      <div class="car-specs">${specHTML}</div>
      <div class="car-footer">
        <div class="car-price">${escapeHTML(car.price)}</div>
        <button class="car-wsp-btn open-modal-btn" data-car-id="${escapeHTML(id)}" aria-label="Ver ${escapeHTML(car.model)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>
      <div class="car-actions">
        <a href="${whatsappLink(car, 'availability')}" target="_blank" class="car-action-btn car-action-primary">Consultar</a>
        <button class="car-action-btn open-modal-btn" data-car-id="${escapeHTML(id)}">Detalles</button>
      </div>
    </div>
  </div>`;
}

function renderCatalog(filter = activeFilter) {
  const grid = document.getElementById('cars-grid');
  if (!grid) return;

  activeFilter = filter;
  const visibleIds = CAR_IDS.filter(id => filter === 'all' || CARS[id].category === filter);
  grid.innerHTML = visibleIds.length
    ? visibleIds.map(id => buildCard(id, CARS[id])).join('')
    : '<p class="catalog-empty">No hay vehículos para este filtro.</p>';

  setImageFallback(grid);
  setupRevealTargets(grid.querySelectorAll('.car-card'));
  revealOnScroll();
}

function setActiveFilterButton(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
}

function openModal(id) {
  const car = CARS[id];
  if (!car) return;
  currentCarId = id;

  const modal = document.getElementById('car-modal');
  const mainImg = document.getElementById('modal-main-img');
  const thumbsEl = document.getElementById('modal-thumbs');
  if (!modal || !mainImg || !thumbsEl) return;

  const images = normalizeImages(car.images);

  mainImg.src = images[0];
  mainImg.alt = `${car.brand} ${car.model}`;
  document.getElementById('modal-img-badge').textContent = car.status;

  thumbsEl.classList.toggle('is-single', images.length < 2);
  thumbsEl.innerHTML = images.map((src, index) =>
    `<button type="button" class="modal-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
      <img src="${escapeHTML(src)}" alt="${escapeHTML(`${car.model} foto ${index + 1}`)}" />
    </button>`
  ).join('');

  thumbsEl.querySelectorAll('.modal-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbsEl.querySelectorAll('.modal-thumb').forEach(item => item.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.src = images[Number(thumb.dataset.index)];
    });
  });

  document.getElementById('modal-brand').textContent = car.brand;
  document.getElementById('modal-title').textContent = car.model;
  document.getElementById('modal-price').textContent = car.price;
  document.getElementById('modal-status').textContent = car.status;

  document.getElementById('modal-specs-grid').innerHTML =
    buildSpec('Año', car.year) +
    buildSpec('Kilometraje', car.km) +
    buildSpec('Motor', car.engine) +
    buildSpec('Transmisión', car.transmission) +
    buildSpec('Tracción', car.traction) +
    buildSpec('Puertas', car.doors);

  document.getElementById('modal-features').innerHTML = car.features.length
    ? car.features.map(feature => `<li>${CHECK_SVG} ${escapeHTML(feature)}</li>`).join('')
    : `<li>${CHECK_SVG} Información detallada por confirmar</li>`;

  document.getElementById('modal-wsp-btn').href = whatsappLink(car, 'availability');
  document.getElementById('modal-video-btn').href = whatsappLink(car, 'video');
  document.getElementById('modal-visit-btn').href = whatsappLink(car, 'visit');

  setImageFallback(document.getElementById('modal-box'));
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('car-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  currentCarId = null;
}

function navigateModal(dir) {
  if (!currentCarId || !CAR_IDS.length) return;
  const idx = CAR_IDS.indexOf(currentCarId);
  openModal(CAR_IDS[(idx + dir + CAR_IDS.length) % CAR_IDS.length]);
}

function setupRevealTargets(targets) {
  targets.forEach((el, index) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(index % 4) * 80}ms`;
  });
}

function revealOnScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight - 80) {
      el.classList.add('visible');
    }
  });
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function renderAdminList() {
  const list = document.getElementById('admin-list');
  if (!list) return;

  const ids = Object.keys(customCars);
  if (!ids.length) {
    list.innerHTML = '<div class="admin-list-empty">Todavía no hay autos agregados.</div>';
    return;
  }

  list.innerHTML = ids.map(id => {
    const car = normalizeCar(customCars[id]);
    return `<div class="admin-list-item">
      <img src="${escapeHTML(car.images[0])}" alt="${escapeHTML(`${car.brand} ${car.model}`)}" />
      <div>
        <span class="admin-list-name">${escapeHTML(car.brand)} ${escapeHTML(car.model)}</span>
        <span class="admin-list-meta">${escapeHTML(car.year)} · ${escapeHTML(car.price)}</span>
      </div>
      <button type="button" class="admin-delete" data-delete-car="${escapeHTML(id)}" aria-label="Eliminar ${escapeHTML(car.model)}">×</button>
    </div>`;
  }).join('');

  setImageFallback(list);
}

function showAdminMessage(message) {
  const el = document.getElementById('admin-message');
  if (!el) return;
  el.textContent = message;
  window.clearTimeout(showAdminMessage.timer);
  showAdminMessage.timer = window.setTimeout(() => {
    el.textContent = '';
  }, 3000);
}

function setupAdmin() {
  const form = document.getElementById('admin-car-form');
  const clearBtn = document.getElementById('admin-clear');
  const list = document.getElementById('admin-list');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();

    const brand = document.getElementById('admin-brand').value.trim();
    const model = document.getElementById('admin-model').value.trim();
    const year = document.getElementById('admin-year').value.trim();
    const id = `${slugify(`${brand}-${model}-${year}`)}-${Date.now()}`;

    customCars[id] = {
      category: document.getElementById('admin-category').value,
      brand,
      model,
      year,
      km: document.getElementById('admin-km').value.trim(),
      shortSpec: document.getElementById('admin-engine').value.trim(),
      engine: document.getElementById('admin-engine').value.trim(),
      transmission: document.getElementById('admin-transmission').value.trim(),
      traction: document.getElementById('admin-traction').value.trim(),
      doors: document.getElementById('admin-doors').value.trim(),
      price: document.getElementById('admin-price').value.trim(),
      status: document.getElementById('admin-status').value,
      images: normalizeImages(document.getElementById('admin-images').value),
      features: normalizeFeatures(document.getElementById('admin-features').value),
    };

    saveCustomCars();
    refreshCars();
    renderCatalog(activeFilter);
    renderAdminList();
    form.reset();
    showAdminMessage('Auto agregado al catálogo.');
  });

  clearBtn?.addEventListener('click', () => {
    if (!Object.keys(customCars).length) {
      showAdminMessage('No hay autos agregados para borrar.');
      return;
    }

    if (!window.confirm('¿Borrar todos los autos agregados en este navegador?')) return;
    customCars = {};
    saveCustomCars();
    refreshCars();
    renderCatalog(activeFilter);
    renderAdminList();
    showAdminMessage('Autos agregados eliminados.');
  });

  list?.addEventListener('click', event => {
    const btn = event.target.closest('[data-delete-car]');
    if (!btn) return;
    delete customCars[btn.dataset.deleteCar];
    saveCustomCars();
    refreshCars();
    renderCatalog(activeFilter);
    renderAdminList();
    showAdminMessage('Auto eliminado.');
  });

  renderAdminList();
}

function setupNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinksEl = document.getElementById('nav-links');
  if (!navbar || !hamburger || !navLinksEl) return;

  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const page = document.body.dataset.page || 'home';

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  function setActiveLink() {
    if (page !== 'home') {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.navPage === page);
      });
      return;
    }

    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) current = section.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinksEl.classList.toggle('mobile-open');
  });

  navLinksEl.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinksEl.classList.remove('mobile-open');
    });
  });
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      setActiveFilterButton(activeFilter);
      renderCatalog(activeFilter);
    });
  });
}

function setupModal() {
  const modal = document.getElementById('car-modal');
  const modalClose = document.getElementById('modal-close');
  const modalPrev = document.getElementById('modal-prev');
  const modalNext = document.getElementById('modal-next');
  if (!modal || !modalClose || !modalPrev || !modalNext) return;

  document.addEventListener('click', event => {
    const btn = event.target.closest('.open-modal-btn');
    if (!btn) return;
    event.preventDefault();
    openModal(btn.dataset.carId);
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  modalPrev.addEventListener('click', () => navigateModal(-1));
  modalNext.addEventListener('click', () => navigateModal(1));

  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('open')) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowLeft') navigateModal(-1);
    if (event.key === 'ArrowRight') navigateModal(1);
  });
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(event) {
      const href = this.getAttribute('href');
      if (!href || href === '#' || !href.startsWith('#')) return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 70,
        behavior: 'smooth',
      });
    });
  });
}

function animateCounter(el, target, prefix = '', suffix = '') {
  let start = null;

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / 1800, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = prefix + Math.floor(eased * target).toLocaleString('es-CL') + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function setupStatCounter() {
  const stats = document.getElementById('hero-stats');
  if (!stats) return;

  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || statsAnimated) return;
    statsAnimated = true;

    document.querySelectorAll('.stat-num').forEach(el => {
      const text = el.textContent;
      if (text.includes('+')) animateCounter(el, Number(text.replace(/\D/g, '')), '+');
      else if (text.includes('%')) animateCounter(el, 100, '', '%');
      else animateCounter(el, Number(text.replace(/\D/g, '')));
    });
  }, { threshold: 0.5 }).observe(stats);
}

function setupWhatsappFloat() {
  const wspFloat = document.getElementById('wsp-float');
  if (!wspFloat) return;

  wspFloat.style.cssText += 'opacity:0;pointer-events:none;transition:opacity .3s,transform .3s,background .3s';
  window.addEventListener('scroll', () => {
    const show = window.scrollY > 400;
    wspFloat.style.opacity = show ? '1' : '0';
    wspFloat.style.pointerEvents = show ? 'auto' : 'none';
  }, { passive: true });
}

function updateFooterYear() {
  const footerYear = document.getElementById('footer-year');
  if (footerYear) footerYear.textContent = new Date().getFullYear();
}

function init() {
  refreshCars();
  renderCatalog(activeFilter);
  setActiveFilterButton(activeFilter);
  setupNavbar();
  setupFilters();
  setupModal();
  setupAdmin();
  setupSmoothScroll();
  setupStatCounter();
  setupWhatsappFloat();
  updateFooterYear();
  setupRevealTargets(document.querySelectorAll('.service-card, .step, .about-stat-card, .about-img-card'));
  revealOnScroll();
  window.addEventListener('scroll', revealOnScroll, { passive: true });
  setImageFallback();
}

init();
