// ============================================================
// SANIDADAPP / BIO IA
// app.js
// ============================================================

// ------------------------------------------------------------
// FIREBASE
// ------------------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { analizarEtiqueta } from "./ia.js";
import { firebaseConfig } from "./config.js";


// ------------------------------------------------------------
// INICIALIZACIÓN
// ------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const recetasRef = collection(db, "recetas");


// ------------------------------------------------------------
// ESTADO GLOBAL
// ------------------------------------------------------------

let todosLosDatos = [];
let mundoActual = "bio";
let filtroFuncionActual = "todos";
let textoBusquedaActual = "";
let esAdmin = false;

let dosisConfirmada = false;


// ------------------------------------------------------------
// REFERENCIAS AL DOM
// ------------------------------------------------------------

// ADMIN
const btnOpenLogin = document.getElementById("btn-open-login");
const adminLoggedInfo = document.getElementById("admin-logged-info");
const btnLogout = document.getElementById("btn-logout");

const loginModal = document.getElementById("login-modal");
const loginForm = document.getElementById("login-form");
const btnCloseLogin = document.getElementById("btn-close-login");


// MUNDOS
const btnWorldBio = document.getElementById("btn-world-bio");
const btnWorldQui = document.getElementById("btn-world-qui");


// MÉTRICAS
const statsTitle = document.getElementById("stats-title");
const statTotal = document.getElementById("stat-total");
const statConditionalCard = document.getElementById("stat-conditional-card");
const statAlta = document.getElementById("stat-alta");


// BÚSQUEDA
const searchInput = document.getElementById("search-input");


// RESULTADOS
const resultsTitle = document.getElementById("results-title");
const recipesContainer = document.getElementById("recipes-container");


// FORMULARIO
const sectionFormContainer = document.querySelector(".form-section");
const recipeForm = document.getElementById("recipe-form");
const formTitle = document.getElementById("form-title");
const recipeId = document.getElementById("recipe-id");

const tipoRegistroSelect = document.getElementById("form-tipo-registro");
const recipeName = document.getElementById("recipe-name");


// FUNCIÓN
const functionCheckboxes = document.querySelectorAll(
  'input[name="funcion"]'
);


// PLAGAS
const recipePlaga1 = document.getElementById("recipe-plaga-1");
const recipePlaga2 = document.getElementById("recipe-plaga-2");
const recipePlaga3 = document.getElementById("recipe-plaga-3");
const recipePlaga4 = document.getElementById("recipe-plaga-4");


// DOSIS
const recipeDoseWater = document.getElementById("recipe-dose-water");
const recipeDoseLow = document.getElementById("recipe-dose-low");
const recipeDoseHigh = document.getElementById("recipe-dose-high");

const doseUnitRadios = document.querySelectorAll(
  'input[name="dose-unit"]'
);

const doseValidationMessage = document.getElementById(
  "dose-validation-message"
);

const doseTableWrapper = document.getElementById(
  "dose-table-wrapper"
);

const doseConfirmationSummary = document.getElementById(
  "dose-confirmation-summary"
);

const doseConfirmBox = document.getElementById(
  "dose-confirm-box"
);

const btnConfirmDoses = document.getElementById(
  "btn-confirm-doses"
);

const btnCancelDoses = document.getElementById(
  "btn-cancel-doses"
);

const doseConfirmStatus = document.getElementById(
  "dose-confirm-status"
);


// TABLA DE DOSIS
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


// COMPATIBILIDAD
const recipeApp = document.getElementById("recipe-app");


// BIO
const recipeEfectividad = document.getElementById(
  "recipe-efectividad"
);

const recipeContra = document.getElementById(
  "recipe-contra"
);

const recipeIngredients = document.getElementById(
  "recipe-ingredients"
);

const recipePrep = document.getElementById(
  "recipe-prep"
);


// QUÍMICOS
const recipeActivo = document.getElementById(
  "recipe-activo"
);

const recipeConcentracion = document.getElementById(
  "recipe-concentracion"
);

const recipeCarencia = document.getElementById(
  "recipe-carencia"
);

const recipeReentrada = document.getElementById(
  "recipe-reentrada"
);

const modoAccionRadios = document.querySelectorAll(
  'input[name="modo_accion"]'
);


// BOTONES FORMULARIO
const btnFormSubmit = document.getElementById(
  "btn-form-submit"
);

const btnFormCancel = document.getElementById(
  "btn-form-cancel"
);


// IA
const aiScannerBox = document.getElementById(
  "ai-scanner-box"
);

const aiImageInput = document.getElementById(
  "ai-image-input"
);

const btnTriggerAI = document.getElementById(
  "btn-trigger-ai"
);

const aiLoading = document.getElementById(
  "ai-loading"
);


// ------------------------------------------------------------
// FUNCIONES GENERALES
// ------------------------------------------------------------

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function normalizarTexto(value) {

  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function normalizarArray(value) {

  if (Array.isArray(value)) {

    return value
      .map(item => String(item ?? "").trim())
      .filter(Boolean);

  }

  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === "string") {

    return value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

  }

  return [String(value).trim()].filter(Boolean);
}


function normalizarTipoRegistro(value) {

  const tipo = normalizarTexto(value);

  if (
    tipo.includes("quim") ||
    tipo.includes("pestic") ||
    tipo.includes("fitosanit")
  ) {
    return "quimico";
  }

  return "bio";
}


function normalizarUnidad(value) {

  const unidad = normalizarTexto(value);

  if (unidad === "g" || unidad === "gr" || unidad === "gramos") {
    return "g";
  }

  if (
    unidad === "ml" ||
    unidad === "mililitros" ||
    unidad === "mililitro"
  ) {
    return "mL";
  }

  if (
    unidad === "cc" ||
    unidad === "cm3" ||
    unidad === "cm³"
  ) {
    return "cc";
  }

  return "g";
}


function parseNumero(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const texto = String(value)
    .trim()
    .replace(",", ".");

  const numero = Number(texto);

  return Number.isFinite(numero)
    ? numero
    : null;
}


