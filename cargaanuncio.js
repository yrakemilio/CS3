// La clave para guardar el anuncio en el almacenamiento local
const ANUNCIO_KEY = "anuncio_comunidad_suterm";

const form = document.getElementById("announcementForm");
const deleteButton = document.getElementById("annDelete");
const resultMessage = document.getElementById("resultMessage");
const annTitleInput = document.getElementById("annTitleInput");
const annDescInput = document.getElementById("annDescInput");
const annImageInput = document.getElementById("annImageInput");

// Carga el anuncio existente al iniciar la página
function loadAnnouncement() {
  const savedAnuncio = localStorage.getItem(ANUNCIO_KEY);
  if (savedAnuncio) {
    const anuncio = JSON.parse(savedAnuncio);
    annTitleInput.value = anuncio.title;
    annDescInput.value = anuncio.description;
    annImageInput.value = anuncio.image;
  }
}

// Guarda el anuncio en el almacenamiento local
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const anuncio = {
    title: annTitleInput.value,
    description: annDescInput.value,
    image: annImageInput.value,
  };

  localStorage.setItem(ANUNCIO_KEY, JSON.stringify(anuncio));
  resultMessage.textContent = "¡El anuncio se ha guardado exitosamente!";
  resultMessage.classList.remove("hidden");
});

// Elimina el anuncio del almacenamiento local
deleteButton.addEventListener("click", () => {
  if (confirm("¿Estás seguro de que deseas eliminar el anuncio?")) {
    localStorage.removeItem(ANUNCIO_KEY);
    annTitleInput.value = "";
    annDescInput.value = "";
    annImageInput.value = "";
    resultMessage.textContent = "El anuncio se ha eliminado.";
    resultMessage.classList.remove("hidden");
  }
});

document.addEventListener("DOMContentLoaded", loadAnnouncement);
