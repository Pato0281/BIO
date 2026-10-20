
/* =========================================================
   SANIDADAPP - CONTROL FITOSANITARIO
   Archivo: app.js

   Funciones:
   - Firebase Firestore y Authentication
   - Mundos BIO y QUÍMICO
   - Búsqueda y filtros
   - Alta, edición y eliminación de productos
   - Cuatro campos de plagas
   - Dosificación por 100 litros o por hectárea
   - Tabla automática para 1, 15, 100 y 160 litros
   - Compatibilidad con registros antiguos
   - Sin fotografías, Gemini ni análisis mediante IA
   ========================================================= */


// =========================================================
// 1. FIREBASE
// =========================================================

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  updateDoc,
  deleteDoc
} from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyC6ZZTc1cvEu5sT8yLtC4mKIwMDbPT0L-4",
  authDomain: "bio-control-cdc2e.firebaseapp.com",
  projectId: "bio-control-cdc2e",
  storageBucket: "bio-control-cdc2e.firebasestorage.app",
  messagingSenderId: "751277149960",
  appId: "1:751277149960:web:dda2d68b510b85acb9a6bd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const recetasRef = collection(db, "recetas");


// =========================================================
// 2. ESTADO
// =========================================================

let esAdmin = false;
let usuarioActual = null;
let mundoActual = "bio";
let filtroFuncionActual = "todos";
let todosLosDatos = [];
let errorLecturaFirebase = null;


// =========================================================
// 3. ELEMENTOS HTML
// =========================================================

// Mundos
const btnWorldBio = document.getElementById("btn-world-bio");
const btnWorldQui = document.getElementById("btn-world-qui");

// Métricas
const statsTitle = document.getElementById("stats-title");
const resultsTitle = document.getElementById("results-title");
const statTotal = document.getElementById("stat-total");
const statConditionalCard = document.getElementById("stat-conditional-card");

// Búsqueda y resultados
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".btn-filter");
const recipesContainer = document.getElementById("recipes-container");

// Administración
const btnOpenLogin = document.getElementById("btn-open-login");
const adminLoggedInfo = document.getElementById("admin-logged-info");
const btnLogout = document.getElementById("btn-logout");
const loginModal = document.getElementById("login-modal");
const loginForm = document.getElementById("login-form");
const btnCloseLogin = document.getElementById("btn-close-login");

// Formulario
const sectionFormContainer = document.querySelector(".form-section");
const recipeForm = document.getElementById("recipe-form");
const recipeId = document.getElementById("recipe-id");
const formTitle = document.getElementById("form-title");
const btnFormSubmit = document.getElementById("btn-form-submit");
const btnFormCancel = document.getElementById("btn-form-cancel");

const tipoRegistroSelect = document.getElementById("form-tipo-registro");
const recipeName = document.getElementById("recipe-name");
const recipeFabricante = document.getElementById("recipe-fabricante");
const recipeRegistro = document.getElementById("recipe-registro");

// Función
const functionCheckboxes = document.querySelectorAll(
  'input[name="funcion"]'
);

// Plagas
const plagaInputs = [
  document.getElementById("recipe-plaga-1"),
  document.getElementById("recipe-plaga-2"),
  document.getElementById("recipe-plaga-3"),
  document.getElementById("recipe-plaga-4")
];

// Dosificación
const doseTypeSelect = document.getElementById("recipe-dose-type");
const doseWaterFields = document.getElementById("dose-water-fields");
const doseHaFields = document.getElementById("dose-ha-fields");

const doseValueInput = document.getElementById("recipe-dose-value");
const doseLowInput = document.getElementById("recipe-dose-low");
const doseHighInput = document.getElementById("recipe-dose-high");
const doseHaWaterInput = document.getElementById("recipe-dose-ha-water");
const doseWaterBaseInput = document.getElementById("recipe-dose-water-base");

const doseUnitRadios = document.querySelectorAll(
  'input[name="dose-unit"]'
);

const doseTableWrapper = document.getElementById("dose-table-wrapper");
const doseValidationMessage = document.getElementById("dose-validation-message");
const doseConfirmationSummary = document.getElementById("dose-confirmation-summary");
const doseConfirmBox = document.getElementById("dose-confirm-box");
const doseConfirmStatus = document.getElementById("dose-confirm-status");

const btnConfirmDoses = document.getElementById("btn-confirm-doses");
const btnCancelDoses = document.getElementById("btn-cancel-doses");

// Celdas de la tabla
const doseCells = {
  1: {
    low: document.getElementById("dose-low-1"),
    high: document.getElementById("dose-high-1")
  },
  15: {
    low: document.getElementById("dose-low-15"),
    high: document.getElementById("dose-high-15")
  },
  100: {
    low: document.getElementById("dose-low-100"),
    high: document.getElementById("dose-high-100")
  },
  160: {
    low: document.getElementById("dose-low-160"),
    high: document.getElementById("dose-high-160")
  }
};

// Campo de compatibilidad con registros antiguos
const recipeApp = document.getElementById("recipe-app");