function formatearNumero(numero) {

  if (
    numero === null ||
    numero === undefined ||
    !Number.isFinite(Number(numero))
  ) {
    return "";
  }

  const n = Number(numero);

  if (Math.abs(n) >= 100) {
    return n.toFixed(1).replace(/\.0+$/, "");
  }

  if (Math.abs(n) >= 10) {
    return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  return n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}


function obtenerUnidadSeleccionada() {

  const seleccionado = document.querySelector(
    'input[name="dose-unit"]:checked'
  );

  if (!seleccionado) {
    return "g";
  }

  return normalizarUnidad(seleccionado.value);
}


function establecerUnidad(unidad) {

  const unidadNormalizada = normalizarUnidad(unidad);

  doseUnitRadios.forEach(radio => {

    radio.checked =
      normalizarUnidad(radio.value) === unidadNormalizada;

  });
}


// ------------------------------------------------------------
// PLAGAS
// ------------------------------------------------------------

function obtenerPlagasFormulario() {

  return [
    recipePlaga1?.value?.trim() || "",
    recipePlaga2?.value?.trim() || "",
    recipePlaga3?.value?.trim() || "",
    recipePlaga4?.value?.trim() || ""
  ].filter(Boolean);
}


function cargarPlagasFormulario(plagas) {

  const lista = normalizarArray(plagas);

  if (recipePlaga1) {
    recipePlaga1.value = lista[0] || "";
  }

  if (recipePlaga2) {
    recipePlaga2.value = lista[1] || "";
  }

  if (recipePlaga3) {
    recipePlaga3.value = lista[2] || "";
  }

  if (recipePlaga4) {
    recipePlaga4.value = lista[3] || "";
  }
}


// ------------------------------------------------------------
// FUNCIONES
// ------------------------------------------------------------

function obtenerFuncionesFormulario() {

  return Array.from(functionCheckboxes)
    .filter(check => check.checked)
    .map(check => check.value);
}


function cargarFuncionesFormulario(funciones) {

  const lista = normalizarArray(funciones)
    .map(normalizarTexto);

  functionCheckboxes.forEach(check => {

    check.checked = lista.includes(
      normalizarTexto(check.value)
    );

  });
}


// ------------------------------------------------------------
// MODO DE ACCIÓN
// ------------------------------------------------------------

function obtenerModoAccionFormulario() {

  const seleccionado = document.querySelector(
    'input[name="modo_accion"]:checked'
  );

  return seleccionado
    ? seleccionado.value
    : "";
}


function cargarModoAccionFormulario(modo) {

  const lista = normalizarArray(modo)
    .map(normalizarTexto);

  modoAccionRadios.forEach(radio => {

    radio.checked = lista.includes(
      normalizarTexto(radio.value)
    );

  });
}


// ------------------------------------------------------------
// DOSIS
// ------------------------------------------------------------

function obtenerDosisActual() {

  const low = parseNumero(recipeDoseLow?.value);
  const high = parseNumero(recipeDoseHigh?.value);

  return {
    low,
    high,
    unit: obtenerUnidadSeleccionada(),
    waterBase: 100
  };
}


function calcularDosisParaLitros(dosisBase, litros) {

  if (
    dosisBase === null ||
    !Number.isFinite(Number(dosisBase))
  ) {
    return null;
  }

  return Number(dosisBase) * (Number(litros) / 100);
}


function calcularTablaDosis(low, high, unit) {

  const litros = [1, 15, 100, 160];

  const tabla = {};

  litros.forEach(litrosCantidad => {

    tabla[litrosCantidad] = {

      baja: calcularDosisParaLitros(
        low,
        litrosCantidad
      ),

      alta: calcularDosisParaLitros(
        high,
        litrosCantidad
      ),

      unidad: unit
    };

  });

  return tabla;
}


function actualizarTablaDosis() {

  if (!recipeDoseLow || !recipeDoseHigh) {
    return null;
  }

  const low = parseNumero(recipeDoseLow.value);
  const high = parseNumero(recipeDoseHigh.value);
  const unit = obtenerUnidadSeleccionada();

  // Sin dosis
  if (low === null && high === null) {

    if (doseTableWrapper) {
      doseTableWrapper.style.display = "none";
    }

    if (doseConfirmBox) {
      doseConfirmBox.style.display = "none";
    }

    if (doseValidationMessage) {
      doseValidationMessage.textContent = "";
    }

    return null;
  }


  // Falta una dosis
  if (low === null || high === null) {

    if (doseTableWrapper) {
      doseTableWrapper.style.display = "none";
    }

    if (doseValidationMessage) {

      doseValidationMessage.textContent =
        "Debes ingresar dosis mínima y dosis máxima.";

      doseValidationMessage.style.color = "#b42318";
    }

    dosisConfirmada = false;

    return null;
  }


  // Valores negativos o cero
  if (low < 0 || high < 0) {

    if (doseValidationMessage) {

      doseValidationMessage.textContent =
        "Las dosis no pueden ser negativas.";

      doseValidationMessage.style.color = "#b42318";
    }

    dosisConfirmada = false;

    return null;
  }


  // Máxima menor que mínima
  if (high < low) {

    if (doseTableWrapper) {
      doseTableWrapper.style.display = "none";
    }

    if (doseValidationMessage) {

      doseValidationMessage.textContent =
        "La dosis máxima no puede ser menor que la dosis mínima.";

      doseValidationMessage.style.color = "#b42318";
    }

    dosisConfirmada = false;

    return null;
  }


  const tabla = calcularTablaDosis(
    low,
    high,
    unit
  );


  // Mostrar tabla
  if (doseTableWrapper) {
    doseTableWrapper.style.display = "block";
  }


  Object.keys(tabla).forEach(litros => {

    const celda = doseCells[litros];

    if (!celda) {
      return;
    }

    if (celda.low) {

      celda.low.textContent =
        `${formatearNumero(tabla[litros].baja)} ${unit}`;
    }

    if (celda.high) {

      celda.high.textContent =
        `${formatearNumero(tabla[litros].alta)} ${unit}`;
    }

  });


  if (doseValidationMessage) {

    doseValidationMessage.textContent =
      "Dosis calculadas correctamente.";

    doseValidationMessage.style.color = "#18794e";
  }


  // Confirmación
  if (!dosisConfirmada && doseConfirmBox) {

    doseConfirmBox.style.display = "block";

    if (doseConfirmationSummary) {

      doseConfirmationSummary.textContent =
        `Has ingresado ${formatearNumero(low)}–${formatearNumero(high)} ${unit} por 100 L. Revisa la tabla antes de confirmar.`;

    }

  }


  if (dosisConfirmada && doseConfirmStatus) {

    doseConfirmStatus.textContent =
      "✓ Dosis confirmada.";

    doseConfirmStatus.style.color = "#18794e";
  }


  return tabla;
}


function obtenerDosisGuardada(item) {

  let low = parseNumero(item?.dosis_baja);
  let high = parseNumero(item?.dosis_alta);

  let unit =
    item?.unidad_dosis ||
    item?.dosis_unidad ||
    "g";


  // Nuevo formato
  if (low !== null && high !== null) {

    return {
      low,
      high,
      unit: normalizarUnidad(unit)
    };

  }


  // Si dosis viene como objeto
  if (
    item?.dosis &&
    typeof item.dosis === "object"
  ) {

    low =
      parseNumero(
        item.dosis.baja ??
        item.dosis.low ??
        item.dosis.minima
      );

    high =
      parseNumero(
        item.dosis.alta ??
        item.dosis.high ??
        item.dosis.maxima
      );

    unit =
      item.dosis.unidad ??
      item.dosis.unit ??
      unit;

    if (low !== null && high !== null) {

      return {
        low,
        high,
        unit: normalizarUnidad(unit)
      };

    }
  }


  // Dosis antigua como número
  if (
    typeof item?.dosis === "number"
  ) {

    return {
      low: item.dosis,
      high: item.dosis,
      unit: normalizarUnidad(unit)
    };

  }


  // Intento de interpretar texto antiguo
  if (
    typeof item?.dosis === "string" &&
    item.dosis.trim()
  ) {

    const texto = item.dosis;

    const coincidencia = texto.match(
      /([\d.,]+)\s*(?:-|–|—|a)\s*([\d.,]+)\s*(g|gr|cc|ml|mL)?/i
    );

    if (coincidencia) {

      const valorLow = parseNumero(
        coincidencia[1]
      );

      const valorHigh = parseNumero(
        coincidencia[2]
      );

      const valorUnit =
        coincidencia[3] ||
        unit;

      if (
        valorLow !== null &&
        valorHigh !== null
      ) {

        return {
          low: valorLow,
          high: valorHigh,
          unit: normalizarUnidad(valorUnit)
        };

      }
    }
  }


  return {
    low: null,
    high: null,
    unit: normalizarUnidad(unit)
  };
}


function generarTextoDosis(low, high, unit) {

  if (low === null || high === null) {
    return "";
  }

  return (
    `${formatearNumero(low)}–${formatearNumero(high)} ${unit}/100 L`
  );
}


function generarTextoTablaDosis(low, high, unit) {

  if (low === null || high === null) {
    return "";
  }

  const tabla = calcularTablaDosis(
    low,
    high,
    unit
  );

  return [
    `1 L: ${formatearNumero(tabla[1].baja)}–${formatearNumero(tabla[1].alta)} ${unit}`,
    `15 L: ${formatearNumero(tabla[15].baja)}–${formatearNumero(tabla[15].alta)} ${unit}`,
    `100 L: ${formatearNumero(tabla[100].baja)}–${formatearNumero(tabla[100].alta)} ${unit}`,
    `160 L: ${formatearNumero(tabla[160].baja)}–${formatearNumero(tabla[160].alta)} ${unit}`
  ].join(" | ");
}


function validarDosisFormulario() {

  const low = parseNumero(recipeDoseLow?.value);
  const high = parseNumero(recipeDoseHigh?.value);

  // No se ingresó dosis
  if (low === null && high === null) {

    return {
      existe: false,
      valida: true,
      low: null,
      high: null,
      unit: obtenerUnidadSeleccionada(),
      tabla: null
    };

  }


  if (low === null || high === null) {

    return {
      existe: true,
      valida: false,
      mensaje:
        "Debes completar la dosis mínima y máxima."
    };

  }


  if (low < 0 || high < 0) {

    return {
      existe: true,
      valida: false,
      mensaje:
        "Las dosis no pueden ser negativas."
    };

  }


  if (high < low) {

    return {
      existe: true,
      valida: false,
      mensaje:
        "La dosis máxima no puede ser menor que la mínima."
    };

  }


  if (!dosisConfirmada) {

    return {
      existe: true,
      valida: false,
      mensaje:
        "Debes revisar y confirmar la tabla de dosis antes de guardar."
    };

  }


  const unit = obtenerUnidadSeleccionada();

  return {
    existe: true,
    valida: true,
    low,
    high,
    unit,
    tabla: calcularTablaDosis(
      low,
      high,
      unit
    )
  };
}


// ------------------------------------------------------------
// CAMBIO DE CAMPOS SEGÚN TIPO
// ------------------------------------------------------------

function alternarCamposFormulario(tipo) {

  const tipoNormalizado =
    normalizarTipoRegistro(tipo);


  document
    .querySelectorAll(".bio-only")
    .forEach(element => {

      element.style.display =
        tipoNormalizado === "bio"
          ? ""
          : "none";

    });


  document
    .querySelectorAll(".chem-only")
    .forEach(element => {

      element.style.display =
        tipoNormalizado === "quimico"
          ? ""
          : "none";

    });


  if (aiScannerBox) {

    aiScannerBox.style.display =
      tipoNormalizado === "quimico"
        ? ""
        : aiScannerBox.style.display;

  }
}


// ------------------------------------------------------------
// MUNDO
// ------------------------------------------------------------

function cambiarMundo(mundo) {

  mundoActual =
    normalizarTipoRegistro(mundo);


  if (btnWorldBio) {

    btnWorldBio.classList.toggle(
      "active",
      mundoActual === "bio"
    );

  }


  if (btnWorldQui) {

    btnWorldQui.classList.toggle(
      "active",
      mundoActual === "quimico"
    );

  }


  if (statsTitle) {

    statsTitle.textContent =
      mundoActual === "bio"
        ? "Productos biológicos"
        : "Productos químicos";

  }


  if (resultsTitle) {

    resultsTitle.textContent =
      mundoActual === "bio"
        ? "Productos biológicos"
        : "Productos químicos";

  }


  if (tipoRegistroSelect) {

    tipoRegistroSelect.value =
      mundoActual;

  }


  alternarCamposFormulario(
    mundoActual
  );

  calcularMetricasYRender();
}


// ------------------------------------------------------------
// BÚSQUEDA
// ------------------------------------------------------------

function establecerBusqueda(valor) {

  textoBusquedaActual =
    normalizarTexto(valor);

  calcularMetricasYRender();
}


// ------------------------------------------------------------
// FILTROS DE FUNCIÓN
// ------------------------------------------------------------

function establecerFiltroFuncion(funcion) {

  filtroFuncionActual =
    normalizarTexto(funcion || "todos");

  document
    .querySelectorAll(".btn-filter")
    .forEach(button => {

      const filtro =
        normalizarTexto(
          button.dataset.funcion || "todos"
        );

      button.classList.toggle(
        "active",
        filtro === filtroFuncionActual
      );

    });

  calcularMetricasYRender();
}


// ------------------------------------------------------------
// FILTRADO DE DATOS
// ------------------------------------------------------------

function obtenerDatosFiltrados() {

  let datos = todosLosDatos.filter(item => {

    return (
      normalizarTipoRegistro(
        item.tipo_registro
      ) === mundoActual
    );

  });


  // FILTRO FUNCIÓN
  if (
    filtroFuncionActual &&
    filtroFuncionActual !== "todos"
  ) {

    datos = datos.filter(item => {

      const funciones =
        normalizarArray(item.funcion)
          .map(normalizarTexto);

      return funciones.includes(
        filtroFuncionActual
      );

    });

  }


  // BÚSQUEDA
  if (textoBusquedaActual) {

    datos = datos.filter(item => {

      const funciones =
        normalizarArray(item.funcion)
          .join(" ");

      const plagas =
        normalizarArray(item.plagas_objetivo)
          .join(" ");

      const textoCompleto = [

        item.nombre,
        item.fabricante,
        item.registro,
        item.formulacion,
        item.ingrediente_activo,
        item.grupo_quimico,
        item.concentracion,
        item.modo_accion,
        item.efectividad,
        item.contraindicaciones,
        item.contraindicacion,
        item.ingredientes,
        item.preparacion,
        item.carencia,
        item.reentrada,
        funciones,
        plagas

      ]
        .filter(Boolean)
        .join(" ");


      return normalizarTexto(
        textoCompleto
      ).includes(
        textoBusquedaActual
      );

    });

  }


  return datos;
}


// ------------------------------------------------------------
// MÉTRICAS
// ------------------------------------------------------------

function calcularMetricasYRender() {

  const datosMundo =
    todosLosDatos.filter(item => {

      return (
        normalizarTipoRegistro(
          item.tipo_registro
        ) === mundoActual
      );

    });


  const datosFiltrados =
    obtenerDatosFiltrados();


  // TOTAL
  if (statTotal) {

    statTotal.textContent =
      datosMundo.length;

  }


  // MÉTRICA CONDICIONAL
  let cantidadCondicional = 0;
  let etiquetaCondicional = "";


  if (mundoActual === "bio") {

    etiquetaCondicional =
      "Alta efectividad";

    cantidadCondicional =
      datosMundo.filter(item => {

        const efectividad =
          normalizarTexto(
            item.efectividad
          );

        return (
          efectividad.includes("alta") ||
          efectividad.includes("muy alta")
        );

      }).length;

  } else {

    etiquetaCondicional =
      "Acción sistémica";

    cantidadCondicional =
      datosMundo.filter(item => {

        const modos =
          normalizarArray(
            item.modo_accion
          )
            .map(normalizarTexto);

        return modos.includes("sistemico");

      }).length;

  }


  if (statConditionalCard) {

    statConditionalCard.innerHTML =
      `${escapeHTML(etiquetaCondicional)}
       <span id="stat-alta">${cantidadCondicional}</span>`;

  }


  if (statAlta) {

    statAlta.textContent =
      cantidadCondicional;

  }


  renderizarRecetas(
    datosFiltrados
  );
}


// ------------------------------------------------------------
// FORMATEAR LISTAS
// ------------------------------------------------------------

function renderizarLista(items) {

  const lista =
    normalizarArray(items);

  if (!lista.length) {
    return "No especificado";
  }

  return lista
    .map(item => escapeHTML(item))
    .join(", ");
}


// ------------------------------------------------------------
// DOSIS EN TARJETA
// ------------------------------------------------------------

function renderizarDosis(item) {

  const dosis =
    obtenerDosisGuardada(item);


  if (
    dosis.low === null ||
    dosis.high === null
  ) {

    // Compatibilidad con registros antiguos
    if (
      item.modo_aplicacion &&
      String(item.modo_aplicacion).trim()
    ) {

      return `
        <div class="recipe-dose">
          <strong>Dosis:</strong>
          ${escapeHTML(item.modo_aplicacion)}
        </div>
      `;

    }


    if (
      item.dosis &&
      typeof item.dosis === "string"
    ) {

      return `
        <div class="recipe-dose">
          <strong>Dosis:</strong>
          ${escapeHTML(item.dosis)}
        </div>
      `;

    }


    return "";
  }


  const tabla =
    calcularTablaDosis(
      dosis.low,
      dosis.high,
      dosis.unit
    );


  return `
    <div class="recipe-dose">

      <div>
        <strong>Dosis por 100 L:</strong>
        ${escapeHTML(
          generarDosisTexto(
            dosis.low,
            dosis.high,
            dosis.unit
          )
        )}
      </div>

      <div class="dose-mini-table">

        <div>
          <strong>1 L:</strong>
          ${formatearNumero(tabla[1].baja)}
          –
          ${formatearNumero(tabla[1].alta)}
          ${escapeHTML(dosis.unit)}
        </div>

        <div>
          <strong>15 L:</strong>
          ${formatearNumero(tabla[15].baja)}
          –
          ${formatearNumero(tabla[15].alta)}
          ${escapeHTML(dosis.unit)}
        </div>

        <div>
          <strong>100 L:</strong>
          ${formatearNumero(tabla[100].baja)}
          –
          ${formatearNumero(tabla[100].alta)}
          ${escapeHTML(dosis.unit)}
        </div>

        <div>
          <strong>160 L:</strong>
          ${formatearNumero(tabla[160].baja)}
          –
          ${formatearNumero(tabla[160].alta)}
          ${escapeHTML(dosis.unit)}
        </div>

      </div>

    </div>
  `;
}


// Alias para evitar problemas de compatibilidad
function generarDosisTexto(low, high, unit) {

  return generarTextoDosis(
    low,
    high,
    unit
  );
}


// ------------------------------------------------------------
// TARJETAS
// ------------------------------------------------------------

function renderizarRecetas(datos) {

  if (!recipesContainer) {
    return;
  }


  if (!datos.length) {

    recipesContainer.innerHTML = `
      <div class="no-results">
        <h3>No se encontraron productos</h3>
        <p>
          No hay productos que coincidan con los
          filtros o búsqueda actual.
        </p>
      </div>
    `;

    return;
  }


  recipesContainer.innerHTML =
    datos.map(renderizarTarjeta).join("");


  // BOTONES DETALLES
  recipesContainer
    .querySelectorAll(".btn-toggle-details")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.id;

          const details =
            recipesContainer.querySelector(
              `.recipe-details[data-id="${CSS.escape(id)}"]`
            );

          if (!details) {
            return;
          }

          const visible =
            details.style.display === "block";

          details.style.display =
            visible
              ? "none"
              : "block";

          button.textContent =
            visible
              ? "Ver detalles"
              : "Ocultar detalles";

        }
      );

    });


  // EDITAR
  recipesContainer
    .querySelectorAll(".btn-edit-recipe")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.id;

          const item =
            todosLosDatos.find(
              dato => dato.id === id
            );

          if (item) {
            cargarItemEnFormulario(item);
          }

        }
      );

    });


  // ELIMINAR
  recipesContainer
    .querySelectorAll(".btn-delete-recipe")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id =
            button.dataset.id;

          const item =
            todosLosDatos.find(
              dato => dato.id === id
            );

          if (!item) {
            return;
          }


          const confirmar =
            confirm(
              `¿Eliminar el producto "${item.nombre || "sin nombre"}"?`
            );


          if (!confirmar) {
            return;
          }


          if (!esAdmin) {

            alert(
              "Debes iniciar sesión como administrador."
            );

            return;
          }


          try {

            await deleteDoc(
              doc(db, "recetas", id)
            );

            alert(
              "Producto eliminado correctamente."
            );

          } catch (error) {

            console.error(
              "Error eliminando producto:",
              error
            );

            alert(
              "No se pudo eliminar el producto:\n" +
              obtenerMensajeFirebase(error)
            );

          }

        }
      );

    });

}


