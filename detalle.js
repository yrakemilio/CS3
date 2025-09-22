// detalle.js - VERSIÓN CORREGIDA
// =====================
// CONFIGURACIÓN GOOGLE SHEETS
// =====================
const BUSINESS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRM9140leocSHNEKxfzFonrlEQdLGklsM3hXBZ_iiwdS4CwsDLeRI-w8c7RjkoqsITvrCCqgYku46-8/pub?output=csv";

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
// OBTENER PARÁMETRO URL
// =====================
function getParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// =====================
// CARGAR DETALLES DEL NEGOCIO
// =====================
async function loadBusinessDetail() {
    const businessId = getParam('id');
    
    if (!businessId) {
        showError();
        return;
    }

    try {
        document.getElementById('detailLoading').classList.remove('hidden');
        document.getElementById('detailError').classList.add('hidden');
        document.getElementById('detail').classList.add('hidden');
        
        // Cargar datos desde Google Sheets
        const response = await fetch(BUSINESS_SHEET_URL);
        const text = await response.text();
        const businessData = parseCSV(text);
        
        // Buscar el negocio por ID
        const business = businessData.find(b => b.id === businessId);
        
        if (!business) {
            showError();
            return;
        }
        
        // Mostrar los detalles del negocio
        renderBusinessDetail(business);
        
        document.getElementById('detailLoading').classList.add('hidden');
        document.getElementById('detail').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error cargando detalle:', error);
        showError();
    }
}

// =====================
// MOSTRAR ERROR
// =====================
function showError() {
    document.getElementById('detailLoading').classList.add('hidden');
    document.getElementById('detailError').classList.remove('hidden');
    document.getElementById('detail').classList.add('hidden');
}