// BIO
const recipeEfectividad = document.getElementById("recipe-efectividad");
const recipeContra = document.getElementById("recipe-contra");
const recipeIngredients = document.getElementById("recipe-ingredients");
const recipePrep = document.getElementById("recipe-prep");

// QUÍMICOS
const recipeActivo = document.getElementById("recipe-activo");
const recipeConcentracion = document.getElementById("recipe-concentracion");
const recipeCarencia = document.getElementById("recipe-carencia");
const recipeReentrada = document.getElementById("recipe-reentrada");

const modoAccionCheckboxes = document.querySelectorAll(
  'input[name="modo_accion"]'
);


// =========================================================
// 4. FUNCIONES GENERALES
// =========================================================

function escaparHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function normalizarTipo(valor) {
  return normalizarTexto(valor).includes("quim")
    ? "quimico"
    : "bio";
}


function convertirArray(valor) {
  if (Array.isArray(valor)) {
    return valor.map(v => String(v ?? "").trim()).filter(Boolean);
  }

  if (valor === null || valor === undefined || valor === "") {
    return [];
  }

  return String(valor)
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}


function obtenerNumero(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return null;
  }

  const numero = Number(String(valor).trim().replace(",", "."));

  return Number.isFinite(numero) ? numero : null;
}


function formatearNumero(numero) {
  if (numero === null || numero === undefined || !Number.isFinite(Number(numero))) {
    return "—";
  }

  return Number(numero).toLocaleString("es-CL", {
    maximumFractionDigits: 4
  });
}


function obtenerUnidad() {
  const seleccionado = document.querySelector(
    'input[name="dose-unit"]:checked'
  );

  if (!seleccionado) return "cc";

  const unidad = normalizarTexto(seleccionado.value);

  if (unidad === "ml") return "mL";
  if (unidad === "g" || unidad === "gramos") return "g";

  return "cc";
}


function seleccionarUnidad(unidad) {
  const normalizada = normalizarTexto(unidad || "cc");

  doseUnitRadios.forEach(radio => {
    radio.checked =
      normalizarTexto(radio.value) === normalizada;
  });
}


function obtenerMensajeError(error) {
  const codigo = error?.code || "";

  if (codigo.includes("permission-denied")) {
    return "Firebase rechazó la operación por permisos. Revisa las reglas de Firestore.";
  }

  if (codigo.includes("auth/invalid-credential")) {
    return "Correo o contraseña incorrectos.";
  }

  if (codigo.includes("auth/too-many-requests")) {
    return "Demasiados intentos. Espera un momento antes de volver a intentarlo.";
  }

  if (codigo.includes("auth/network-request-failed")) {
    return "No se pudo conectar con Firebase. Revisa Internet.";
  }

  return error?.message || "Error desconocido.";
}


// =========================================================
// 5. FUNCIONES Y PLAGAS
// =========================================================

function obtenerFunciones() {
  return Array.from(functionCheckboxes)
    .filter(input => input.checked)
    .map(input => input.value);
}


function cargarFunciones(funciones) {
  const lista = convertirArray(funciones).map(normalizarTexto);

  functionCheckboxes.forEach(input => {
    input.checked = lista.includes(normalizarTexto(input.value));
  });
}


function obtenerPlagas() {
  return plagaInputs
    .map(input => input?.value?.trim() || "")
    .filter(Boolean);
}


function cargarPlagas(plagas) {
  const lista = convertirArray(plagas);

  plagaInputs.forEach((input, indice) => {
    if (input) input.value = lista[indice] || "";
  });
}


function obtenerModosAccion() {
  return Array.from(modoAccionCheckboxes)
    .filter(input => input.checked)
    .map(input => input.value);
}


function cargarModosAccion(modos) {
  const lista = convertirArray(modos).map(normalizarTexto);

  modoAccionCheckboxes.forEach(input => {
    input.checked = lista.includes(normalizarTexto(input.value));
  });
}


// =========================================================
// 6. CAMBIO ENTRE BIO Y QUÍMICO
// =========================================================

function alternarCamposFormulario(tipo) {
  const esBio = normalizarTipo(tipo) === "bio";

  const bio = document.getElementById("section-form-bio");
  const quimico = document.getElementById("section-form-quimico");

  if (bio) bio.style.display = esBio ? "block" : "none";
  if (quimico) quimico.style.display = esBio ? "none" : "block";
}


if (tipoRegistroSelect) {
  tipoRegistroSelect.addEventListener("change", () => {
    alternarCamposFormulario(tipoRegistroSelect.value);
  });
}