// ------------------------------------------------------------
// TARJETA INDIVIDUAL
// ------------------------------------------------------------

function renderizarTarjeta(item) {

  const tipo =
    normalizarTipoRegistro(
      item.tipo_registro
    );


  const funciones =
    normalizarArray(item.funcion);

  const plagas =
    normalizarArray(item.plagas_objetivo);


  const nombre =
    item.nombre ||
    "Producto sin nombre";


  const fabricante =
    item.fabricante ||
    "";


  const ingredientes =
    item.ingredientes ||
    item.ingrediente_activo ||
    "";


  const detalleId =
    `details-${item.id}`;


  const funcionesHTML =
    funciones.length
      ? funciones
          .map(
            funcion => `
              <span class="badge">
                ${escapeHTML(funcion)}
              </span>
            `
          )
          .join("")
      : "<span>No especificado</span>";


  let contenidoBio = "";


  if (tipo === "bio") {

    contenidoBio = `

      ${
        item.efectividad
          ? `
            <div>
              <strong>Efectividad:</strong>
              ${escapeHTML(item.efectividad)}
            </div>
          `
          : ""
      }

      ${
        ingredientes
          ? `
            <div>
              <strong>Ingredientes:</strong>
              ${escapeHTML(ingredientes)}
            </div>
          `
          : ""
      }

      ${
        item.preparacion
          ? `
            <div>
              <strong>Preparación:</strong>
              ${escapeHTML(item.preparacion)}
            </div>
          `
          : ""
      }

      ${
        item.contraindicacion ||
        item.contraindicaciones
          ? `
            <div>
              <strong>Contraindicaciones:</strong>
              ${escapeHTML(
                item.contraindicacion ||
                item.contraindicaciones
              )}
            </div>
          `
          : ""
      }

    `;

  } else {

    contenidoBio = `

      ${
        item.ingrediente_activo
          ? `
            <div>
              <strong>Ingrediente activo:</strong>
              ${escapeHTML(item.ingrediente_activo)}
            </div>
          `
          : ""
      }

      ${
        item.concentracion
          ? `
            <div>
              <strong>Concentración:</strong>
              ${escapeHTML(item.concentracion)}
            </div>
          `
          : ""
      }

      ${
        item.grupo_quimico
          ? `
            <div>
              <strong>Grupo químico:</strong>
              ${escapeHTML(item.grupo_quimico)}
            </div>
          `
          : ""
      }

      ${
        item.modo_accion
          ? `
            <div>
              <strong>Modo de acción:</strong>
              ${renderizarLista(item.modo_accion)}
            </div>
          `
          : ""
      }

      ${
        item.carencia
          ? `
            <div>
              <strong>Carencia:</strong>
              ${escapeHTML(item.carencia)}
            </div>
          `
          : ""
      }

      ${
        item.reentrada
          ? `
            <div>
              <strong>Reentrada:</strong>
              ${escapeHTML(item.reentrada)}
            </div>
          `
          : ""
      }

    `;
  }


  const plagasHTML =
    plagas.length
      ? plagas
          .map(
            plaga => `
              <span class="badge badge-plaga">
                ${escapeHTML(plaga)}
              </span>
            `
          )
          .join("")
      : "<span>No especificadas</span>";


  const adminButtons =
    esAdmin
      ? `
        <div class="recipe-admin-actions">

          <button
            type="button"
            class="btn-edit-recipe"
            data-id="${escapeHTML(item.id)}"
          >
            Editar
          </button>

          <button
            type="button"
            class="btn-delete-recipe"
            data-id="${escapeHTML(item.id)}"
          >
            Eliminar
          </button>

        </div>
      `
      : "";


  return `

    <article
      class="recipe-card"
      data-id="${escapeHTML(item.id)}"
    >

      <div class="recipe-header">

        <div>

          <div class="recipe-type">
            ${tipo === "bio" ? "BIO" : "QUÍMICO"}
          </div>

          <h3 class="recipe-title">
            ${escapeHTML(nombre)}
          </h3>

          ${
            fabricante
              ? `
                <div class="recipe-manufacturer">
                  ${escapeHTML(fabricante)}
                </div>
              `
              : ""
          }

        </div>

      </div>


      <div class="recipe-functions">

        <strong>Función:</strong>

        <div class="badges">
          ${funcionesHTML}
        </div>

      </div>


      <div class="recipe-pests">

        <strong>Plagas objetivo:</strong>

        <div class="badges">
          ${plagasHTML}
        </div>

      </div>


      ${renderizarDosis(item)}


      <div
        class="recipe-details"
        data-id="${escapeHTML(item.id)}"
        style="display:none;"
      >

        <div class="recipe-detail-grid">

          ${
            item.registro
              ? `
                <div>
                  <strong>Registro:</strong>
                  ${escapeHTML(item.registro)}
                </div>
              `
              : ""
          }

          ${
            item.formulacion
              ? `
                <div>
                  <strong>Formulación:</strong>
                  ${escapeHTML(item.formulacion)}
                </div>
              `
              : ""
          }

          ${contenidoBio}

        </div>

      </div>


      <div class="recipe-actions">

        <button
          type="button"
          class="btn-toggle-details"
          data-id="${escapeHTML(item.id)}"
        >
          Ver detalles
        </button>

        ${adminButtons}

      </div>

    </article>

  `;
}


