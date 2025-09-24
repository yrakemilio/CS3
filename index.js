// index.js - VERSIÓN COMPLETA Y CORREGIDA
// =====================
// CONFIGURACIÓN GOOGLE SHEETS
// =====================
const BUSINESS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQS0ZzlICmlRCsrt3V7I2DizA0RceOxIHVzvMhz8bAHaG31gKRFY2hUF0kJbyE755k-ImXzmkPRuyfc/pub?gid=0&single=true&output=csv";
let BUSINESS_DATA = [];

// =====================
// FUNCIONES DE DEPURACIÓN DE IMÁGENES
// =====================
function debugImageLoading() {
    console.log('=== INICIANDO DEPURACIÓN DE IMÁGENES ===');
    
    BUSINESS_DATA.forEach((business, index) => {
        if (business.logo1) {
            console.log(`📊 Negocio ${index + 1}: ${business.nombre}`);
            console.log(`🖼️  URL del logo: ${business.logo1}`);
            
            // Testear cada imagen
            const testImage = new Image();
            testImage.onload = function() {
                console.log('✅ La imagen SE PUEDE CARGAR correctamente');
                console.log('📏 Dimensiones:', this.width, 'x', this.height);
            };
            testImage.onerror = function() {
                console.log('❌ La imagen NO SE PUEDE CARGAR');
                console.log('🔍 Razón posible: CORS, bloqueo del navegador');
            };
            testImage.src = business.logo1;
            console.log('---');
        }
    });
}

function loadImageWithCacheBuster(imgElement, url) {
    const cleanUrl = url.split('?')[0];
    const newUrl = cleanUrl + '?nocache=' + new Date().getTime();
    
    console.log('🔄 Cargando con cache buster:', newUrl);
    imgElement.src = newUrl;
}

// =====================
// PARSER CSV
// =====================
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj;
    });
}

// =====================
// CARGAR DATOS DESDE SHEETS
// =====================
async function loadAllData() {
    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('empty').classList.add('hidden');
        
        // Cargar negocios
        const businessResponse = await fetch(BUSINESS_SHEET_URL);
        const businessText = await businessResponse.text();
        BUSINESS_DATA = parseCSV(businessText);
        
        // Procesar datos
        populateFilters();
        renderList();
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('empty').classList.remove('hidden');
        
        // ✅ DEPURACIÓN: Ejecutar después de cargar todo
        setTimeout(debugImageLoading, 3000);
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
    }
}

// =====================
// LLENAR FILTROS
// =====================
function populateFilters() {
    // Llenar secciones
    const secciones = [...new Set(BUSINESS_DATA.map(d => d.seccion))].filter(Boolean);
    const seccionSelect = document.getElementById('seccion');
    secciones.forEach(sec => {
        const option = document.createElement('option');
        option.value = sec;
        option.textContent = sec;
        seccionSelect.appendChild(option);
    });
    
    // Llenar ciudades
    const ciudades = [...new Set(BUSINESS_DATA.map(d => d.ciudad))].filter(Boolean);
    const ciudadSelect = document.getElementById('ciudad');
    ciudades.forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad;
        option.textContent = ciudad;
        ciudadSelect.appendChild(option);
    });
    
    // Llenar categorías
    const categorias = [...new Set(BUSINESS_DATA.map(d => d.categoria))].filter(Boolean);
    const categoriaSelect = document.getElementById('categoria');
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoriaSelect.appendChild(option);
    });
}