function cambiarMundo(tipo) {
  mundoActual = normalizarTipo(tipo);
  filtroFuncionActual = "todos";

  if (btnWorldBio) {
    btnWorldBio.className =
      mundoActual === "bio"
        ? "btn-world active-bio"
        : "btn-world";
  }

  if (btnWorldQui) {
    btnWorldQui.className =
      mundoActual === "quimico"
        ? "btn-world active-qui"
        : "btn-world";
  }

  if (statsTitle) {
    statsTitle.textContent =
      mundoActual === "bio"
        ? "Métricas Mundo Bio"
        : "Métricas Mundo Químico";
  }

  if (resultsTitle) {
    resultsTitle.textContent =
      mundoActual === "bio"
        ? "Listado de Biopreparados"
        : "Listado de Productos Químicos";
  }

  if (statConditionalCard) {
    statConditionalCard.innerHTML =
      mundoActual === "bio"
        ? 'Eficacia Alta <span id="stat-alta">0</span>'
        : 'Sistémicos <span id="stat-alta">0</span>';
  }

  filterButtons.forEach(button => {
    const activo = button.dataset.funcion === "todos";
    button.style.background = activo ? "#81c784" : "#f1f8e9";
  });

  if (tipoRegistroSelect && esAdmin && !recipeId?.value) {
    tipoRegistroSelect.value = mundoActual;
    alternarCamposFormulario(mundoActual);
  }

  calcularMetricasYRender();
}


if (btnWorldBio) {
  btnWorldBio.addEventListener("click", () => cambiarMundo("bio"));
}

if (btnWorldQui) {
  btnWorldQui.addEventListener("click", () => cambiarMundo("quimico"));
}


// =========================================================
// 7. CALCULADORA DE DOSIFICACIÓN
// =========================================================

let dosisConfirmada = false;


function obtenerDatosDosisFormulario() {
  const tipo = doseTypeSelect?.value || "agua";
  const unidad = obtenerUnidad();

  if (tipo === "agua") {
    const valor = obtenerNumero(doseValueInput?.value);

    return {
      tipo,
      unidad,
      minima: valor,
      maxima: valor,
      aguaPorHectarea: null,
      baseAgua: 100
    };
  }

  return {
    tipo,
    unidad,
    minima: obtenerNumero(doseLowInput?.value),
    maxima: obtenerNumero(doseHighInput?.value),
    aguaPorHectarea: obtenerNumero(doseHaWaterInput?.value),
    baseAgua: 100
  };
}


function obtenerDosisEquivalente(datos) {
  if (datos.tipo === "agua") {
    return {
      minimaPorLitro: datos.minima / 100,
      maximaPorLitro: datos.maxima / 100
    };
  }

  return {
    minimaPorLitro: datos.minima / datos.aguaPorHectarea,
    maximaPorLitro: datos.maxima / datos.aguaPorHectarea
  };
}


function validarDatosDosis(datos) {
  if (datos.minima === null || datos.minima <= 0) {
    return "Ingresa una dosis válida mayor que cero.";
  }

  if (datos.maxima === null || datos.maxima <= 0) {
    return "Ingresa una dosis máxima válida.";
  }

  if (datos.maxima < datos.minima) {
    return "La dosis máxima no puede ser menor que la mínima.";
  }

  if (datos.tipo === "ha") {
    if (
      datos.aguaPorHectarea === null ||
      datos.aguaPorHectarea <= 0
    ) {
      return "Ingresa el volumen de agua recomendado en litros por hectárea.";
    }
  }

  return "";
}


function calcularTablaDosis(datos) {
  const equivalente = obtenerDosisEquivalente(datos);
  const litros = [1, 15, 100, 160];
  const tabla = {};

  litros.forEach(cantidad => {
    tabla[cantidad] = {
      baja: equivalente.minimaPorLitro * cantidad,
      alta: equivalente.maximaPorLitro * cantidad
    };
  });

  return tabla;
}


function actualizarTablaDosis() {
  if (!doseTypeSelect || !doseTableWrapper) return;

  const tipo = doseTypeSelect.value;

  if (doseWaterFields) {
    doseWaterFields.style.display =
      tipo === "agua" ? "block" : "none";
  }

  if (doseHaFields) {
    doseHaFields.style.display =
      tipo === "ha" ? "block" : "none";
  }

  const datos = obtenerDatosDosisFormulario();

  const hayValores =
    tipo === "agua"
      ? doseValueInput?.value !== ""
      : doseLowInput?.value !== "" ||
        doseHighInput?.value !== "" ||
        doseHaWaterInput?.value !== "";

  if (!hayValores) {
    doseTableWrapper.style.display = "none";
    return;
  }

  const error = validarDatosDosis(datos);

  if (error) {
    doseTableWrapper.style.display = "none";

    if (doseValidationMessage) {
      doseValidationMessage.textContent = error;
      doseValidationMessage.style.color = "#b42318";
    }

    dosisConfirmada = false;

    if (doseConfirmStatus) doseConfirmStatus.textContent = "";

    return;
  }

  const tabla = calcularTablaDosis(datos);
  doseTableWrapper.style.display = "block";

  Object.keys(tabla).forEach(litros => {
    const celdas = doseCells[litros];

    if (celdas?.low) {
      celdas.low.textContent =
        `${formatearNumero(tabla[litros].baja)} ${datos.unidad}`;
    }

    if (celdas?.high) {
      celdas.high.textContent =
        `${formatearNumero(tabla[litros].alta)} ${datos.unidad}`;
    }
  });

  if (doseValidationMessage) {
    doseValidationMessage.textContent =
      tipo === "ha"
        ? `Equivalencia calculada a partir de ${formatearNumero(datos.aguaPorHectarea)} L de agua/ha.`
        : "Equivalencias calculadas a partir de la dosis por 100 L de agua.";

    doseValidationMessage.style.color = "#18794e";
  }

  if (doseConfirmationSummary) {
    doseConfirmationSummary.textContent =
      tipo === "ha"
        ? `Dosis original: ${formatearNumero(datos.minima)}–${formatearNumero(datos.maxima)} ${datos.unidad}/ha; volumen de agua: ${formatearNumero(datos.aguaPorHectarea)} L/ha.`
        : `Dosis original: ${formatearNumero(datos.minima)} ${datos.unidad}/100 L de agua.`;
  }

  if (doseConfirmBox) {
    doseConfirmBox.style.display =
      dosisConfirmada ? "none" : "block";
  }

  if (doseConfirmStatus) {
    doseConfirmStatus.textContent =
      dosisConfirmada
        ? "✓ Dosificación confirmada."
        : "Revisa la tabla y confirma antes de guardar.";

    doseConfirmStatus.style.color =
      dosisConfirmada ? "#18794e" : "#b54708";
  }
}