// ------------------------------------------------------------
// CARGAR PRODUCTO EN FORMULARIO
// ------------------------------------------------------------

function cargarItemEnFormulario(item) {

  if (!esAdmin) {

    alert(
      "Debes iniciar sesión como administrador."
    );

    return;
  }


  if (!recipeForm) {
    return;
  }


  recipeId.value =
    item.id || "";


  const tipo =
    normalizarTipoRegistro(
      item.tipo_registro
    );


  mundoActual = tipo;


  if (tipoRegistroSelect) {
    tipoRegistroSelect.value = tipo;
  }


  if (recipeName) {
    recipeName.value =
      item.nombre || "";
  }


  cargarFuncionesFormulario(
    item.funcion
  );


  cargarPlagasFormulario(
    item.plagas_objetivo
  );


  // BIO
  if (recipeEfectividad) {

    recipeEfectividad.value =
      item.efectividad || "";

  }


  if (recipeContra) {

    recipeContra.value =
      item.contraindicacion ||
      item.contraindicaciones ||
      "";

  }


  if (recipeIngredients) {

    recipeIngredients.value =
      item.ingredientes ||
      item.ingrediente_activo ||
      "";

  }


  if (recipePrep) {

    recipePrep.value =
      item.preparacion || "";

  }


  // QUÍMICOS
  if (recipeActivo) {

    recipeActivo.value =
      item.ingrediente_activo || "";

  }


  if (recipeConcentracion) {

    recipeConcentracion.value =
      item.concentracion || "";

  }


  if (recipeCarencia) {

    recipeCarencia.value =
      item.carencia || "";

  }


  if (recipeReentrada) {

    recipeReentrada.value =
      item.reentrada || "";

  }


  cargarModoAccionFormulario(
    item.modo_accion
  );


  // DOSIS
  const dosis =
    obtenerDosisGuardada(item);


  if (recipeDoseWater) {
    recipeDoseWater.value = 100;
  }


  if (recipeDoseLow) {

    recipeDoseLow.value =
      dosis.low !== null
        ? dosis.low
        : "";

  }


  if (recipeDoseHigh) {

    recipeDoseHigh.value =
      dosis.high !== null
        ? dosis.high
        : "";

  }


  establecerUnidad(
    dosis.unit
  );


  if (recipeApp) {

    recipeApp.value =
      item.modo_aplicacion || "";

  }


  if (
    dosis.low !== null &&
    dosis.high !== null
  ) {

    dosisConfirmada =
      item.dosis_confirmada !== false;

    actualizarTablaDosis();


    if (doseConfirmBox) {

      doseConfirmBox.style.display =
        dosisConfirmada
          ? "none"
          : "block";

    }


    if (doseConfirmStatus) {

      doseConfirmStatus.textContent =
        dosisConfirmada
          ? "✓ Dosis cargada y confirmada."
          : "";

      doseConfirmStatus.style.color =
        "#18794e";

    }

  } else {

    dosisConfirmada = false;

    if (doseTableWrapper) {
      doseTableWrapper.style.display = "none";
    }

    if (doseConfirmBox) {
      doseConfirmBox.style.display = "none";
    }

    if (doseConfirmStatus) {
      doseConfirmStatus.textContent = "";
    }

  }


  alternarCamposFormulario(
    tipo
  );


  if (formTitle) {

    formTitle.textContent =
      "Editar producto";

  }


  if (btnFormSubmit) {

    btnFormSubmit.textContent =
      "Actualizar producto";

  }


  // Llevar al formulario
  if (sectionFormContainer) {

    sectionFormContainer.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


// ------------------------------------------------------------
// LIMPIAR FORMULARIO
// ------------------------------------------------------------

function limpiarFormulario() {

  if (!recipeForm) {
    return;
  }


  recipeForm.reset();


  if (recipeId) {
    recipeId.value = "";
  }


  if (recipeDoseWater) {
    recipeDoseWater.value = 100;
  }


  dosisConfirmada = false;


  if (doseTableWrapper) {
    doseTableWrapper.style.display = "none";
  }


  if (doseConfirmBox) {
    doseConfirmBox.style.display = "none";
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


  if (formTitle) {
    formTitle.textContent = "Agregar producto";
  }


  if (btnFormSubmit) {
    btnFormSubmit.textContent = "Guardar producto";
  }


  // Valores por defecto
  if (tipoRegistroSelect) {
    tipoRegistroSelect.value = mundoActual;
  }


  establecerUnidad("g");


  alternarCamposFormulario(
    mundoActual
  );

}


// ------------------------------------------------------------
// CONSTRUIR DATOS DEL FORMULARIO
// ------------------------------------------------------------

function obtenerDatosFormulario() {

  const tipo =
    normalizarTipoRegistro(
      tipoRegistroSelect?.value ||
      mundoActual
    );


  const funciones =
    obtenerFuncionesFormulario();


  const plagas =
    obtenerPlagasFormulario();


  const dosis =
    validarDosisFormulario();


  if (!recipeName?.value?.trim()) {

    return {
      error:
        "Debes ingresar el nombre del producto."
    };

  }


  if (!funciones.length) {

    return {
      error:
        "Debes seleccionar al menos una función."
    };

  }


  if (!dosis.valida) {

    return {
      error:
        dosis.mensaje ||
        "La dosis no es válida."
    };

  }


  const nombre =
    recipeName.value.trim();


  const datos = {

    tipo_registro: tipo,

    nombre,

    funcion: funciones,

    plagas_objetivo: plagas,

    ingrediente_activo:
      recipeActivo?.value?.trim() ||
      "",

    concentracion:
      recipeConcentracion?.value?.trim() ||
      "",

    modo_accion:
      obtenerModoAccionFormulario(),

    carencia:
      recipeCarencia?.value?.trim() ||
      "",

    reentrada:
      recipeReentrada?.value?.trim() ||
      "",

    efectividad:
      recipeEfectividad?.value?.trim() ||
      "",

    contraindicacion:
      recipeContra?.value?.trim() ||
      "",

    ingredientes:
      recipeIngredients?.value?.trim() ||
      "",

    preparacion:
      recipePrep?.value?.trim() ||
      "",

    actualizado_el:
      new Date().toISOString(),

    actualizado_por:
      auth.currentUser?.email ||
      ""

  };


  // DOSIS
  if (dosis.existe) {

    datos.dosis_baja =
      dosis.low;

    datos.dosis_alta =
      dosis.high;

    datos.unidad_dosis =
      dosis.unit;

    datos.dosis_agua_base =
      100;

    datos.dosis_calculada =
      dosis.tabla;

    datos.dosis_confirmada =
      true;

    datos.dosis =
      `${formatearNumero(dosis.low)}–${formatearNumero(dosis.high)} ${dosis.unit}/100 L`;

    datos.modo_aplicacion =
      generarTextoTablaDosis(
        dosis.low,
        dosis.high,
        dosis.unit
      );

  } else {

    datos.dosis_baja = null;
    datos.dosis_alta = null;
    datos.unidad_dosis = "";
    datos.dosis_agua_base = 100;
    datos.dosis_calculada = {};
    datos.dosis_confirmada = false;
    datos.dosis = "";
    datos.modo_aplicacion = "";

  }


  return {
    datos
  };
}


// ------------------------------------------------------------
// GUARDAR FORMULARIO
// ------------------------------------------------------------

if (recipeForm) {

  recipeForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!esAdmin || !auth.currentUser) {

        alert(
          "Acceso denegado.\n\nDebes iniciar sesión como administrador."
        );

        return;
      }


      const resultado =
        obtenerDatosFormulario();


      if (resultado.error) {

        alert(
          resultado.error
        );

        return;
      }


      const datos =
        resultado.datos;


      const id =
        recipeId?.value?.trim() ||
        "";


      if (btnFormSubmit) {

        btnFormSubmit.disabled = true;

        btnFormSubmit.textContent =
          id
            ? "Actualizando..."
            : "Guardando...";

      }


      try {

        if (id) {

          await updateDoc(
            doc(db, "recetas", id),
            datos
          );

          alert(
            "Producto actualizado correctamente."
          );

        } else {

          datos.creado_el =
            new Date().toISOString();

          datos.creado_por =
            auth.currentUser.email || "";


          await addDoc(
            recetasRef,
            datos
          );

          alert(
            "Producto guardado correctamente."
          );

        }


        limpiarFormulario();


      } catch (error) {

        console.error(
          "Error guardando producto:",
          error
        );


        alert(
          "No se pudo guardar el producto.\n\n" +
          obtenerMensajeFirebase(error)
        );


      } finally {

        if (btnFormSubmit) {

          btnFormSubmit.disabled = false;

          btnFormSubmit.textContent =
            id
              ? "Actualizar producto"
              : "Guardar producto";

        }

      }

    }
  );

}


