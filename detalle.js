// Google Sheet publicado en CSV
// ⚠️ Debe ser la misma URL que en index.js
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQS0ZzlICmlRCsrt3V7I2DizA0RceOxIHVzvMhz8bAHaG31gKRFY2hUF0kJbyE755k-ImXzmkPRuyfc/pub?gid=0&single=true&output=csv";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function getParam(name) {
  return new URL(location.href).searchParams.get(name);
}

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
      if (!o.id) o.id = i + 1;
      return o;
    });
}

function renderDetails(row) {
  if (!row) {
    $("#detailLoading").classList.add("hidden");
    $("#detailError").classList.remove("hidden");
    return;
  }
  $("#detailLogo").src = row.logo || "";
  $("#detailName").textContent = row.nombre || "Sin nombre";
  $("#detailMeta").textContent = [row.categoria, row.ciudad, row.seccion].filter(Boolean).join(" • ");
  $("#detailDesc").textContent = row.descripcion || "Sin descripción";

  // Botón 1: WhatsApp
  if (row.whatsapp) $("#btnWhatsApp").href = `https://wa.me/${row.whatsapp}`;

  // Botón 2: Web / Contacto
  const webBtn = $("#btnWeb");
  if (row.pagina && row.pagina.trim() !== "") {
    webBtn.href = row.pagina;
    webBtn.textContent = row.descuento && row.descuento.trim() !== "" ? row.descuento : "Visitar sitio";
    webBtn.classList.remove("hidden");
  } else {
    webBtn.classList.add("hidden");
  }

  // Galería de imágenes y video
  const imgs = [row.imagen1, row.imagen2, row.imagen3, row.imagen4, row.imagen5].filter(Boolean);
  const videoSrc = row.video;
  
  const videoHtml = videoSrc ? `<iframe class="video-container" src="${videoSrc}" frameborder="0" allowfullscreen></iframe>` : '';
  
  const galleryHtml = imgs.map((src, i) => `<img src="${src}" alt="Foto ${i+1}">`).join("") + videoHtml;
  
  $("#detailGallery").innerHTML = galleryHtml;

  $("#detailLoading").classList.add("hidden");
  $("#detail").classList.remove("hidden");
}

async function load() {
  const id = getParam("id");
  if (!id) {
    $("#detailError").classList.remove("hidden");
    return;
  }
  try {
    const res = await fetch(SHEET_CSV_URL);
    const text = await res.text();
    const data = parseCSV(text);
    const row = data.find(d => d.id == id);
    renderDetails(row);
  } catch (e) {
    console.error(e);
    $("#detailLoading").classList.add("hidden");
    $("#detailError").classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", load);