[
  doseTypeSelect,
  doseValueInput,
  doseLowInput,
  doseHighInput,
  doseHaWaterInput
].forEach(input => {
  if (!input) return;

  input.addEventListener("input", () => {
    dosisConfirmada = false;
    actualizarTablaDosis();
  });

  input.addEventListener("change", () => {
    dosisConfirmada = false;
    actualizarTablaDosis();
  });
});


doseUnitRadios.forEach(input => {
  input.addEventListener("change", () => {
    dosisConfirmada = false;
    actualizarTablaDosis();
  });
});


if (btnConfirmDoses) {
  btnConfirmDoses.addEventListener("click", () => {
    const datos = obtenerDatosDosisFormulario();
    const error = validarDatosDosis(datos);

    if (error) {
      alert(error);
      return;
    }

    dosisConfirmada = true;
    actualizarTablaDosis();
  });
}


if (btnCancelDoses) {
  btnCancelDoses.addEventListener("click", () => {
    dosisConfirmada = false;

    if (doseConfirmBox) doseConfirmBox.style.display = "none";

    if (doseConfirmStatus) {
      doseConfirmStatus.textContent =
        "Confirmación pendiente. Debes confirmar la dosis antes de guardar.";
      doseConfirmStatus.style.color = "#b54708";
    }
  });
}


// =========================================================
// 8. CONVERTIR DOSIS ANTIGUAS
// =========================================================

function obtenerDosisGuardada(item) {
  if (
    item.dosis_minima !== undefined &&
    item.dosis_maxima !== undefined &&
    item.tipo_dosificacion
  ) {
    return {
      tipo: item.tipo_dosificacion,
      unidad: item.unidad_dosis || "cc",
      minima: Number(item.dosis_minima),
      maxima: Number(item.dosis_maxima),
      aguaPorHectarea:
        item.volumen_agua_ha == null
          ? null
          : Number(item.volumen_agua_ha)
    };
  }

  // Compatibilidad con los datos anteriores.
  // Los registros antiguos guardaban el texto en modo_aplicacion.
  return null;
}