// ------------------------------------------------------------
// CANCELAR FORMULARIO
// ------------------------------------------------------------

if (btnFormCancel) {

  btnFormCancel.addEventListener(
    "click",
    event => {

      event.preventDefault();

      limpiarFormulario();

    }
  );

}


// ------------------------------------------------------------
// DOSIS - EVENTOS
// ------------------------------------------------------------

if (recipeDoseLow) {

  recipeDoseLow.addEventListener(
    "input",
    () => {

      dosisConfirmada = false;

      if (doseConfirmStatus) {
        doseConfirmStatus.textContent = "";
      }

      actualizarTablaDosis();

    }
  );

}


if (recipeDoseHigh) {

  recipeDoseHigh.addEventListener(
    "input",
    () => {

      dosisConfirmada = false;

      if (doseConfirmStatus) {
        doseConfirmStatus.textContent = "";
      }

      actualizarTablaDosis();

    }
  );

}


doseUnitRadios.forEach(radio => {

  radio.addEventListener(
    "change",
    () => {

      dosisConfirmada = false;

      if (doseConfirmStatus) {
        doseConfirmStatus.textContent = "";
      }

      actualizarTablaDosis();

    }
  );

});


// CONFIRMAR DOSIS
if (btnConfirmDoses) {

  btnConfirmDoses.addEventListener(
    "click",
    event => {

      event.preventDefault();


      const resultado =
        validarDosisFormulario();


      if (!resultado.existe) {

        alert(
          "Primero debes ingresar una dosis."
        );

        return;
      }


      if (!resultado.valida) {

        alert(
          resultado.mensaje
        );

        return;
      }


      dosisConfirmada = true;


      if (doseConfirmBox) {
        doseConfirmBox.style.display = "none";
      }


      if (doseConfirmStatus) {

        doseConfirmStatus.textContent =
          "✓ Dosis confirmada correctamente.";

        doseConfirmStatus.style.color =
          "#18794e";

      }

    }
  );

}


