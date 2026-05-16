const WHATSAPP_NUMBER_DETAIL = '56998261166';
const DETAIL_WSP_BASE = `https://wa.me/${WHATSAPP_NUMBER_DETAIL}?text=`;

let detailInventory = (window.SPEEDINCAR_INVENTORY || []).map(normalizeDetailCar);
let currentDetailCar = null;

function detailCurrency(value) {
  return `$${(Number(value) || 0).toLocaleString('es-CL')}`;
}

function detailKm(value) {
  return `${(Number(value) || 0).toLocaleString('es-CL')} km`;
}

function detailEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function normalizeDetailList(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  return String(value || '').split(/[\n,;]+/).map(item => item.trim()).filter(Boolean);
}

function normalizeDetailCar(car) {
  const cover = car.cover || (Array.isArray(car.images) ? car.images[0] : '') || 'images/logo.png';
  const images = [...new Set([cover, ...normalizeDetailList(car.images)])].map(src => src.replace(/\\/g, '/'));

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
    tags: normalizeDetailList(car.tags),
    highlights: normalizeDetailList(car.highlights),
    featured: Boolean(car.featured),
  };
}

function getRequestedCarId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || params.get('auto') || params.get('car');
}

function detailWhatsapp(car, intent = 'availability') {
  const title = `${car.brand} ${car.model} ${car.year}`.trim();
  const messages = {
    availability: `Hola Speed in Car, me interesa el ${title} publicado en ${detailCurrency(car.price)}. \u00bfSigue disponible?`,
    video: `Hola Speed in Car, \u00bfme pueden enviar un video del ${title}?`,
    visit: `Hola Speed in Car, quiero agendar una visita para ver el ${title}.`,
  };

  return DETAIL_WSP_BASE + encodeURIComponent(messages[intent] || messages.availability);
}

function buildDetailSpec(label, value) {
  return `<div class="detail-spec"><span>${detailEscape(label)}</span><strong>${detailEscape(value)}</strong></div>`;
}

function renderRelated(car) {
  const related = detailInventory.filter(item => item.id !== car.id).slice(0, 3);
  const grid = document.getElementById('related-grid');
  if (!grid) return;

  grid.innerHTML = related.map(item => `
    <a class="related-card" href="/auto?id=${encodeURIComponent(item.id)}">
      <img src="${detailEscape(item.cover)}" alt="${detailEscape(`${item.brand} ${item.model}`)}" />
      <span>${detailEscape(item.brand)}</span>
      <strong>${detailEscape(item.model)}</strong>
      <small>${detailEscape(detailCurrency(item.price))}</small>
    </a>
  `).join('');
}

function renderDetail(car) {
  currentDetailCar = car;
  document.title = `${car.brand} ${car.model} ${car.year} | Speed in Car`;

  document.getElementById('detail-kicker').textContent = `${car.brand} ${car.year}`;
  document.getElementById('detail-title').textContent = car.model;
  document.getElementById('detail-price').textContent = detailCurrency(car.price);
  document.getElementById('detail-status').textContent = car.status;
  document.getElementById('detail-location').textContent = car.location;
  document.getElementById('detail-cover').src = car.cover;
  document.getElementById('detail-cover').alt = `${car.brand} ${car.model}`;

  document.getElementById('detail-specs').innerHTML =
    buildDetailSpec('A\u00f1o', String(car.year)) +
    buildDetailSpec('Kilometraje', detailKm(car.km)) +
    buildDetailSpec('Motor', car.engine) +
    buildDetailSpec('Transmisi\u00f3n', car.transmission) +
    buildDetailSpec('Tracci\u00f3n', car.traction) +
    buildDetailSpec('Carrocer\u00eda', car.body);

  document.getElementById('detail-tags').innerHTML = car.tags.map(tag => `<span>${detailEscape(tag)}</span>`).join('');
  document.getElementById('detail-highlights').innerHTML = car.highlights.length
    ? car.highlights.map(item => `<li>${detailEscape(item)}</li>`).join('')
    : '<li>Informaci&oacute;n detallada por confirmar.</li>';

  const gallery = document.getElementById('detail-gallery');
  gallery.innerHTML = car.images.map((src, index) => `
    <button type="button" class="detail-thumb ${index === 0 ? 'active' : ''}" data-src="${detailEscape(src)}">
      <img src="${detailEscape(src)}" alt="${detailEscape(`${car.model} foto ${index + 1}`)}" />
    </button>
  `).join('');

  gallery.querySelectorAll('.detail-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      gallery.querySelectorAll('.detail-thumb').forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('detail-cover').src = btn.dataset.src;
    });
  });

  document.getElementById('detail-wsp').href = detailWhatsapp(car);
  document.getElementById('detail-video').href = detailWhatsapp(car, 'video');
  document.getElementById('detail-visit').href = detailWhatsapp(car, 'visit');
  document.getElementById('detail-share').addEventListener('click', async () => {
    const shareData = {
      title: `${car.brand} ${car.model}`,
      text: `${car.brand} ${car.model} ${car.year} - ${detailCurrency(car.price)}`,
      url: window.location.href,
    };
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard.writeText(window.location.href);
  }, { once: true });

  renderRelated(car);
  document.body.classList.remove('detail-loading');
}

function renderNotFound() {
  document.body.classList.remove('detail-loading');
  document.body.classList.add('detail-not-found');
}

function renderRequestedCar() {
  const id = getRequestedCarId();
  const car = detailInventory.find(item => item.id === id) || detailInventory[0];
  if (!car) renderNotFound();
  else renderDetail(car);
}

async function initRemoteDetail() {
  const config = window.SPEEDINCAR_FIREBASE_CONFIG || {};
  if (!config.apiKey || !config.projectId || !config.appId) return;

  try {
    const firebase = await import('./firebase-service.js');
    if (!firebase.isFirebaseConfigured()) return;
    firebase.subscribeVehicles(cars => {
      if (!cars.length) return;
      detailInventory = cars.map(normalizeDetailCar);
      renderRequestedCar();
    });
  } catch (error) {
    console.warn('Firebase no disponible para detalle', error);
  }
}

renderRequestedCar();
initRemoteDetail();