function renderizarDosisTarjeta(item) {
  const dosis = obtenerDosisGuardada(item);

  if (!dosis) {
    const antigua =
      item.modo_aplicacion ||
      item.dosis ||
      "";

    return antigua
      ? `<p><strong>Dosis original:</strong> ${escaparHTML(antigua)}</p>`
      : "<p><strong>Dosis:</strong> No especificada</p>";
  }

  const agua = dosis.tipo === "ha"
    ? dosis.aguaPorHectarea
    : 100;

  if (!agua || agua <= 0) {
    return `<p><strong>Dosis original:</strong> ${escaparHTML(item.modo_aplicacion || "")}</p>`;
  }

  const equivalencia = {
    minima: dosis.minima / agua,
    maxima: dosis.maxima / agua
  };

  const tabla = [1, 15, 100, 160].map(litros => ({
    litros,
    baja: equivalencia.minima * litros,
    alta: equivalencia.maxima * litros
  }));

  return `
    <div class="dose-card">
      <p>
        <strong>Dosis original:</strong>
        ${formatearNumero(dosis.minima)}–${formatearNumero(dosis.maxima)}
        ${escaparHTML(dosis.unidad)}${dosis.tipo === "ha" ? "/ha" : "/100 L"}
      </p>

      ${dosis.tipo === "ha"
        ? `<p><strong>Volumen de agua:</strong> ${formatearNumero(dosis.aguaPorHectarea)} L/ha</p>`
        : ""
      }

      <div class="tabla-dosis-container">
        <table class="tabla-dosis">
          <thead>
            <tr>
              <th>Agua</th>
              <th>Dosis mínima</th>
              <th>Dosis máxima</th>
            </tr>
          </thead>
          <tbody>
            ${tabla.map(fila => `
              <tr>
                <td>${fila.litros} L</td>
                <td>${formatearNumero(fila.baja)} ${escaparHTML(dosis.unidad)}</td>
                <td>${formatearNumero(fila.alta)} ${escaparHTML(dosis.unidad)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}


// =========================================================
// 9. CAMBIAR FORMULARIO ENTRE ALTA Y EDICIÓN
// =========================================================

function cargarItemEnFormulario(item) {
  if (!esAdmin) {
    alert("Debes iniciar sesión como administrador.");
    return;
  }

  recipeId.value = item.id || "";
  tipoRegistroSelect.value = normalizarTipo(item.tipo_registro);
  alternarCamposFormulario(tipoRegistroSelect.value);

  recipeName.value = item.nombre || "";

  if (recipeFabricante) {
    recipeFabricante.value = item.fabricante || "";
  }

  if (recipeRegistro) {
    recipeRegistro.value = item.registro || "";
  }

  cargarFunciones(item.funcion);
  cargarPlagas(item.plagas_objetivo);

  if (recipeEfectividad) {
    recipeEfectividad.value =
      item.efectividad || "En fase de evaluación";
  }

  if (recipeContra) {
    recipeContra.value =
      item.contraindicacion || item.contraindicaciones || "";
  }

  if (recipeIngredients) {
    recipeIngredients.value = item.ingredientes || "";
  }

  if (recipePrep) {
    recipePrep.value = item.preparacion || "";
  }

  if (recipeActivo) {
    recipeActivo.value = item.ingrediente_activo || "";
  }

  if (recipeConcentracion) {
    recipeConcentracion.value = item.concentracion || "";
  }

  if (recipeCarencia) {
    recipeCarencia.value = item.carencia || "";
  }

  if (recipeReentrada) {
    recipeReentrada.value = item.reentrada || "";
  }

  cargarModosAccion(item.modo_accion);

  const dosis = obtenerDosisGuardada(item);

  if (doseTypeSelect) {
    doseTypeSelect.value = dosis?.tipo || "agua";
  }

  if (doseValueInput) {
    doseValueInput.value =
      dosis?.tipo === "agua" ? dosis.minima : "";
  }

  if (doseLowInput) {
    doseLowInput.value =
      dosis?.tipo === "ha" ? dosis.minima : "";
  }

  if (doseHighInput) {
    doseHighInput.value =
      dosis?.tipo === "ha" ? dosis.maxima : "";
  }

  if (doseHaWaterInput) {
    doseHaWaterInput.value =
      dosis?.tipo === "ha" ? dosis.aguaPorHectarea : "";
  }

  seleccionarUnidad(dosis?.unidad || "cc");

  // Los registros antiguos no deben convertirse automáticamente
  // a una dosis nueva si no disponemos de sus datos originales.
  if (!dosis && recipeApp) {
    recipeApp.value = item.modo_aplicacion || "";
  }

  dosisConfirmada = Boolean(dosis);

  if (formTitle) {
    formTitle.textContent = "Editar producto";
  }

  if (btnFormSubmit) {
    btnFormSubmit.textContent = "Actualizar producto";
  }

  if (btnFormCancel) {
    btnFormCancel.style.display = "inline-block";
  }

  actualizarTablaDosis();

  if (sectionFormContainer) {
    sectionFormContainer.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


function resetearFormulario() {
  if (recipeForm) recipeForm.reset();

  if (recipeId) recipeId.value = "";

  if (tipoRegistroSelect) {
    tipoRegistroSelect.value = mundoActual;
  }

  if (doseWaterBaseInput) {
    doseWaterBaseInput.value = "100";
  }

  dosisConfirmada = false;

  if (formTitle) {
    formTitle.textContent = "Agregar Nuevo Producto";
  }

  if (btnFormSubmit) {
    btnFormSubmit.textContent = "Guardar producto";
    btnFormSubmit.disabled = false;
  }

  if (btnFormCancel) {
    btnFormCancel.style.display = "none";
  }

  if (doseTableWrapper) {
    doseTableWrapper.style.display = "none";
  }

  if (doseConfirmBox) {
    doseConfirmBox.style.display = "block";
  }

  if (doseValidationMessage) {
    doseValidationMessage.textContent = "";
  }

  if (doseConfirmationSummary) {
    doseConfirmationSummary.textContent = "";
  }

  if (doseConfirmStatus) {
    doseConfirmStatus.textContent = "";
  }

  seleccionarUnidad("cc");
  alternarCamposFormulario(mundoActual);
}


if (btnFormCancel) {
  btnFormCancel.addEventListener("click", resetearFormulario);
}


// =========================================================
// 10. GUARDAR PRODUCTOS
// =========================================================

if (recipeForm) {
  recipeForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!esAdmin || !auth.currentUser) {
      alert("Acceso denegado: debes iniciar sesión como administrador.");
      return;
    }

    const nombre = recipeName.value.trim();

    if (!nombre) {
      alert("Ingresa el nombre del producto.");
      recipeName.focus();
      return;
    }

    const funciones = obtenerFunciones();

    if (!funciones.length) {
      alert("Selecciona al menos una función técnica.");
      return;
    }

    const tipo = normalizarTipo(tipoRegistroSelect.value);
    const datosDosis = obtenerDatosDosisFormulario();

    const hayDosis =
      doseTypeSelect?.value === "agua"
        ? doseValueInput?.value !== ""
        : doseLowInput?.value !== "" ||
          doseHighInput?.value !== "" ||
          doseHaWaterInput?.value !== "";

    if (hayDosis) {
      const errorDosis = validarDatosDosis(datosDosis);

      if (errorDosis) {
        alert(errorDosis);
        return;
      }

      if (!dosisConfirmada) {
        alert("Revisa y confirma la tabla de dosificación antes de guardar.");
        return;
      }
    }

    const ahora = new Date().toISOString();

    const datos = {
      tipo_registro: tipo,
      nombre,
      fabricante: recipeFabricante?.value?.trim() || "",
      registro: recipeRegistro?.value?.trim() || "",
      funcion: funciones,
      plagas_objetivo: obtenerPlagas(),
      actualizado_el: ahora,
      actualizado_por: auth.currentUser.email || ""
    };

    // BIO
    datos.efectividad = recipeEfectividad?.value || "";
    datos.contraindicacion = recipeContra?.value?.trim() || "";
    datos.ingredientes = recipeIngredients?.value?.trim() || "";
    datos.preparacion = recipePrep?.value?.trim() || "";

    // QUÍMICO
    datos.ingrediente_activo = recipeActivo?.value?.trim() || "";
    datos.concentracion = recipeConcentracion?.value?.trim() || "";
    datos.modo_accion = obtenerModosAccion();
    datos.carencia = recipeCarencia?.value?.trim() || "";
    datos.reentrada = recipeReentrada?.value?.trim() || "";

    // DOSIFICACIÓN
    if (hayDosis) {
      datos.tipo_dosificacion = datosDosis.tipo;
      datos.unidad_dosis = datosDosis.unidad;
      datos.dosis_minima = datosDosis.minima;
      datos.dosis_maxima = datosDosis.maxima;
      datos.volumen_agua_ha =
        datosDosis.tipo === "ha"
          ? datosDosis.aguaPorHectarea
          : null;
      datos.dosis_confirmada = true;

      datos.dosis_original =
        datosDosis.tipo === "ha"
          ? `${formatearNumero(datosDosis.minima)}–${formatearNumero(datosDosis.maxima)} ${datosDosis.unidad}/ha; agua: ${formatearNumero(datosDosis.aguaPorHectarea)} L/ha`
          : `${formatearNumero(datosDosis.minima)} ${datosDosis.unidad}/100 L`;

      datos.modo_aplicacion = datos.dosis_original;
    } else {
      // No inventar una dosis cuando no se ha introducido.
      datos.tipo_dosificacion = "";
      datos.unidad_dosis = "";
      datos.dosis_minima = null;
      datos.dosis_maxima = null;
      datos.volumen_agua_ha = null;
      datos.dosis_confirmada = false;

      // Conservar el texto anterior si se está editando un producto antiguo
      // y el usuario no ha ingresado una nueva dosis.
      const existente = todosLosDatos.find(r => r.id === recipeId.value);

      datos.modo_aplicacion =
        existente?.modo_aplicacion || "";
    }

    if (btnFormSubmit) {
      btnFormSubmit.disabled = true;
      btnFormSubmit.textContent = "Guardando...";
    }

    try {
      const id = recipeId.value.trim();

      if (id) {
        await updateDoc(doc(db, "recetas", id), datos);
        alert("Producto actualizado correctamente.");
      } else {
        datos.creado_el = ahora;
        datos.creado_por = auth.currentUser.email || "";

        await addDoc(recetasRef, datos);
        alert("Producto registrado correctamente.");
      }

      resetearFormulario();
    } catch (error) {
      console.error("Error guardando producto:", error);
      alert("No se pudo guardar el producto.\n\n" + obtenerMensajeError(error));
    } finally {
      if (btnFormSubmit) {
        btnFormSubmit.disabled = false;
        btnFormSubmit.textContent =
          recipeId?.value ? "Actualizar producto" : "Guardar producto";
      }
    }
  });
}