// CANCELAR CONFIRMACIÓN
if (btnCancelDoses) {

  btnCancelDoses.addEventListener(
    "click",
    event => {

      event.preventDefault();

      dosisConfirmada = false;


      if (doseConfirmBox) {
        doseConfirmBox.style.display = "none";
      }


      if (doseConfirmStatus) {

        doseConfirmStatus.textContent =
          "Dosis pendiente de confirmación.";

        doseConfirmStatus.style.color =
          "#b54708";

      }

    }
  );

}


// ------------------------------------------------------------
// TIPO DE REGISTRO
// ------------------------------------------------------------

if (tipoRegistroSelect) {

  tipoRegistroSelect.addEventListener(
    "change",
    () => {

      const tipo =
        normalizarTipoRegistro(
          tipoRegistroSelect.value
        );

      alternarCamposFormulario(
        tipo
      );

    }
  );

}


// ------------------------------------------------------------
// FILTROS
// ------------------------------------------------------------

document
  .querySelectorAll(".btn-filter")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        establecerFiltroFuncion(
          button.dataset.funcion ||
          "todos"
        );

      }
    );

  });


// ------------------------------------------------------------
// BÚSQUEDA
// ------------------------------------------------------------

if (searchInput) {

  searchInput.addEventListener(
    "input",
    event => {

      establecerBusqueda(
        event.target.value
      );

    }
  );

}


