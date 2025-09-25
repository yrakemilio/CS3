import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, onSnapshot, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Google Sheet publicado en CSV
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBAuMdD25rU-PCyLnn_6nOeb_NHRQtOHglGFL2QqMN7BD98JmWvJ1O2o6LkOjhwP0KCxYzTY_V3u9R/pub?gid=0&single=true&output=csv";

let DATA = [];
let FILTERS = { q: "", seccion: "", ciudad: "", categoria: "" };
let ANNOUNCEMENTS = [];
let userId = null;
let db = null;
let auth = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function parseCSV(text) {
  const rows = [];
  let row = [], cur = '', inQ = false;
  const pushCell = () => { row.push(cur); cur = ''; };
  const pushRow = () => { rows.push(row); row = []; };

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
      if (!o.id) o.id = i + 1;
      return o;
    });
}

function renderCards(list) {
  const html = list.map(r => `
    <a href="detalle.html?id=${r.id}" class="card">
      <img src="${r.logo || 'https://placehold.co/76x76/fafafa/6b7280?text=Logo'}" class="card-logo" alt="Logo de ${r.nombre}" />
      <div class="card-body">
        <h3 class="card-title">${r.nombre}</h3>
        <p class="card-meta">${[r.categoria, r.ciudad, r.seccion].filter(Boolean).join(" • ")}</p>
        <p class="card-desc">${r.descripcion}</p>
      </div>
    </a>
  `).join("");
  const resultsEl = $("#results");
  if (resultsEl) resultsEl.innerHTML = html;
}

function populateFilters() {
  const secciones = [...new Set(DATA.map(r => r.seccion))].filter(Boolean).sort();
  const ciudades = [...new Set(DATA.map(r => r.ciudad))].filter(Boolean).sort();
  const categorias = [...new Set(DATA.map(r => r.categoria))].filter(Boolean).sort();

  const renderOptions = (items, id) => {
    const selector = $(`#${id}`);
    if (selector) {
      selector.innerHTML = `<option value="">Todas</option>` + items.map(item => `<option value="${item}">${item}</option>`).join("");
    }
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
  const empty = $("#empty");
  if (empty) empty.classList.add("hidden");
  const noResults = $("#noResults");
  if (noResults) noResults.classList.toggle("hidden", list.length !== 0);
  renderCards(list);
}

function renderAnnouncements() {
  const announcementCards = $("#announcementCards");
  if (announcementCards) {
    announcementCards.innerHTML = ANNOUNCEMENTS.map(announcement => `
      <div class="announcement-card">
        <div class="announcement-media">
          <img src="${announcement.imageUrl}" alt="Anuncio: ${announcement.title}">
        </div>
        <div class="announcement-content">
          <h4>${announcement.title}</h4>
          <p>${announcement.description}</p>
        </div>
      </div>
    `).join("");
  }
}

async function saveAnnouncement() {
  const imageFile = $("#announcementImage").files[0];
  const title = $("#announcementTitle").value;
  const description = $("#announcementDesc").value;

  if (!imageFile || !title || !description) {
    alert("Por favor, rellena todos los campos para subir un anuncio.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const imageUrl = e.target.result;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const announcementsCollectionRef = collection(db, `artifacts/${appId}/public/data/announcements`);
    await addDoc(announcementsCollectionRef, {
      imageUrl,
      title,
      description,
      userId: userId,
      createdAt: new Date()
    });
    alert("Anuncio guardado con éxito.");
    clearForm();
  };
  reader.readAsDataURL(imageFile);
}

async function deleteAnnouncement(id) {
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const announcementDocRef = doc(db, `artifacts/${appId}/public/data/announcements`, id);
  await deleteDoc(announcementDocRef);
  alert("Anuncio eliminado con éxito.");
}

function clearForm() {
  const formImage = $("#announcementImage");
  const formTitle = $("#announcementTitle");
  const formDesc = $("#announcementDesc");
  if (formImage) formImage.value = "";
  if (formTitle) formTitle.value = "";
  if (formDesc) formDesc.value = "";
}

async function loadData() {
  const loading = $("#loading");
  if (loading) loading.classList.remove("hidden");
  try {
    const res = await fetch(SHEET_CSV_URL);
    const text = await res.text();
    DATA = parseCSV(text);
    populateFilters();
    if (loading) loading.classList.add("hidden");
    applyFilters();
  } catch (e) {
    console.error(e);
    if (loading) loading.classList.add("hidden");
    const error = $("#error");
    if (error) error.classList.remove("hidden");
  }
}

// Inicializar Firebase y cargar datos al inicio
document.addEventListener("DOMContentLoaded", async () => {
  const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
  if (initialAuthToken) {
    await signInWithCustomToken(auth, initialAuthToken);
  } else {
    await signInAnonymously(auth);
  }

  onAuthStateChanged(auth, user => {
    if (user) {
      userId = user.uid;
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const q = query(collection(db, `artifacts/${appId}/public/data/announcements`));
      onSnapshot(q, (querySnapshot) => {
        ANNOUNCEMENTS = [];
        querySnapshot.forEach((doc) => {
          ANNOUNCEMENTS.push({ id: doc.id, ...doc.data() });
        });
        renderAnnouncements();
      });
    }
  });

  if (document.title.includes("Directorio")) {
    loadData();
    const btnBuscar = $("#btnBuscar");
    if (btnBuscar) {
      btnBuscar.addEventListener("click", () => {
        FILTERS.q = $("#q").value;
        applyFilters();
      });
    }
    const qInput = $("#q");
    if (qInput) {
      qInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          FILTERS.q = $("#q").value;
          applyFilters();
        }
      });
    }
    const seccionSelect = $("#seccion");
    if (seccionSelect) {
      seccionSelect.addEventListener("change", (e) => {
        FILTERS.seccion = e.target.value;
        applyFilters();
      });
    }
    const ciudadSelect = $("#ciudad");
    if (ciudadSelect) {
      ciudadSelect.addEventListener("change", (e) => {
        FILTERS.ciudad = e.target.value;
        applyFilters();
      });
    }
    const categoriaSelect = $("#categoria");
    if (categoriaSelect) {
      categoriaSelect.addEventListener("change", (e) => {
        FILTERS.categoria = e.target.value;
        applyFilters();
      });
    }
  }

  if (document.title.includes("Subir Anuncio")) {
    const saveBtn = $("#saveAnnouncementBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", saveAnnouncement);
    }
    const clearBtn = $("#clearAnnouncementBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", clearForm);
    }
  }
});