// =========================================================
// 11. TARJETAS DE PRODUCTOS
// =========================================================

function renderizarTarjeta(item) {
  const tipo = normalizarTipo(item.tipo_registro);
  const esQuimico = tipo === "quimico";

  const nombre = escaparHTML(item.nombre || "Producto sin nombre");
  const funciones = convertirArray(item.funcion);
  const plagas = convertirArray(item.plagas_objetivo);

  const etiquetas = funciones
    .map(f => `<span class="tag">${escaparHTML(f)}</span>`)
    .join("");

  const plagasHTML = plagas.length
    ? `<p><strong>Plagas o enfermedades:</strong> ${plagas.map(escaparHTML).join(", ")}</p>`
    : "";

  const botonesAdmin = esAdmin
    ? `
      <div class="action-buttons">
        <button type="button" class="btn-action btn-edit" data-id="${escaparHTML(item.id)}" aria-label="Editar producto">✏️ Editar</button>
        <button type="button" class="btn-action btn-delete" data-id="${escaparHTML(item.id)}" aria-label="Eliminar producto">🗑️ Eliminar</button>
      </div>
    `
    : "";

  let detalles = "";

  if (esQuimico) {
    detalles = `
      <p><strong>Ingrediente activo:</strong> ${escaparHTML(item.ingrediente_activo || "No especificado")}</p>
      <p><strong>Concentración:</strong> ${escaparHTML(item.concentracion || "No especificada")}</p>
      <p><strong>Modo de acción:</strong> ${escaparHTML(convertirArray(item.modo_accion).join(", ") || "No especificado")}</p>
      <p><strong>Carencia:</strong> ${escaparHTML(item.carencia || "No indicado")}</p>
      <p><strong>Reentrada:</strong> ${escaparHTML(item.reentrada || "No indicado")}</p>
    `;
  } else {
    detalles = `
      <p><strong>Efectividad:</strong> ${escaparHTML(item.efectividad || "En evaluación")}</p>
      <p><strong>Ingredientes:</strong> ${escaparHTML(item.ingredientes || "No especificados")}</p>
      <p><strong>Preparación:</strong> ${escaparHTML(item.preparacion || "No especificada")}</p>
      <p><strong>Advertencias:</strong> ${escaparHTML(item.contraindicacion || "No indicadas")}</p>
    `;
  }

  const fabricante = item.fabricante
    ? `<p><strong>Fabricante:</strong> ${escaparHTML(item.fabricante)}</p>`
    : "";

  const registro = item.registro
    ? `<p><strong>Registro:</strong> ${escaparHTML(item.registro)}</p>`
    : "";

  return `
    <div class="recipe-card ${esQuimico ? "card-qui" : "card-bio"}">
      ${botonesAdmin}

      <h3 class="${esQuimico ? "qui-title" : ""}">${nombre}</h3>

      <div class="recipe-tags">
        ${etiquetas}
      </div>

      ${fabricante}
      ${registro}
      ${plagasHTML}

      ${renderizarDosisTarjeta(item)}

      <button
        type="button"
        class="btn-toggle ${esQuimico ? "qui-toggle" : ""}"
        data-id="${escaparHTML(item.id)}">
        Ver detalles
      </button>

      <div class="extra-content" id="extra-${escaparHTML(item.id)}" style="display:none;">
        ${detalles}
      </div>
    </div>
  `;
}