// ------------------------------------------------------------
// CAMBIO DE MUNDO
// ------------------------------------------------------------

if (btnWorldBio) {

  btnWorldBio.addEventListener(
    "click",
    () => cambiarMundo("bio")
  );

}


if (btnWorldQui) {

  btnWorldQui.addEventListener(
    "click",
    () => cambiarMundo("quimico")
  );

}


// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------

function abrirLogin() {

  if (!loginModal) {

    console.error(
      "No existe #login-modal en index.html"
    );

    return;
  }


  loginModal.style.display = "flex";
  loginModal.style.visibility = "visible";
  loginModal.style.opacity = "1";


  const emailInput =
    document.getElementById(
      "login-email"
    );


  if (emailInput) {

    setTimeout(
      () => emailInput.focus(),
      100
    );

  }

}


function cerrarLogin() {

  if (!loginModal) {
    return;
  }

  loginModal.style.display = "none";

}


if (btnOpenLogin) {

  btnOpenLogin.addEventListener(
    "click",
    event => {

      event.preventDefault();

      abrirLogin();

    }
  );

}


if (btnCloseLogin) {

  btnCloseLogin.addEventListener(
    "click",
    event => {

      event.preventDefault();

      cerrarLogin();

    }
  );

}


// Cerrar al hacer clic fuera
if (loginModal) {

  loginModal.addEventListener(
    "click",
    event => {

      if (
        event.target === loginModal
      ) {

        cerrarLogin();

      }

    }
  );

}


// ------------------------------------------------------------
// LOGIN SUBMIT
// ------------------------------------------------------------

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const emailInput =
        document.getElementById(
          "login-email"
        );

      const passwordInput =
        document.getElementById(
          "login-password"
        );


      const email =
        emailInput?.value?.trim() ||
        "";

      const password =
        passwordInput?.value ||
        "";


      if (!email || !password) {

        alert(
          "Ingresa correo y contraseña."
        );

        return;
      }


      const submitButton =
        loginForm.querySelector(
          'button[type="submit"]'
        );


      if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
          "Ingresando...";

      }


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        cerrarLogin();

        loginForm.reset();


        alert(
          "¡Bienvenido al modo administrador!"
        );


      } catch (error) {

        console.error(
          "Error de inicio de sesión:",
          error
        );


        alert(
          obtenerMensajeLogin(error)
        );


      } finally {

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.textContent =
            "Ingresar";

        }

      }

    }
  );

}


// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------

if (btnLogout) {

  btnLogout.addEventListener(
    "click",
    async event => {

      event.preventDefault();


      try {

        await signOut(auth);

        alert(
          "Sesión cerrada."
        );

      } catch (error) {

        console.error(
          "Error cerrando sesión:",
          error
        );

        alert(
          "No se pudo cerrar la sesión."
        );

      }

    }
  );

}


// ------------------------------------------------------------
// ESTADO DE AUTENTICACIÓN
// ------------------------------------------------------------

onAuthStateChanged(
  auth,
  user => {

    esAdmin = !!user;


    if (user) {

      // ADMIN CONECTADO

      if (btnOpenLogin) {

        btnOpenLogin.style.display =
          "none";

      }


      if (adminLoggedInfo) {

        adminLoggedInfo.style.display =
          "inline-block";

        // Mostrar correo si el elemento lo permite
        if (
          adminLoggedInfo.dataset.originalText ===
          undefined
        ) {

          adminLoggedInfo.dataset.originalText =
            adminLoggedInfo.textContent || "";

        }


        adminLoggedInfo.textContent =
          `Administrador: ${user.email || ""}`;

      }


      if (sectionFormContainer) {

        sectionFormContainer.style.display =
          "block";

      }


    } else {

      // NO ADMIN

      if (btnOpenLogin) {

        btnOpenLogin.style.display =
          "inline-block";

      }


      if (adminLoggedInfo) {

        adminLoggedInfo.style.display =
          "none";

      }


      if (sectionFormContainer) {

        sectionFormContainer.style.display =
          "none";

      }

    }


    // Volver a renderizar para mostrar/ocultar
    // botones Editar y Eliminar
    calcularMetricasYRender();

  }
);


// ------------------------------------------------------------
// MENSAJES FIREBASE
// ------------------------------------------------------------

function obtenerMensajeLogin(error) {

  const code =
    error?.code || "";


  switch (code) {

    case "auth/invalid-email":
      return "El correo electrónico no es válido.";

    case "auth/user-not-found":
      return "No existe un usuario con ese correo.";

    case "auth/wrong-password":
      return "La contraseña es incorrecta.";

    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";

    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e inténtalo nuevamente.";

    case "auth/network-request-failed":
      return "No hay conexión con Firebase. Revisa Internet.";

    case "auth/user-disabled":
      return "Esta cuenta de administrador está deshabilitada.";

    case "auth/operation-not-allowed":
      return "El método de acceso por correo y contraseña no está habilitado en Firebase Authentication.";

    default:
      return (
        "No se pudo iniciar sesión.\n\n" +
        (error?.message || "Error desconocido.")
      );

  }

}


