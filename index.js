// Google Sheet publicado en CSV
// ⚠️ Cambia por tu URL pública CSV
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBAuMdD25rU-PCyLnn_6nOeb_NHRQtOHglGFL2QqMN7BD98JmWvJ1O2o6LkOjhwP0KCxYzTY_V3u9R/pub?gid=0&single=true&output=csv";

let DATA = [];
let FILTERS = { q: "", seccion: "", ciudad: "", categoria: "" };

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function parseCSV(text) {
  const rows = [];
  let row = [],
    cur = '',
    inQ = false;
  const pushCell = () => {
    row.push(cur);
    cur = '';
  };
  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQ && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      pushCell();
    } else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      pushCell();
      pushRow();
    } else {
      cur += c;
    }
  }
  if (cur.length || row.length) {
    pushCell();
    pushRow();
  }

  if (!rows.length) return [];
  const headers = rows.shift().map(h => String(h || '').trim().toLowerCase());
  return rows
    .filter(r => r.some(c => String(c || '').trim() !== ''))
    .map((r, i) => {
      const o = {};
      headers.forEach((h, idx) => o[h] = String(r[idx] || '').trim());
      // Si no existe columna id, generamos uno automático
      if (!o.id) o.id = i + 1;
      return o;
    });
}

function renderCards(items) {
  $("#results").innerHTML = items.map(it => `
    <article class="card">
      ${it.logo ? `<img class="card-logo" src="${it.logo}" alt="Logo ${it.nombre}">` : ''}
      <div class="card-body">
        <h3 class="card-title">${it.nombre || "Sin nombre"}</h3>
        <p class="card-meta">${[it.categoria, it.ciudad, it.seccion].filter(Boolean).join(" • ")}</p>
        <p class="card-desc">${(it.descripcion || "").slice(0, 120)}…</p>
        <a class="card-link" href="detalle.html?id=${it.id}">Ver más</a>
      </div>
    </article>
  `).join("");
}

// Llenar dinámicamente los selectores de los filtros
function populateFilters() {
  const secciones = [...new Set(DATA.map(d => d.seccion))].filter(Boolean);
  const ciudades = [...new Set(DATA.map(d => d.ciudad))].filter(Boolean);
  const categorias = [...new Set(DATA.map(d => d.categoria))].filter(Boolean);

  const renderOptions = (items, id) => {
    const selector = $(`#${id}`);
    selector.innerHTML = `<option value="">Todas</option>` + items.map(item => `<option value="${item}">${item}</option>`).join("");
  };

  renderOptions(secciones, "seccion");
  renderOptions(ciudades, "ciudad");
  renderOptions(categorias, "categoria");
}

function applyFilters() {
  const q = FILTERS.q.toLowerCase();
  let list = DATA.filter(r => {
    return (!q ||
        (r.nombre || "").toLowerCase().includes(q) ||
        (r.descripcion || "").toLowerCase().includes(q)) &&
      (!FILTERS.seccion || r.seccion === FILTERS.seccion) &&
      (!FILTERS.ciudad || r.ciudad === FILTERS.ciudad) &&
      (!FILTERS.categoria || r.categoria === FILTERS.categoria);
  });
  $("#empty").classList.add("hidden");
  $("#noResults").classList.toggle("hidden", list.length !== 0);
  renderCards(list);
}

async function loadData() {
  $("#loading").classList.remove("hidden");
  try {
    const res = await fetch(SHEET_CSV_URL);
    const text = await res.text();
    DATA = parseCSV(text);
    populateFilters();
    $("#loading").classList.add("hidden");
    // Mostrar todos al inicio
    applyFilters();
  } catch (e) {
    console.error(e);
    $("#loading").classList.add("hidden");
    $("#error").classList.remove("hidden");
  }
}

// Lógica de anuncios
function saveAnnounce(data) {
  localStorage.setItem("suterm_announcement", JSON.stringify(data));
}
function getAnnounce() {
  const raw = localStorage.getItem("suterm_announcement");
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
function clearAnnounce() {
  localStorage.removeItem("suterm_announcement");
}
function renderAnnounce() {
  const box = $("#announcementList");
  const noAnnouncements = $("#noAnnouncements");
  const a = getAnnounce();
  if (a) {
    box.innerHTML = `
      <div class="announcement-card">
        ${a.img ? `<div class="announcement-media"><img src="${a.img}" alt="Imagen del anuncio"></div>` : ''}
        <div class="announcement-content">
          <h4>${a.title}</h4>
          <p>${a.desc}</p>
        </div>
      </div>
    `;
    box.classList.remove("hidden");
    noAnnouncements.classList.add("hidden");
  } else {
    box.innerHTML = '';
    box.classList.add("hidden");
    noAnnouncements.classList.remove("hidden");
  }
}
async function setupAnnounce() {
  const form = document.getElementById("announcementForm");
  const btnDelete = document.getElementById("annDelete");
  if (form) {
    form.addEventListener("submit", async(e) => {
      e.preventDefault();
      const title = document.getElementById("annTitleInput").value.trim();
      const desc = document.getElementById("annDescInput").value.trim();
      const file = document.getElementById("annImageInput").files[0];
      if (!title || !desc) {
        alert("Título y descripción son obligatorios.");
        return;
      }
      let img64 = null;
      if (file) {
        img64 = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result);
          fr.onerror = reject;
          fr.readAsDataURL(file);
        });
      }
      saveAnnounce({
        title,
        desc,
        img: img64
      });
      renderAnnounce();
      alert("Anuncio guardado.");
    });
  }
  if (btnDelete) {
    btnDelete.addEventListener("click", () => {
      if (confirm("¿Eliminar el anuncio actual?")) {
        clearAnnounce();
        renderAnnounce();
        document.getElementById("annImageInput").value = "";
      }
    });
  }
  renderAnnounce();
}

document.addEventListener("DOMContentLoaded", () => {
  // Inicialización del modal legal
  const modal = $("#legalNotice");
  const btn = $("#closeNotice");
  if (modal && btn) {
    btn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }
  
  // Lógica principal
  loadData();
  
  // Lógica de búsqueda y filtros
  $("#btnBuscar").addEventListener("click", () => {
    FILTERS.q = $("#q").value;
    applyFilters();
  });
  ["seccion", "ciudad", "categoria"].forEach(id => {
    $("#" + id).addEventListener("change", e => {
      FILTERS[id] = e.target.value;
      applyFilters();
    });
  });

  // Lógica de anuncios
  setupAnnounce();
});
