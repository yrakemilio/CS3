// La clave para guardar el anuncio en el almacenamiento local
const ANUNCIO_KEY = "anuncio_comunidad_suterm";

// Elementos del formulario
const annTitleInput = document.getElementById("annTitleInput");
const annDescInput = document.getElementById("annDescInput");
const annImageInput = document.getElementById("annImageInput");
const form = document.getElementById("announcementForm");
const deleteButton = document.getElementById("annDelete");

// Elementos de la vista previa
const previewElement = document.getElementById("announcementPreview");
const previewTitle = document.getElementById("previewTitle");
const previewDescription = document.getElementById("previewDescription");
const previewImage = document.getElementById("previewImage");

// Función para actualizar la vista previa en tiempo real
function updatePreview() {
  previewTitle.textContent = annTitleInput.value;
  previewDescription.textContent = annDescInput.value;

  if (annImageInput.files.length > 0) {
    const file = annImageInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewElement.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    previewImage.src = "";
  }

  // Ocultar la vista previa si no hay nada en el formulario
  if (!annTitleInput.value && !annDescInput.value && annImageInput.files.length === 0) {
    previewElement.classList.add("hidden");
  } else {
    previewElement.classList.remove("hidden");
  }
}

// Escuchamos los cambios en los campos para actualizar la vista previa
annTitleInput.addEventListener("input", updatePreview);
annDescInput.addEventListener("input", updatePreview);
annImageInput.addEventListener("change", updatePreview);

// Función para guardar el anuncio en el almacenamiento local
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const anuncio = {
    title: annTitleInput.value,
    description: annDescInput.value,
    image: previewImage.src,
  };

  localStorage.setItem(ANUNCIO_KEY, JSON.stringify(anuncio));
  alert("El anuncio se ha guardado correctamente. Ahora puedes ver la vista previa en la misma página y el anuncio en la página de inicio.");
});

// Función para eliminar el anuncio del almacenamiento local
deleteButton.addEventListener("click", () => {
  if (confirm("¿Estás seguro de que deseas eliminar el anuncio?")) {
    localStorage.removeItem(ANUNCIO_KEY);
    annTitleInput.value = "";
    annDescInput.value = "";
    annImageInput.value = "";
    previewImage.src = "";
    previewElement.classList.add("hidden");
    alert("El anuncio se ha eliminado.");
  }
});