function asignarEventosTarjetas() {
  document.querySelectorAll(".btn-toggle").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const panel = document.getElementById(`extra-${id}`);

      if (!panel) return;

      const visible = panel.style.display === "block";
      panel.style.display = visible ? "none" : "block";
      button.textContent = visible ? "Ver detalles" : "Ocultar detalles";
    });
  });

  if (!esAdmin) return;

  document.querySelectorAll(".btn-edit").forEach(button => {
    button.addEventListener("click", () => {
      const item = todosLosDatos.find(r => r.id === button.dataset.id);

      if (item) cargarItemEnFormulario(item);
    });
  });

  document.querySelectorAll(".btn-delete").forEach(button => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const item = todosLosDatos.find(r => r.id === id);

      if (!item) return;

      const confirmar = confirm(
        `¿Deseas eliminar el producto "${item.nombre || "sin nombre"}"?`
      );

      if (!confirmar) return;

      try {
        await deleteDoc(doc(db, "recetas", id));
        alert("Producto eliminado correctamente.");
      } catch (error) {
        console.error("Error eliminando producto:", error);
        alert("No se pudo eliminar el producto.\n\n" + obtenerMensajeError(error));
      }
    });
  });
}


// =========================================================
// 12. BÚSQUEDA, FILTROS Y MÉTRICAS
// =========================================================