// =====================
// RENDERIZAR DETALLES DEL NEGOCIO
// =====================
function renderBusinessDetail(business) {
    // Logo y información básica - ✅ CORREGIDO
    const logoFileName = business.logo1 || '';
    let logoUrl = 'https://placehold.co/300x300/800020/white?text=Sin+imagen';
    
    if (logoFileName) {
        logoUrl = `https://yrakemilio.github.io/comunidad_suterm/imagenes/easyabogados/${logoFileName}`;
    }
    document.getElementById('detailLogo').src = logoUrl;
    
    document.getElementById('detailName').textContent = business.nombre || 'Sin nombre';
    
    // Información meta
    const metaInfo = [];
    if (business.categoria) metaInfo.push(business.categoria);
    if (business.ciudad) metaInfo.push(business.ciudad);
    if (business.seccion) metaInfo.push(`Sección ${business.seccion}`);
    
    document.getElementById('detailMeta').textContent = metaInfo.join(' • ') || 'Información no disponible';
    
    // Descripción
    document.getElementById('detailDesc').textContent = business.descripcion || 'No hay descripción disponible.';
    
    // Contacto - WhatsApp
    const whatsappElement = document.getElementById('detailWhatsApp');
    const whatsappLink = document.getElementById('whatsappLink');
    const btnWhatsApp = document.getElementById('btnWhatsApp');
    
    if (business.whatsapp) {
        const whatsappNumber = business.whatsapp.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${whatsappNumber}`;
        
        whatsappLink.href = whatsappUrl;
        whatsappLink.textContent = business.whatsapp;
        btnWhatsApp.href = whatsappUrl;
        
        whatsappElement.classList.remove('hidden');
    } else {
        whatsappElement.classList.add('hidden');
        btnWhatsApp.classList.add('hidden');
    }
    
    // Contacto - Página web
    const webElement = document.getElementById('detailWeb');
    const webLink = document.getElementById('webLink');
    const btnWeb = document.getElementById('btnWeb');
    
    if (business.pagina) {
        let webUrl = business.pagina;
        if (!webUrl.startsWith('http')) {
            webUrl = 'https://' + webUrl;
        }
        
        webLink.href = webUrl;
        webLink.textContent = webUrl;
        btnWeb.href = webUrl;
        
        webElement.classList.remove('hidden');
    } else {
        webElement.classList.add('hidden');
        btnWeb.classList.add('hidden');
    }
    
    // Galería de imágenes
    renderGallery(business);
}

// =====================
// RENDERIZAR GALERÍA - ✅ CORREGIDO
// =====================
function renderGallery(business) {
    const galleryContainer = document.getElementById('detailGallery');
    galleryContainer.innerHTML = '';
    
    const images = [];
    const baseUrl = 'https://yrakemilio.github.io/comunidad_suterm/imagenes/easyabogados/';
    
    // Agregar logo si existe - ✅ CORREGIDO
    if (business.logo1) {
        images.push({
            src: baseUrl + business.logo1,
            alt: `Logo ${business.nombre || ''}`
        });
    }
    
    // Agregar imágenes adicionales - ✅ CORREGIDO
    for (let i = 1; i <= 3; i++) {
        const imageKey = `imagen${i}`;
        if (business[imageKey]) {
            images.push({
                src: baseUrl + business[imageKey],
                alt: `Imagen ${i} - ${business.nombre || ''}`
            });
        }
    }
    
    if (images.length === 0) {
        galleryContainer.innerHTML = `
            <div class="no-images">
                <i class="fas fa-image"></i>
                <p>No hay imágenes disponibles</p>
            </div>
        `;
        return;
    }
    
    images.forEach((image, index) => {
        const imgElement = document.createElement('div');
        imgElement.className = 'gallery-item';
        imgElement.innerHTML = `
            <img src="${image.src}" alt="${image.alt}" 
                 onerror="this.style.display='none'"
                 onclick="openLightbox('${image.src}', ${index})">
        `;
        galleryContainer.appendChild(imgElement);
    });
    
    // Guardar imágenes para el lightbox
    galleryImages = images.map(img => img.src);
}

// =====================
// LIGHTBOX PARA GALERÍA
// =====================
let currentImageIndex = 0;
let galleryImages = [];

function openLightbox(src, index) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxVideo = document.getElementById('lightboxVideo');
    
    lightboxImage.style.display = 'block';
    lightboxVideo.style.display = 'none';
    
    lightboxImage.src = src;
    currentImageIndex = index;
    
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function navigateLightbox(direction) {
    currentImageIndex += direction;
    
    if (currentImageIndex < 0) {
        currentImageIndex = galleryImages.length - 1;
    } else if (currentImageIndex >= galleryImages.length) {
        currentImageIndex = 0;
    }
    
    document.getElementById('lightboxImage').src = galleryImages[currentImageIndex];
}

// =====================
// INICIALIZACIÓN
// =====================
document.addEventListener('DOMContentLoaded', function() {
    // Cargar detalles del negocio
    loadBusinessDetail();
    
    // Inicializar lightbox
    initLightbox();
    
    // Inicializar modal legal
    initLegalModal();
});

// =====================
// INICIALIZAR LIGHTBOX
// =====================
function initLightbox() {
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    
    document.getElementById('lightboxPrev').addEventListener('click', function() {
        navigateLightbox(-1);
    });
    
    document.getElementById('lightboxNext').addEventListener('click', function() {
        navigateLightbox(1);
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
    
    document.getElementById('lightbox').addEventListener('click', function(e) {
        if (e.target === this) closeLightbox();
    });
}

// =====================
// MODAL LEGAL
// =====================
function initLegalModal() {
    const modal = document.getElementById('modal-legal');
    const closeBtn = document.querySelector('.modal-close');
    const legalLinks = document.querySelectorAll('a[href="#modal-legal"]');
    
    legalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    });
    
    closeBtn.addEventListener('click', closeLegalModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeLegalModal();
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeLegalModal();
    });
    
    function closeLegalModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// =====================
// ESTILOS ADICIONALES PARA DETALLE
// =====================
const additionalStyles = `
    .detail-header {
        display: flex;
        gap: 20px;
        align-items: center;
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(128, 0, 32, 0.08);
        margin-bottom: 20px;
    }
    
    .detail-logo {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 10px;
        border: 2px solid var(--border);
    }
    
    .detail-name {
        margin: 0;
        color: var(--primary);
        font-size: 1.8rem;
    }
    
    .detail-meta {
        margin: 5px 0 0;
        color: var(--muted);
        font-size: 1rem;
    }
    
    .detail-description, 
    .detail-contact, 
    .detail-gallery {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(128, 0, 32, 0.08);
        margin-bottom: 20px;
    }
    
    .detail-description h3,
    .detail-contact h3,
    .detail-gallery h3 {
        color: var(--primary);
        margin: 0 0 15px 0;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .contact-info {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .contact-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 8px;
    }
    
    .contact-item i {
        color: var(--primary);
        font-size: 1.2rem;
        width: 20px;
    }
    
    .contact-item a {
        color: var(--dark);
        text-decoration: none;
        font-weight: 500;
    }
    
    .contact-item a:hover {
        color: var(--primary);
    }
    
    .gallery {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 15px;
    }
    
    .gallery-item {
        border-radius: 10px;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.3s ease;
    }
    
    .gallery-item:hover {
        transform: scale(1.05);
    }
    
    .gallery-item img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 8px;
    }
    
    .no-images {
        text-align: center;
        padding: 40px;
        color: var(--muted);
    }
    
    .no-images i {
        font-size: 3rem;
        margin-bottom: 10px;
        display: block;
    }
    
    .detail-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(128, 0, 32, 0.08);
    }
    
    .btn.outline {
        background: transparent;
        border: 2px solid var(--primary);
        color: var(--primary);
    }
    
    .btn.outline:hover {
        background: var(--primary);
        color: white;
    }
    
    @media (max-width: 768px) {
        .detail-header {
            flex-direction: column;
            text-align: center;
        }
        
        .detail-actions {
            flex-direction: column;
        }
        
        .gallery {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
    }
`;

// Agregar estilos adicionales al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