// =====================
// RENDERIZAR LISTA DE NEGOCIOS (VERSIÓN CORREGIDA)
// =====================
function renderList() {
    const searchTerm = document.getElementById('q').value.toLowerCase();
    const seccionFilter = document.getElementById('seccion').value;
    const ciudadFilter = document.getElementById('ciudad').value;
    const categoriaFilter = document.getElementById('categoria').value;
    
    const filteredData = BUSINESS_DATA.filter(business => {
        const matchesSearch = !searchTerm || 
            (business.nombre && business.nombre.toLowerCase().includes(searchTerm)) ||
            (business.descripcion && business.descripcion.toLowerCase().includes(searchTerm));
        
        const matchesSeccion = !seccionFilter || business.seccion === seccionFilter;
        const matchesCiudad = !ciudadFilter || business.ciudad === ciudadFilter;
        const matchesCategoria = !categoriaFilter || business.categoria === categoriaFilter;
        
        return matchesSearch && matchesSeccion && matchesCiudad && matchesCategoria;
    });
    
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    
    if (filteredData.length === 0) {
        document.getElementById('noResults').classList.remove('hidden');
        document.getElementById('empty').classList.add('hidden');
        return;
    }
    
    document.getElementById('noResults').classList.add('hidden');
    document.getElementById('empty').classList.add('hidden');
    
    filteredData.forEach(business => {
        const card = document.createElement('div');
        card.className = 'business-card fade-in';
        
        card.innerHTML = `
            <div class="card-img">
                <img src="" 
                     alt="${business.nombre || 'Negocio'}" 
                     onload="console.log('✅ Imagen cargada:', this.src)"
                     onerror="console.log('❌ Error carga imagen:', this.src); this.src='https://placehold.co/600x400/800020/white?text=Logo+No+Carga'">
            </div>
            <div class="card-body">
                <h3 class="card-title">${business.nombre || 'Sin nombre'}</h3>
                <p class="card-meta">
                    <i class="fas fa-tag"></i>${business.categoria || 'Sin categoría'} • 
                    <i class="fas fa-map-marker-alt"></i>${business.ciudad || 'Sin ciudad'}, Sección ${business.seccion || 'N/A'}
                </p>
                <p class="card-desc">${(business.descripcion || '').substring(0, 120)}...</p>
                <a href="detalle.html?id=${business.id}" class="card-link">
                    <i class="fas fa-eye icon"></i>Ver detalles
                </a>
            </div>
        `;
        
        // Cargar la imagen DESPUÉS de crear el elemento
        setTimeout(() => {
            const img = card.querySelector('img');
            if (business.logo1) {
                loadImageWithCacheBuster(img, business.logo1);
            } else {
                img.src = 'https://placehold.co/600x400/800020/white?text=Sin+Logo';
            }
        }, 100);
        
        resultsContainer.appendChild(card);
    });
}

// =====================
// FUNCIONALIDAD ANUNCIOS LOCALES
// =====================
function setupAnnouncementFunctionality() {
    const btnNewAnnouncement = document.getElementById('btnNewAnnouncement');
    const announcementForm = document.getElementById('announcementForm');
    const btnCancel = document.getElementById('btnCancel');
    const btnPublish = document.getElementById('btnPublish');
    const announcementList = document.getElementById('announcementList');
    const noAnnouncement = document.getElementById('noAnnouncement');
    
    // Mostrar/ocultar formulario de anuncios
    btnNewAnnouncement.addEventListener('click', function() {
        announcementForm.classList.toggle('hidden');
    });
    
    btnCancel.addEventListener('click', function() {
        announcementForm.classList.add('hidden');
        // Limpiar formulario
        document.getElementById('announcementTitle').value = '';
        document.getElementById('announcementContent').value = '';
        document.getElementById('announcementMedia').value = '';
    });
    
    // Publicar nuevo anuncio (REEMPLAZA el anterior)
    btnPublish.addEventListener('click', function() {
        const title = document.getElementById('announcementTitle').value.trim();
        const content = document.getElementById('announcementContent').value.trim();
        const mediaFile = document.getElementById('announcementMedia').files[0];
        
        if (!title || !content) {
            alert('Por favor, complete al menos el título y contenido del anuncio.');
            return;
        }
        
        // Ocultar mensaje de "no hay anuncios"
        noAnnouncement.classList.add('hidden');
        
        // Limpiar anuncios anteriores (solo debe haber uno)
        const existingAnnouncements = announcementList.querySelectorAll('.announcement-card');
        existingAnnouncements.forEach(ann => ann.remove());
        
        // Crear elemento de anuncio
        const announcementElement = document.createElement('div');
        announcementElement.className = 'announcement-card fade-in';
        
        // Obtener fecha y hora actual
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Construir el contenido del anuncio
        let announcementHTML = `
            <div class="announcement-header">
                <span class="announcement-author">
                    <i class="fas fa-user-circle"></i> Tú
                </span>
                <span class="announcement-date">${dateStr}</span>
                <button class="btn btn-danger btn-sm" onclick="deleteAnnouncement(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="announcement-content">
                <h4>${title}</h4>
                <p>${content}</p>
            </div>
        `;
        
        // Si hay medio, agregarlo
        if (mediaFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
                const mediaLabel = mediaType === 'image'