function calcularMetricasYRender() {
  const datosMundo = todosLosDatos.filter(
    item => normalizarTipo(item.tipo_registro) === mundoActual
  );

  if (statTotal) {
    statTotal.textContent = datosMundo.length;
  }

  const cantidadCondicional = datosMundo.filter(item => {
    if (mundoActual === "bio") {
      return normalizarTexto(item.efectividad).includes("alta");
    }

    return convertirArray(item.modo_accion)
      .map(normalizarTexto)
      .includes("sistemico");
  }).length;

  const statAltaActual = document.getElementById("stat-alta");

  if (statAltaActual) {
    statAltaActual.textContent = cantidadCondicional;
  }

  if (!recipesContainer) return;

  if (errorLecturaFirebase) {
    recipesContainer.innerHTML = `
      <div class="firebase-error">
        <h3>No se pudieron cargar los productos</h3>
        <p>${escaparHTML(obtenerMensajeError(errorLecturaFirebase))}</p>
      </div>
    `;
    return;
  }

  const busqueda = normalizarTexto(searchInput?.value || "");

  const filtrados = datosMundo.filter(item => {
    const funciones = convertirArray(item.funcion).map(normalizarTexto);
    const plagas = convertirArray(item.plagas_objetivo);

    const contenido = [
      item.nombre,
      item.fabricante,
      item.registro,
      item.ingrediente_activo,
      item.concentracion,
      item.ingredientes,
      item.preparacion,
      item.carencia,
      item.reentrada,
      item.modo_aplicacion,
      ...funciones,
      ...plagas
    ].join(" ");

    const coincideTexto =
      normalizarTexto(contenido).includes(busqueda);

    const coincideFuncion =
      filtroFuncionActual === "todos" ||
      funciones.includes(normalizarTexto(filtroFuncionActual));

    return coincideTexto && coincideFuncion;
  });

  if (!filtrados.length) {
    recipesContainer.innerHTML =
      '<p class="loading-text">No se encontraron productos registrados.</p>';
    return;
  }

  recipesContainer.innerHTML =
    filtrados.map(renderizarTarjeta).join("");

  asignarEventosTarjetas();
}


if (searchInput) {
  searchInput.addEventListener("input", calcularMetricasYRender);
}


filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filtroFuncionActual =
      normalizarTexto(button.dataset.funcion || "todos");

    filterButtons.forEach(btn => {
      btn.style.background =
        normalizarTexto(btn.dataset.funcion || "todos") === filtroFuncionActual
          ? "#81c784"
          : "#f1f8e9";
    });

    calcularMetricasYRender();
  });
});


// =========================================================
// 13. INICIO Y CIERRE DE SESIÓN
// =========================================================

function abrirLogin() {
  if (!loginModal) return;

  loginModal.style.display = "flex";

  const email = document.getElementById("login-email");

  if (email) {
    setTimeout(() => email.focus(), 100);
  }
}


function cerrarLogin() {
  if (loginModal) loginModal.style.display = "none";
}


if (btnOpenLogin) {
  btnOpenLogin.addEventListener("click", abrirLogin);
}

if (btnCloseLogin) {
  btnCloseLogin.addEventListener("click", cerrarLogin);
}

if (loginModal) {
  loginModal.addEventListener("click", event => {
    if (event.target === loginModal) cerrarLogin();
  });
}


if (loginForm) {
  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("login-email")?.value?.trim() || "";
    const password = document.getElementById("login-password")?.value || "";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      cerrarLogin();
      loginForm.reset();
      alert("¡Bienvenido al modo administrador!");
    } catch (error) {
      console.error("Error de acceso:", error);
      alert("No se pudo iniciar sesión.\n\n" + obtenerMensajeError(error));
    }
  });
}


if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    try {
      await signOut(auth);
      alert("Sesión cerrada.");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      alert("No se pudo cerrar la sesión.");
    }
  });
}


onAuthStateChanged(auth, user => {
  usuarioActual = user;
  esAdmin = Boolean(user);

  if (btnOpenLogin) {
    btnOpenLogin.style.display = esAdmin ? "none" : "inline-block";
  }

  if (adminLoggedInfo) {
    adminLoggedInfo.style.display = esAdmin ? "inline-block" : "none";

    if (esAdmin) {
      adminLoggedInfo.textContent =
        `👤 Administrador: ${user.email || ""}`;
    }
  }

  if (sectionFormContainer) {
    sectionFormContainer.style.display = esAdmin ? "block" : "none";
  }

  calcularMetricasYRender();
});


// =========================================================
// 14. FIRESTORE EN TIEMPO REAL
// =========================================================

onSnapshot(
  query(recetasRef),

  snapshot => {
    errorLecturaFirebase = null;
    todosLosDatos = [];

    snapshot.forEach(documento => {
      todosLosDatos.push({
        id: documento.id,
        ...documento.data()
      });
    });

    todosLosDatos.sort((a, b) =>
      String(a.nombre || "").localeCompare(
        String(b.nombre || ""),
        "es",
        { sensitivity: "base" }
      )
    );

    console.log(
      `SanidadApp: ${todosLosDatos.length} productos cargados desde Firebase.`
    );

    calcularMetricasYRender();
  },

  error => {
    errorLecturaFirebase = error;

    console.error("Error leyendo productos de Firestore:", error);

    calcularMetricasYRender();
  }
);


// =========================================================
// 15. INICIALIZACIÓN
// =========================================================

if (doseWaterBaseInput) {
  doseWaterBaseInput.value = "100";
}

if (sectionFormContainer) {
  sectionFormContainer.style.display = "none";
}

if (doseTableWrapper) {
  doseTableWrapper.style.display = "none";
}

alternarCamposFormulario(mundoActual);

console.log(
  "SanidadApp iniciado sin fotografía ni análisis de IA."
);