function obtenerMensajeFirebase(error) {

  const code =
    error?.code || "";


  if (
    code ===
    "permission-denied"
  ) {

    return (
      "Firebase rechazó la operación por permisos. " +
      "Revisa las reglas de Firestore y que el usuario administrador esté autenticado."
    );

  }


  if (
    code ===
    "unavailable"
  ) {

    return (
      "Firebase no está disponible en este momento. Revisa la conexión a Internet."
    );

  }


  if (
    code ===
    "failed-precondition"
  ) {

    return (
      "Firebase indicó que falta una configuración o índice requerido."
    );

  }


  return (
    error?.message ||
    "Error desconocido de Firebase."
  );

}


// ------------------------------------------------------------
// FIRESTORE - CARGAR PRODUCTOS EN TIEMPO REAL
// ------------------------------------------------------------

onSnapshot(

  recetasRef,

  snapshot => {

    todosLosDatos = [];


    snapshot.forEach(
      documento => {

        todosLosDatos.push({

          id: documento.id,

          ...documento.data()

        });

      }
    );


    // Ordenar por nombre
    todosLosDatos.sort(
      (a, b) =>
        String(a.nombre || "")
          .localeCompare(
            String(b.nombre || ""),
            "es",
            {
              sensitivity: "base"
            }
          )
    );


    console.log(
      `Firestore: ${todosLosDatos.length} productos cargados.`
    );


    calcularMetricasYRender();

  },

  error => {

    console.error(
      "ERROR LEYENDO FIRESTORE:",
      error
    );


    todosLosDatos = [];


    if (recipesContainer) {

      recipesContainer.innerHTML = `

        <div
          class="firebase-error"
          style="
            padding:20px;
            border:1px solid #f1aeb5;
            background:#fff5f5;
            border-radius:10px;
            color:#842029;
            margin:15px 0;
          "
        >

          <h3>
            No se pudieron cargar los productos
          </h3>

          <p>
            Firebase rechazó o no pudo realizar
            la lectura de la colección
            <strong>recetas</strong>.
          </p>

          <p>
            Código:
            <strong>
              ${escapeHTML(error?.code || "desconocido")}
            </strong>
          </p>

          <p>
            ${escapeHTML(
              obtenerMensajeFirebase(error)
            )}
          </p>

          <p>
            Si el código es
            <strong>permission-denied</strong>,
            revisa las reglas de Firestore.
          </p>

        </div>

      `;

    }


    if (statTotal) {
      statTotal.textContent = "—";
    }

  }

);


// ------------------------------------------------------------
// INTELIGENCIA ARTIFICIAL
// ------------------------------------------------------------

async function ejecutarAnalisisIA() {

  if (!aiImageInput) {

    alert(
      "No se encontró el selector de imagen de IA."
    );

    return;
  }


  const file =
    aiImageInput.files?.[0];


  if (!file) {

    alert(
      "Selecciona primero una imagen de la etiqueta."
    );

    return;
  }


  if (!esAdmin) {

    alert(
      "Debes iniciar sesión como administrador para utilizar esta función."
    );

    return;
  }


  try {

    if (aiLoading) {
      aiLoading.style.display = "block";
    }


    if (btnTriggerAI) {
      btnTriggerAI.disabled = true;
    }


    const resultado =
      await analizarEtiqueta(file);


    console.log(
      "Resultado IA:",
      resultado
    );


    if (
      !resultado ||
      resultado.ok === false
    ) {

      throw new Error(
        resultado?.error ||
        "La IA no pudo analizar la etiqueta."
      );

    }


    const datos =
      resultado.datos ||
      resultado.data ||
      {};


    // --------------------------------------------------------
    // DATOS QUE SÍ COMPLETA LA IA
    // --------------------------------------------------------

    if (recipeName) {

      recipeName.value =
        datos.nombre ||
        datos.producto ||
        "";

    }


    if (recipeActivo) {

      recipeActivo.value =
        datos.ingrediente_activo ||
        datos.principio_activo ||
        "";

    }


    if (recipeConcentracion) {

      recipeConcentracion.value =
        datos.concentracion ||
        "";

    }


    // FUNCIONES
    if (datos.funcion) {

      cargarFuncionesFormulario(
        datos.funcion
      );

    }


    // MODO DE ACCIÓN
    if (datos.modo_accion) {

      cargarModoAccionFormulario(
        datos.modo_accion
      );

    }


    // Fabricante / registro pueden existir
    // aunque no tengan campos específicos
    // en el formulario actual.


    // --------------------------------------------------------
    // IMPORTANTE:
    // LA IA NO COMPLETA:
    //
    // - PLAGAS
    // - DOSIS
    // - UNIDAD
    // - CARENCIA
    // - REENTRADA
    //
    // ESOS DATOS SE INGRESAN MANUALMENTE.
    // --------------------------------------------------------


    cargarPlagasFormulario([]);


    if (recipeDoseLow) {
      recipeDoseLow.value = "";
    }


    if (recipeDoseHigh) {
      recipeDoseHigh.value = "";
    }


    establecerUnidad("g");


    dosisConfirmada = false;


    if (doseTableWrapper) {
      doseTableWrapper.style.display = "none";
    }


    if (doseConfirmBox) {
      doseConfirmBox.style.display = "none";
    }


    if (doseConfirmStatus) {
      doseConfirmStatus.textContent = "";
    }


    if (recipeCarencia) {
      recipeCarencia.value = "";
    }


    if (recipeReentrada) {
      recipeReentrada.value = "";
    }


    alert(
      "Análisis completado.\n\n" +
      "La IA completó los datos identificables de la etiqueta. " +
      "Debes revisar la información y completar manualmente plagas, dosis, carencia y reentrada."
    );


  } catch (error) {

    console.error(
      "Error analizando etiqueta:",
      error
    );


    alert(
      "No se pudo analizar la etiqueta.\n\n" +
      (error?.message ||
        "Error desconocido.")
    );


  } finally {

    if (aiLoading) {
      aiLoading.style.display = "none";
    }


    if (btnTriggerAI) {
      btnTriggerAI.disabled = false;
    }

  }

}


if (btnTriggerAI) {

  btnTriggerAI.addEventListener(
    "click",
    event => {

      event.preventDefault();

      ejecutarAnalisisIA();

    }
  );

}


// ------------------------------------------------------------
// INICIALIZACIÓN
// ------------------------------------------------------------

if (recipeDoseWater) {
  recipeDoseWater.value = 100;
}


alternarCamposFormulario(
  mundoActual
);


if (btnWorldBio) {
  btnWorldBio.classList.add("active");
}


if (sectionFormContainer) {

  // Mientras Firebase Authentication determina
  // si existe una sesión, ocultamos el formulario.
  sectionFormContainer.style.display =
    "none";

}


// Estado inicial de filtros
document
  .querySelectorAll(".btn-filter")
  .forEach(button => {

    const filtro =
      normalizarTexto(
        button.dataset.funcion ||
        "todos"
      );

    if (filtro === "todos") {

      button.classList.add(
        "active"
      );

    }

  });


console.log(
  "SANIDADAPP / BIO IA iniciado correctamente."
);
