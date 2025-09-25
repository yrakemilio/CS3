// AVISO IMPORTANTE:
// Debes reemplazar 'TU_FORM_URL' y 'ID_DEL_TITULO', 'ID_DE_LA_DESCRIPCION', 'ID_DE_LA_IMAGEN'
// con los valores de tu Google Form.

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/TU_FORM_URL/viewform";

// Estos IDs corresponden a los campos de tu Google Form.
// Reemplaza los números de ejemplo con los de tu formulario.
const FIELD_IDS = {
  title: "entry.123456789",
  description: "entry.987654321",
  image: "entry.1122334455",
};

const form = document.getElementById("announcementForm");
const resultMessage = document.getElementById("resultMessage");
const sheetLink = document.getElementById("sheetLink");
const deleteButton = document.getElementById("annDelete");

// Función para pre-rellenar los campos y crear el enlace
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("annTitleInput").value;
  const description = document.getElementById("annDescInput").value;
  const image = document.getElementById("annImageInput").value;

  const params = new URLSearchParams();
  params.append(FIELD_IDS.title, title);
  params.append(FIELD_IDS.description, description);
  params.append(FIELD_IDS.image, image);

  const prefilledUrl = `${GOOGLE_FORM_URL}?usp=pp_url&${params.toString()}`;

  sheetLink.href = prefilledUrl;
  resultMessage.classList.remove("hidden");
});

// Función para el botón de eliminar
deleteButton.addEventListener("click", () => {
  const isConfirmed = confirm("¿Estás seguro de que deseas eliminar el anuncio? Esto lo borrará permanentemente de tu hoja de cálculo.");
  if (isConfirmed) {
    alert("Para eliminar el anuncio, debes ir a la hoja de cálculo de Google Sheets y borrar la fila manualmente.");
    window.open("https://docs.google.com/spreadsheets/d/e/2PACX-1vQS0ZzlICmlRCsrt3V7I2DizA0RceOxIHVzvMhz8bAHaG31gKRFY2hUF0kJbyE755k-ImXzmkPRuyfc/pub?gid=0&single=true&output=csv", "_blank");
  }
});
