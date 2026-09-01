// ======================================================
// SANIDADAPP
// app.js
// ======================================================

// ======================================================
// IMPORTS
// ======================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
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

import {
  analizarEtiqueta
} from "./ia.js";

import {
  firebaseConfig
} from "./config.js";


// ======================================================
// FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const recetasRef =
  collection(db, "recetas");


// ======================================================
// ESTADO
// ======================================================

let esAdmin = false;
let mundoActual = "bio";
let todosLosDatos = [];
let filtroFuncionActual = "todos";

let dosisConfirmada = false;


// ======================================================
// ELEMENTOS
// ======================================================

const btnWorldBio =
  document.getElementById("btn-world-bio");

const btnWorldQui =
  document.getElementById("btn-world-qui");

const statsTitle =
  document.getElementById("stats-title");

const resultsTitle =
  document.getElementById("results-title");

const statConditionalCard =
  document.getElementById("stat-conditional-card");

const statTotal =
  document.getElementById("stat-total");

const sectionFormContainer =
  document.querySelector(".form-section");

const recipeForm =
  document.getElementById("recipe-form");

const tipoRegistroSelect =
  document.getElementById("form-tipo-registro");

const sectionFormBio =
  document.getElementById("section-form-bio");

const sectionFormQuimico =
  document.getElementById("section-form-quimico");

const recipesContainer =
  document.getElementById("recipes-container");

const searchInput =
  document.getElementById("search-input");

const filterButtons =
  document.querySelectorAll(".btn-filter");

const formTitle =
  document.getElementById("form-title");

const btnFormSubmit =
  document.getElementById("btn-form-submit");

const btnFormCancel =
  document.getElementById("btn-form-cancel");


// ======================================================
// AUTENTICACIÓN
// ======================================================

const loginModal =
  document.getElementById("login-modal");

const loginForm =
  document.getElementById("login-form");

const btnOpenLogin =
  document.getElementById("btn-open-login");

const btnCloseLogin =
  document.getElementById("btn-close-login");

const btnLogout =
  document.getElementById("btn-logout");

const adminLoggedInfo =
  document.getElementById("admin-logged-info");


// ======================================================
// CAMPOS DE DOSIFICACIÓN
// ======================================================

const doseWater =
  document.getElementById("recipe-dose-water");

const doseLow =
  document.getElementById("recipe-dose-low");

const doseHigh =
  document.getElementById("recipe-dose-high");

const doseTableWrapper =
  document.getElementById("dose-table-wrapper");

const doseValidationMessage =
  document.getElementById("dose-validation-message");

const doseConfirmStatus =
  document.getElementById("dose-confirm-status");

const doseConfirmationSummary =
  document.getElementById("dose-confirmation-summary");

const btnConfirmDoses =
  document.getElementById("btn-confirm-doses");

const btnCancelDoses =
  document.getElementById("btn-cancel-doses");


// ======================================================
// AUTENTICACIÓN
// ======================================================

onAuthStateChanged(
  auth,
  (user) => {

    esAdmin = !!user;

    if (btnOpenLogin) {
      btnOpenLogin.style.display =
        user ? "none" : "inline-block";
    }

    if (adminLoggedInfo) {
      adminLoggedInfo.style.display =
        user ? "inline-block" : "none";
    }

    if (sectionFormContainer) {
      sectionFormContainer.style.display =
        user ? "block" : "none";
    }

    calcularMetricasYRender();
  }
);


// ======================================================
// LOGIN
// ======================================================

if (btnOpenLogin) {

  btnOpenLogin.addEventListener(
    "click",
    () => {

      if (loginModal) {
        loginModal.style.display = "flex";
      }

    }
  );

}


if (btnCloseLogin) {

  btnCloseLogin.addEventListener(
    "click",
    () => {

      if (loginModal) {
        loginModal.style.display = "none";
      }

    }
  );

}


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const email =
        document.getElementById("login-email").value;

      const pass =
        document.getElementById("login-password").value;

      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          pass
        );

        loginModal.style.display = "none";
        loginForm.reset();

        alert(
          "¡Bienvenido Modo Administrador!"
        );

      } catch (error) {

        alert(
          "Error de acceso: " +
          error.message
        );

      }

    }
  );

}


// ======================================================
// LOGOUT
// ======================================================

if (btnLogout) {

  btnLogout.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

        alert(
          "Sesión cerrada."
        );

      } catch (error) {

        console.error(error);

      }

    }
  );

}


// ======================================================
// CAMBIO DE TIPO
// ======================================================

if (tipoRegistroSelect) {

  tipoRegistroSelect.addEventListener(
    "change",
    (e) => {

      alternarCamposFormulario(
        e.target.value
      );

    }
  );

}


function alternarCamposFormulario(tipo) {

  if (tipo === "bio") {

    if (sectionFormBio) {
      sectionFormBio.style.display = "block";
    }

    if (sectionFormQuimico) {
      sectionFormQuimico.style.display = "none";
    }

  } else {

    if (sectionFormBio) {
      sectionFormBio.style.display = "none";
    }

    if (sectionFormQuimico) {
      sectionFormQuimico.style.display = "block";
    }

  }

}


// ======================================================
// MUNDO BIO
// ======================================================

if (btnWorldBio) {

  btnWorldBio.addEventListener(
    "click",
    () => {

      mundoActual = "bio";

      btnWorldBio.className =
        "btn-world active-bio";

      if (btnWorldQui) {
        btnWorldQui.className =
          "btn-world";
      }

      if (statsTitle) {
        statsTitle.textContent =
          "Métricas Mundo Bio";
      }

      if (resultsTitle) {
        resultsTitle.textContent =
          "Listado de Biopreparados";
      }

      if (statConditionalCard) {
        statConditionalCard.innerHTML =
          'Eficacia Alta <span id="stat-alta">0</span>';
      }

      filtroFuncionActual = "todos";

      resetearFiltrosBotones();

      calcularMetricasYRender();

    }
  );

}


// ======================================================
// MUNDO QUÍMICO
// ======================================================

if (btnWorldQui) {

  btnWorldQui.addEventListener(
    "click",
    () => {

      mundoActual = "quimico";

      btnWorldQui.className =
        "btn-world active-qui";

      if (btnWorldBio) {
        btnWorldBio.className =
          "btn-world";
      }

      if (statsTitle) {
        statsTitle.textContent =
          "Métricas Mundo Químico";
      }

      if (resultsTitle) {
        resultsTitle.textContent =
          "Listado de Productos Químicos";
      }

      if (statConditionalCard) {
        statConditionalCard.innerHTML =
          'Sistémicos <span id="stat-alta">0</span>';
      }

      filtroFuncionActual = "todos";

      resetearFiltrosBotones();

      calcularMetricasYRender();

    }
  );

}


function resetearFiltrosBotones() {

  filterButtons.forEach(
    (btn, index) => {

      btn.style.background =
        index === 0
          ? "#81c784"
          : "#f1f8e9";

    }
  );

}


// ======================================================
// FIREBASE
// ======================================================

onSnapshot(
  query(recetasRef),
  (snapshot) => {

    todosLosDatos = [];

    snapshot.forEach(
      (docSnap) => {

        todosLosDatos.push({
          id: docSnap.id,
          ...docSnap.data()
        });

      }
    );

    calcularMetricasYRender();

  },
  (error) => {

    console.error(
      "Error leyendo Firebase:",
      error
    );

  }
);


// ======================================================
// UNIDAD DOSIS
// ======================================================

function obtenerUnidadDosis() {

  const radio =
    document.querySelector(
      'input[name="dose-unit"]:checked'
    );

  return radio
    ? radio.value
    : "";

}


// ======================================================
// FORMATO NÚMERO
// ======================================================

function formatearNumero(numero) {

  if (
    !Number.isFinite(numero)
  ) {

    return "—";

  }

  if (
    Number.isInteger(numero)
  ) {

    return String(numero);

  }

  return Number(
    numero.toFixed(4)
  )
    .toString()
    .replace(".", ",");

}


// ======================================================
// DATOS DE DOSIS
// ======================================================

function obtenerDatosDosisFormulario() {

  const baja =
    parseFloat(
      doseLow?.value
    );

  const alta =
    parseFloat(
      doseHigh?.value
    );

  const agua =
    parseFloat(
      doseWater?.value
    ) || 100;

  const unidad =
    obtenerUnidadDosis();

  return {

    agua,
    baja,
    alta,
    unidad,

    valido:

      Number.isFinite(baja) &&
      baja > 0 &&

      Number.isFinite(alta) &&
      alta > 0 &&

      alta >= baja &&

      Boolean(unidad)

  };

}


// ======================================================
// ACTUALIZAR TABLA
// ======================================================

function actualizarDosisFormulario() {

  const datos =
    obtenerDatosDosisFormulario();


  dosisConfirmada = false;


  if (doseConfirmStatus) {
    doseConfirmStatus.style.display =
      "none";
  }


  // ----------------------------------------
  // VALIDACIÓN
  // ----------------------------------------

  if (!datos.valido) {

    if (doseTableWrapper) {
      doseTableWrapper.style.display =
        "none";
    }

    if (doseValidationMessage) {

      doseValidationMessage.style.display =
        "block";

      let mensaje =
        "Completa dosis baja, dosis alta y selecciona g, cc o mL.";

      if (
        Number.isFinite(datos.baja) &&
        Number.isFinite(datos.alta) &&
        datos.alta < datos.baja
      ) {

        mensaje =
          "La dosis alta no puede ser menor que la dosis baja.";

      }

      doseValidationMessage.textContent =
        mensaje;

    }

    return;

  }


  if (doseValidationMessage) {
    doseValidationMessage.style.display =
      "none";
  }


  if (doseTableWrapper) {
    doseTableWrapper.style.display =
      "block";
  }


  // ----------------------------------------
  // CALCULAR 1 / 15 / 100 / 160
  // ----------------------------------------

  const litros =
    [1, 15, 100, 160];


  litros.forEach(
    (L) => {

      const baja =
        datos.baja *
        L /
        datos.agua;

      const alta =
        datos.alta *
        L /
        datos.agua;


      const lowCell =
        document.getElementById(
          `dose-low-${L}`
        );

      const highCell =
        document.getElementById(
          `dose-high-${L}`
        );


      if (lowCell) {

        lowCell.textContent =
          `${formatearNumero(baja)} ${datos.unidad}`;

      }


      if (highCell) {

        highCell.textContent =
          `${formatearNumero(alta)} ${datos.unidad}`;

      }

    }
  );


  // ----------------------------------------
  // RESUMEN
  // ----------------------------------------

  if (doseConfirmationSummary) {

    doseConfirmationSummary.innerHTML = `
      <strong>Resumen de dosificación</strong><br>
      Referencia:
      <strong>${datos.agua} L de agua</strong><br>

      Preventivo (Baja):
      <strong>
        ${formatearNumero(datos.baja)}
        ${datos.unidad}
      </strong><br>

      Curativo (Alta):
      <strong>
        ${formatearNumero(datos.alta)}
        ${datos.unidad}
      </strong>
    `;

  }

}


// ======================================================
// EVENTOS DOSIFICACIÓN
// ======================================================

if (doseLow) {

  doseLow.addEventListener(
    "input",
    actualizarDosisFormulario
  );

}


if (doseHigh) {

  doseHigh.addEventListener(
    "input",
    actualizarDosisFormulario
  );

}


document
  .querySelectorAll(
    'input[name="dose-unit"]'
  )
  .forEach(
    (radio) => {

      radio.addEventListener(
        "change",
        actualizarDosisFormulario
      );

    }
  );


// ======================================================
// CONFIRMAR DOSIS
// ======================================================

if (btnConfirmDoses) {

  btnConfirmDoses.addEventListener(
    "click",
    () => {

      const datos =
        obtenerDatosDosisFormulario();


      if (!datos.valido) {

        alert(
          "Debes ingresar dosis baja, dosis alta y seleccionar la unidad."
        );

        return;

      }


      const confirmado =
        confirm(
          "¿Confirmas que las dosificaciones son correctas?\n\n" +

          `Preventivo (Baja): ${
            formatearNumero(datos.baja)
          } ${datos.unidad} / ${datos.agua} L\n` +

          `Curativo (Alta): ${
            formatearNumero(datos.alta)
          } ${datos.unidad} / ${datos.agua} L`
        );


      if (confirmado) {

        dosisConfirmada =
          true;

        if (doseConfirmStatus) {

          doseConfirmStatus.style.display =
            "block";

        }

      }

    }
  );

}


// ======================================================
// CORREGIR DOSIS
// ======================================================

if (btnCancelDoses) {

  btnCancelDoses.addEventListener(
    "click",
    () => {

      dosisConfirmada =
        false;

      if (doseConfirmStatus) {

        doseConfirmStatus.style.display =
          "none";

      }

      if (doseLow) {
        doseLow.focus();
      }

    }
  );

}


// ======================================================
// CONSTRUIR CONFIGURACIÓN DOSIS
// ======================================================

function construirObjetoDosis() {

  const datos =
    obtenerDatosDosisFormulario();


  if (
    !datos.valido
  ) {

    return null;

  }


  return {

    agua_referencia:
      datos.agua,

    dosis_baja:
      datos.baja,

    dosis_alta:
      datos.alta,

    unidad:
      datos.unidad,

    preventivo:
      "Dosis Baja",

    curativo:
      "Dosis Alta",

    confirmado:
      dosisConfirmada,

    tabla:
      [1, 15, 100, 160].map(
        (L) => {

          return {

            litros:
              L,

            preventivo:
              datos.baja *
              L /
              datos.agua,

            curativo:
              datos.alta *
              L /
              datos.agua,

            unidad:
              datos.unidad

          };

        }
      )

  };

}


// ======================================================
// TEXTO DOSIS
// ======================================================

function construirTextoDosis(
  dosis
) {

  if (
    !dosis ||
    !dosis.confirmado
  ) {

    return "";

  }


  return (
    `${dosis.agua_referencia} L: ` +
    `Preventivo ${formatearNumero(dosis.dosis_baja)} ${dosis.unidad}; ` +
    `Curativo ${formatearNumero(dosis.dosis_alta)} ${dosis.unidad}`
  );

}


// ======================================================
// TABLA DE DOSIS EN TARJETAS
// ======================================================

function generarTablaDosisHTML(
  modoAplicacion,
  recipeId,
  esQuimico,
  item = null
) {

  let dosis =
    item?.dosis_config ||
    null;


  if (
    !dosis &&
    modoAplicacion
  ) {

    dosis =
      interpretarDosisAntigua(
        modoAplicacion
      );

  }


  if (
    !dosis ||
    !dosis.confirmado
  ) {

    return `
      <div
        style="
          margin-top:12px;
          padding:10px;
          background:#f5f5f5;
          border-radius:6px;
        "
      >
        <strong>Dosificación:</strong>
        No especificada
      </div>
    `;

  }


  const filas =
    Array.isArray(dosis.tabla)
      ? dosis.tabla
      : [];


  const filasHTML =
    filas
      .map(
        (fila) => {

          return `
            <tr>

              <td>
                <strong>
                  ${fila.litros} L
                </strong>
              </td>

              <td>
                <span class="badge-baja">
                  ${formatearNumero(
                    fila.preventivo
                  )}
                  ${fila.unidad}
                </span>
              </td>

              <td>
                <span class="badge-alta">
                  ${formatearNumero(
                    fila.curativo
                  )}
                  ${fila.unidad}
                </span>
              </td>

            </tr>
          `;

        }
      )
      .join("");


  const calcClass =
    esQuimico
      ? "calc-box calc-qui"
      : "calc-box";


  return `

    <div style="margin-top:12px;">

      <strong>
        Dosificación
      </strong>

      <div class="tabla-dosis-container">

        <table class="tabla-dosis">

          <thead>

            <tr>

              <th>
                Agua
              </th>

              <th>
                Preventivo (Baja)
              </th>

              <th>
                Curativo (Alta)
              </th>

            </tr>

          </thead>

          <tbody>

            ${filasHTML}

          </tbody>

        </table>

      </div>

    </div>


    <div
      class="${calcClass}"
      style="margin-top:12px;"
    >

      <strong style="font-size:13px;">
        Calculadora Rápida para Estanque
      </strong>


      <div class="calc-row">

        <input
          type="number"
          class="calc-input input-litros"
          data-id="${recipeId}"
          placeholder="Litros de estanque"
          value="100"
          min="1"
          step="1"
        >

      </div>


      <div class="calc-row">

        <button
          type="button"
          class="btn-calc-type btn-prev active-preventivo"
          data-id="${recipeId}"
          data-base="${dosis.agua_referencia}"
          data-dosis="${dosis.dosis_baja}"
          data-unidad="${dosis.unidad}"
        >
          Preventivo (Baja)
        </button>


        <button
          type="button"
          class="btn-calc-type btn-cur"
          data-id="${recipeId}"
          data-base="${dosis.agua_referencia}"
          data-dosis="${dosis.dosis_alta}"
          data-unidad="${dosis.unidad}"
        >
          Curativo (Alta)
        </button>

      </div>


      <div
        class="calc-result-box"
        id="res-calc-${recipeId}"
      >

        Mezclar:
        <strong>
          ${formatearNumero(
            dosis.dosis_baja
          )}
          ${dosis.unidad}
        </strong>

        para
        ${dosis.agua_referencia} L

      </div>

    </div>

  `;

}


// ======================================================
// DOSIS ANTIGUA
// ======================================================

function interpretarDosisAntigua(
  texto
) {

  if (
    !texto ||
    typeof texto !== "string"
  ) {

    return null;

  }


  const match =
    texto.match(
      /(\d+(?:[.,]\d+)?)\s*L.*?(?:Preventivo\s*)?([\d.,]+)\s*(g|cc|ml|mL|kg).*?(?:Curativo\s*)?([\d.,]+)\s*(g|cc|ml|mL|kg)/i
    );


  if (!match) {

    return null;

  }


  const agua =
    parseFloat(
      match[1].replace(
        ",",
        "."
      )
    );


  const baja =
    parseFloat(
      match[2].replace(
        ",",
        "."
      )
    );


  const alta =
    parseFloat(
      match[4].replace(
        ",",
        "."
      )
    );


  return {

    agua_referencia:
      agua,

    dosis_baja:
      baja,

    dosis_alta:
      alta,

    unidad:
      match[3],

    confirmado:
      true,

    tabla:
      [1, 15, 100, 160].map(
        (L) => {

          return {

            litros:
              L,

            preventivo:
              baja *
              L /
              agua,

            curativo:
              alta *
              L /
              agua,

            unidad:
              match[3]

          };

        }
      )

  };

}


// ======================================================
// CALCULADORA EN TARJETAS
// ======================================================

function activarCalculadorasEnPantalla() {

  document
    .querySelectorAll(
      ".input-litros"
    )
    .forEach(
      (input) => {

        input.addEventListener(
          "input",
          (e) => {

            ejecutarCalculo(
              e.target.getAttribute(
                "data-id"
              )
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".btn-calc-type"
    )
    .forEach(
      (btn) => {

        btn.addEventListener(
          "click",
          (e) => {

            const id =
              e.target.getAttribute(
                "data-id"
              );


            const esCurativo =
              e.target.classList.contains(
                "btn-cur"
              );


            const btnPrev =
              document.querySelector(
                `.btn-prev[data-id="${id}"]`
              );


            const btnCur =
              document.querySelector(
                `.btn-cur[data-id="${id}"]`
              );


            if (esCurativo) {

              btnCur?.classList.add(
                "active-curativo"
              );

              btnPrev?.classList.remove(
                "active-preventivo"
              );

            } else {

              btnPrev?.classList.add(
                "active-preventivo"
              );

              btnCur?.classList.remove(
                "active-curativo"
              );

            }


            ejecutarCalculo(id);

          }
        );

      }
    );

}


// ======================================================
// EJECUTAR CALCULADORA
// ======================================================

function ejecutarCalculo(
  id
) {

  const inputLitros =
    document.querySelector(
      `.input-litros[data-id="${id}"]`
    );


  const btnPrev =
    document.querySelector(
      `.btn-prev[data-id="${id}"]`
    );


  const btnCur =
    document.querySelector(
      `.btn-cur[data-id="${id}"]`
    );


  const resBox =
    document.getElementById(
      `res-calc-${id}`
    );


  if (
    !inputLitros ||
    !resBox
  ) {

    return;

  }


  const curativoActivo =
    btnCur?.classList.contains(
      "active-curativo"
    );


  const btnActivo =
    curativoActivo
      ? btnCur
      : btnPrev;


  if (!btnActivo) {
    return;
  }


  const litros =
    parseFloat(
      inputLitros.value
    );


  const base =
    parseFloat(
      btnActivo.getAttribute(
        "data-base"
      )
    );


  const dosis =
    parseFloat(
      btnActivo.getAttribute(
        "data-dosis"
      )
    );


  const unidad =
    btnActivo.getAttribute(
      "data-unidad"
    ) || "cc";


  if (
    !Number.isFinite(litros) ||
    litros <= 0 ||
    !Number.isFinite(base) ||
    base <= 0 ||
    !Number.isFinite(dosis)
  ) {

    resBox.innerHTML =
      "⚠️ Ingresa una cantidad válida de litros";

    return;

  }


  const resultado =
    litros /
    base *
    dosis;


  const modo =
    curativoActivo
      ? "Curativo (Alta)"
      : "Preventivo (Baja)";


  resBox.innerHTML =
    `Modo ${modo}: Agregar <strong>${formatearNumero(resultado)} ${unidad}</strong>`;

}


// ======================================================
// MÉTRICAS Y RENDER
// ======================================================

function calcularMetricasYRender() {

  const datosDelMundo =
    todosLosDatos.filter(
      (r) =>
        (
          r.tipo_registro ||
          "bio"
        ) ===
        mundoActual
    );


  if (statTotal) {
    statTotal.textContent =
      datosDelMundo.length;
  }


  let contador =
    0;


  datosDelMundo.forEach(
    (r) => {

      if (
        mundoActual === "bio" &&
        r.efectividad ===
          "Eficacia Alta"
      ) {

        contador++;

      }


      if (
        mundoActual === "quimico" &&
        Array.isArray(r.modo_accion) &&
        r.modo_accion.some(
          m =>
            String(m)
              .toLowerCase()
              .includes("sistem")
        )
      ) {

        contador++;

      }

    }
  );


  const badgeAlta =
    document.getElementById(
      "stat-alta"
    );


  if (badgeAlta) {
    badgeAlta.textContent =
      contador;
  }


  const busqueda =
    searchInput
      ? searchInput.value
          .toLowerCase()
          .trim()
      : "";


  if (!recipesContainer) {
    return;
  }


  recipesContainer.innerHTML =
    "";


  const filtrados =
    datosDelMundo.filter(
      (r) => {

        const nombre =
          String(
            r.nombre ||
            ""
          ).toLowerCase();


        const activo =
          String(
            r.ingrediente_activo ||
            ""
          ).toLowerCase();


        const plagas =
          Array.isArray(
            r.plagas_objetivo
          )
            ? r.plagas_objetivo
            : [];


        const coincideTexto =
          nombre.includes(
            busqueda
          ) ||

          activo.includes(
            busqueda
          ) ||

          plagas.some(
            p =>
              String(p)
                .toLowerCase()
                .includes(
                  busqueda
                )
          );


        const coincideFuncion =
          filtroFuncionActual ===
            "todos" ||

          (
            Array.isArray(
              r.funcion
            ) &&

            r.funcion.includes(
              filtroFuncionActual
            )
          );


        return (
          coincideTexto &&
          coincideFuncion
        );

      }
    );


  if (
    filtrados.length === 0
  ) {

    recipesContainer.innerHTML =
      '<p class="loading-text">No se encontraron productos registrados.</p>';

    return;

  }


  filtrados.forEach(
    (r) => {

      const card =
        document.createElement(
          "div"
        );


      const esQui =
        r.tipo_registro ===
        "quimico";


      card.className =
        `recipe-card ${
          esQui
            ? "card-qui"
            : "card-bio"
        }`;


      const tagsHTML =
        Array.isArray(
          r.funcion
        )
          ? r.funcion
              .map(
                f =>
                  `<span class="tag ${
                    esQui
                      ? "tag-qui-label"
                      : ""
                  }">${
                    escapeHTML(f)
                  }</span>`
              )
              .join("")
          : "";


      const plagasHTML =
        Array.isArray(
          r.plagas_objetivo
        ) &&
        r.plagas_objetivo.length
          ? `
            <p style="
              font-size:13px;
              color:#555;
            ">

              <strong>
                Plagas:
              </strong>

              ${r.plagas_objetivo
                .map(
                  p =>
                    escapeHTML(p)
                )
                .join(", ")}

            </p>
          `
          : "";


      const botonesAccion =
        esAdmin
          ? `
            <div class="action-buttons">

              <button
                class="btn-action btn-edit"
                data-id="${r.id}"
              >
                ✏️
              </button>

              <button
                class="btn-action btn-delete"
                data-id="${r.id}"
              >
                🗑️
              </button>

            </div>
          `
          : "";


      if (esQui) {

        const modos =
          Array.isArray(
            r.modo_accion
          )
            ? r.modo_accion.join(
                ", "
              )
            : "No especificado";


        card.innerHTML = `

          ${botonesAccion}

          <h3 class="qui-title">
            ${escapeHTML(
              r.nombre ||
              ""
            )}
          </h3>

          <div
            style="margin-bottom:8px;"
          >
            ${tagsHTML}
          </div>


          <div class="info-box-qui">

            <p>
              <strong>
                I. Activo:
              </strong>

              ${escapeHTML(
                r.ingrediente_activo ||
                "No especificado"
              )}
            </p>


            <p>
              <strong>
                Concentración:
              </strong>

              ${escapeHTML(
                r.concentracion ||
                "No especificada"
              )}
            </p>


            <p>
              <strong>
                Modo Acción:
              </strong>

              ${escapeHTML(
                modos
              )}
            </p>

          </div>


          ${generarTablaDosisHTML(
            r.modo_aplicacion,
            r.id,
            true,
            r
          )}


          ${plagasHTML}


          <button
            class="btn-toggle qui-toggle"
            data-id="${r.id}"
          >
            Ver Carencia y Reentrada
          </button>


          <div
            class="extra-content"
            id="extra-${r.id}"
            style="display:none;"
          >

            <p>
              <strong>
                Período de Carencia:
              </strong>

              ${escapeHTML(
                r.carencia ||
                "No indicado"
              )}
            </p>


            <p>
              <strong>
                Seguridad de Reentrada:
              </strong>

              ${escapeHTML(
                r.reentrada ||
                "No indicado"
              )}
            </p>

          </div>

        `;

      } else {

        const contraHTML =
          r.contraindicacion
            ? `
              <div class="warning-box">
                ⚠️
                ${escapeHTML(
                  r.contraindicacion
                )}
              </div>
            `
            : "";


        card.innerHTML = `

          ${botonesAccion}

          <h3>
            ${escapeHTML(
              r.nombre ||
              ""
            )}
          </h3>


          <div
            style="
              margin-bottom:8px;
            "
          >

            ${tagsHTML}

            <span class="tag-efectividad">

              ${escapeHTML(
                r.efectividad ||
                "En evaluación"
              )}

            </span>

          </div>


          ${generarTablaDosisHTML(
            r.modo_aplicacion,
            r.id,
            false,
            r
          )}


          ${contraHTML}


          ${plagasHTML}


          <button
            class="btn-toggle"
            data-id="${r.id}"
          >
            Ver Preparación e Ingredientes
          </button>


          <div
            class="extra-content"
            id="extra-${r.id}"
            style="display:none;"
          >

            <p>

              <strong>
                Ingredientes:
              </strong>

              ${escapeHTML(
                r.ingredientes ||
                "No especificados"
              )}

            </p>


            <p>

              <strong>
                Preparación:
              </strong>

              ${escapeHTML(
                r.preparacion ||
                "No especificada"
              )}

            </p>

          </div>

        `;

      }


      recipesContainer.appendChild(
        card
      );

    }
  );


  asignarEventosTarjetas();
  activarCalculadorasEnPantalla();

}


// ======================================================
// EVENTOS TARJETAS
// ======================================================

function asignarEventosTarjetas() {

  document
    .querySelectorAll(
      ".btn-toggle"
    )
    .forEach(
      (btn) => {

        btn.addEventListener(
          "click",
          (e) => {

            const id =
              e.target.getAttribute(
                "data-id"
              );


            const panel =
              document.getElementById(
                `extra-${id}`
              );


            if (!panel) {
              return;
            }


            if (
              panel.style.display ===
              "block"
            ) {

              panel.style.display =
                "none";


              e.target.textContent =
                e.target.classList.contains(
                  "qui-toggle"
                )

                  ? "Ver Carencia y Reentrada"

                  : "Ver Preparación e Ingredientes";

            } else {

              panel.style.display =
                "block";

              e.target.textContent =
                "Ocultar Detalles";

            }

          }
        );

      }
    );


  if (esAdmin) {

    document
      .querySelectorAll(
        ".btn-edit"
      )
      .forEach(
        (btn) => {

          btn.addEventListener(
            "click",
            (e) => {

              const id =
                e.target.getAttribute(
                  "data-id"
                );


              const item =
                todosLosDatos.find(
                  r =>
                    r.id === id
                );


              if (item) {

                cargarItemEnFormulario(
                  item
                );

              }

            }
          );

        }
      );


    document
      .querySelectorAll(
        ".btn-delete"
      )
      .forEach(
        (btn) => {

          btn.addEventListener(
            "click",
            async (e) => {

              const id =
                e.target.getAttribute(
                  "data-id"
                );


              if (
                !confirm(
                  "¿Estás seguro de eliminar este registro?"
                )
              ) {

                return;

              }


              try {

                await deleteDoc(
                  doc(
                    db,
                    "recetas",
                    id
                  )
                );

              } catch (
                error
              ) {

                console.error(
                  error
                );

                alert(
                  "No se pudo eliminar el registro."
                );

              }

            }
          );

        }
      );

  }

}


// ======================================================
// CARGAR ITEM EN FORMULARIO
// ======================================================

function cargarItemEnFormulario(
  item
) {

  if (formTitle) {
    formTitle.textContent =
      "Editar Registro Fitosanitario";
  }

  if (btnFormSubmit) {
    btnFormSubmit.textContent =
      "Actualizar Cambios";
  }

  if (btnFormCancel) {
    btnFormCancel.style.display =
      "block";
  }


  document.getElementById(
    "recipe-id"
  ).value =
    item.id;


  tipoRegistroSelect.value =
    item.tipo_registro ||
    "bio";


  alternarCamposFormulario(
    item.tipo_registro ||
    "bio"
  );


  document.getElementById(
    "recipe-name"
  ).value =
    item.nombre ||
    "";


  document.getElementById(
    "recipe-plagas"
  ).value =
    Array.isArray(
      item.plagas_objetivo
    )
      ? item.plagas_objetivo.join(
          ", "
        )
      : "";


  document
    .querySelectorAll(
      'input[name="funcion"]'
    )
    .forEach(
      (cb) => {

        cb.checked =
          Array.isArray(
            item.funcion
          ) &&
          item.funcion.includes(
            cb.value
          );

      }
    );


  // ====================================================
  // DOSIS
  // ====================================================

  dosisConfirmada =
    false;


  if (doseConfirmStatus) {
    doseConfirmStatus.style.display =
      "none";
  }


  const dosis =
    item.dosis_config ||
    null;


  if (dosis) {

    if (doseWater) {
      doseWater.value =
        dosis.agua_referencia ||
        100;
    }

    if (doseLow) {
      doseLow.value =
        dosis.dosis_baja ??
        "";
    }

    if (doseHigh) {
      doseHigh.value =
        dosis.dosis_alta ??
        "";
    }


    document
      .querySelectorAll(
        'input[name="dose-unit"]'
      )
      .forEach(
        (radio) => {

          radio.checked =
            radio.value ===
            dosis.unidad;

        }
      );


    actualizarDosisFormulario();

  } else {

    limpiarDosisFormulario();

  }


  // ====================================================
  // BIO
  // ====================================================

  if (
    (
      item.tipo_registro ||
      "bio"
    ) ===
    "bio"
  ) {

    document.getElementById(
      "recipe-efectividad"
    ).value =
      item.efectividad ||
      "En evaluación";


    document.getElementById(
      "recipe-contra"
    ).value =
      item.contraindicacion ||
      "";


    document.getElementById(
      "recipe-ingredients"
    ).value =
      item.ingredientes ||
      "";


    document.getElementById(
      "recipe-prep"
    ).value =
      item.preparacion ||
      "";

  }


  // ====================================================
  // QUÍMICO
  // ====================================================

  else {

    document.getElementById(
      "recipe-activo"
    ).value =
      item.ingrediente_activo ||
      "";


    // NUEVO: CONCENTRACIÓN

    const concentracion =
      document.getElementById(
        "recipe-concentracion"
      );

    if (concentracion) {

      concentracion.value =
        item.concentracion ||
        "";

    }


    document.getElementById(
      "recipe-carencia"
    ).value =
      item.carencia ||
      "";


    document.getElementById(
      "recipe-reentrada"
    ).value =
      item.reentrada ||
      "";


    document
      .querySelectorAll(
        'input[name="modo_accion"]'
      )
      .forEach(
        (cb) => {

          const modos =
            Array.isArray(
              item.modo_accion
            )
              ? item.modo_accion
              : [];


          cb.checked =
            modos.some(
              modo =>
                normalizarModo(
                  modo
                ) ===
                normalizarModo(
                  cb.value
                )
            );

        }
      );

  }


  recipeForm.scrollIntoView({
    behavior: "smooth"
  });

}


// ======================================================
// SUBMIT
// ======================================================

if (recipeForm) {

  recipeForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      if (!esAdmin) {

        alert(
          "Acceso denegado: debes ser Administrador."
        );

        return;

      }


      const id =
        document.getElementById(
          "recipe-id"
        ).value;


      const tipo =
        tipoRegistroSelect.value;


      const nombre =
        document.getElementById(
          "recipe-name"
        ).value.trim();


      if (!nombre) {

        alert(
          "Ingresa el nombre del producto."
        );

        return;

      }


      // ==================================================
      // FUNCIÓN
      // ==================================================

      const funciones =
        [];


      document
        .querySelectorAll(
          'input[name="funcion"]:checked'
        )
        .forEach(
          (cb) => {

            funciones.push(
              cb.value
            );

          }
        );


      // ==================================================
      // PLAGAS
      // ==================================================

      const plagasTexto =
        document.getElementById(
          "recipe-plagas"
        ).value;


      const plagasArray =
        plagasTexto
          .split(",")
          .map(
            p => p.trim()
          )
          .filter(
            Boolean
          );


      // ==================================================
      // DOSIS
      // ==================================================

      const dosis =
        construirObjetoDosis();


      if (!dosis) {

        alert(
          "Debes ingresar dosis baja, dosis alta y seleccionar g, cc o mL."
        );

        return;

      }


      if (!dosisConfirmada) {

        alert(
          "Debes confirmar que las dosificaciones ingresadas son correctas antes de guardar."
        );

        return;

      }


      // ==================================================
      // DATOS BASE
      // ==================================================

      const datos = {

        tipo_registro:
          tipo,

        nombre:
          nombre,

        funcion:
          funciones,

        plagas_objetivo:
          plagasArray,

        modo_aplicacion:
          construirTextoDosis(
            dosis
          ),

        dosis_config:
          dosis,

        actualizado_el:
          new Date().toISOString()

      };


      // ==================================================
      // BIO
      // ==================================================

      if (
        tipo ===
        "bio"
      ) {

        datos.efectividad =
          document.getElementById(
            "recipe-efectividad"
          ).value;


        datos.contraindicacion =
          document.getElementById(
            "recipe-contra"
          ).value.trim();


        datos.ingredientes =
          document.getElementById(
            "recipe-ingredients"
          ).value.trim();


        datos.preparacion =
          document.getElementById(
            "recipe-prep"
          ).value.trim();

      }


      // ==================================================
      // QUÍMICO
      // ==================================================

      else {

        const modos =
          [];


        document
          .querySelectorAll(
            'input[name="modo_accion"]:checked'
          )
          .forEach(
            (cb) => {

              modos.push(
                cb.value
              );

            }
          );


        datos.ingrediente_activo =
          document.getElementById(
            "recipe-activo"
          ).value.trim();


        // NUEVO: CONCENTRACIÓN

        const concentracion =
          document.getElementById(
            "recipe-concentracion"
          );


        datos.concentracion =
          concentracion
            ? concentracion.value.trim()
            : "";


        datos.modo_accion =
          modos;


        // MANUALES

        datos.carencia =
          document.getElementById(
            "recipe-carencia"
          ).value.trim();


        datos.reentrada =
          document.getElementById(
            "recipe-reentrada"
          ).value.trim();

      }


      // ==================================================
      // FIREBASE
      // ==================================================

      try {

        if (
          id === ""
        ) {

          await addDoc(
            recetasRef,
            datos
          );


          alert(
            "¡Producto registrado con éxito!"
          );

        } else {

          await updateDoc(
            doc(
              db,
              "recetas",
              id
            ),
            datos
          );


          alert(
            "¡Registro actualizado con éxito!"
          );

        }


        resetearFormulario();

      } catch (error) {

        console.error(
          "Error guardando:",
          error
        );

        alert(
          "Error al guardar en Firebase."
        );

      }

    }
  );

}


// ======================================================
// LIMPIAR DOSIS
// ======================================================

function limpiarDosisFormulario() {

  dosisConfirmada =
    false;


  if (doseWater) {
    doseWater.value =
      "100";
  }


  if (doseLow) {
    doseLow.value =
      "";
  }


  if (doseHigh) {
    doseHigh.value =
      "";
  }


  document
    .querySelectorAll(
      'input[name="dose-unit"]'
    )
    .forEach(
      (radio) => {

        radio.checked =
          false;

      }
    );


  if (doseTableWrapper) {
    doseTableWrapper.style.display =
      "none";
  }


  if (doseValidationMessage) {
    doseValidationMessage.style.display =
      "none";
  }


  if (doseConfirmStatus) {
    doseConfirmStatus.style.display =
      "none";
  }


  if (doseConfirmationSummary) {
    doseConfirmationSummary.innerHTML =
      "";
  }

}


// ======================================================
// RESET FORMULARIO
// ======================================================

function resetearFormulario() {

  if (formTitle) {
    formTitle.textContent =
      "Agregar Nuevo Registro Fitosanitario";
  }


  if (btnFormSubmit) {
    btnFormSubmit.textContent =
      "Guardar Producto";
  }


  if (btnFormCancel) {
    btnFormCancel.style.display =
      "none";
  }


  const id =
    document.getElementById(
      "recipe-id"
    );


  if (id) {
    id.value = "";
  }


  if (recipeForm) {
    recipeForm.reset();
  }


  if (tipoRegistroSelect) {
    tipoRegistroSelect.value =
      mundoActual;
  }


  alternarCamposFormulario(
    mundoActual
  );


  limpiarDosisFormulario();

}


// ======================================================
// CANCELAR
// ======================================================

if (btnFormCancel) {

  btnFormCancel.addEventListener(
    "click",
    resetearFormulario
  );

}


// ======================================================
// BUSCADOR
// ======================================================

if (searchInput) {

  searchInput.addEventListener(
    "input",
    calcularMetricasYRender
  );

}


// ======================================================
// FILTROS
// ======================================================

filterButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      (e) => {

        filtroFuncionActual =
          e.target.getAttribute(
            "data-funcion"
          );


        filterButtons.forEach(
          btn => {

            btn.style.background =
              "#f1f8e9";

          }
        );


        e.target.style.background =
          "#81c784";


        calcularMetricasYRender();

      }
    );

  }
);


// ======================================================
// LECTOR DE ETIQUETAS IA
// ======================================================

const btnTriggerAI =
  document.getElementById(
    "btn-trigger-ai"
  );

const aiImageInput =
  document.getElementById(
    "ai-image-input"
  );

const aiLoading =
  document.getElementById(
    "ai-loading"
  );


if (
  btnTriggerAI &&
  aiImageInput
) {

  btnTriggerAI.addEventListener(
    "click",
    () => {

      aiImageInput.click();

    }
  );


  aiImageInput.addEventListener(
    "change",
    async (e) => {

      const file =
        e.target.files?.[0];


      if (!file) {
        return;
      }


      if (aiLoading) {

        aiLoading.style.display =
          "block";

      }


      btnTriggerAI.disabled =
        true;


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        alert(
          "Por favor selecciona o toma una foto de la etiqueta."
        );


        if (aiLoading) {

          aiLoading.style.display =
            "none";

        }


        btnTriggerAI.disabled =
          false;


        aiImageInput.value =
          "";

        return;

      }


      try {

        const resultado =
          await analizarEtiqueta(
            file
          );


        if (
          !resultado ||
          !resultado.ok
        ) {

          throw new Error(
            resultado?.mensaje ||
            "La IA no pudo procesar la imagen."
          );

        }


        const datos =
          resultado.datos ||
          resultado;


        // ==================================================
        // TIPO
        // ==================================================

        if (
          datos.tipo_registro
        ) {

          tipoRegistroSelect.value =
            datos.tipo_registro;


          alternarCamposFormulario(
            datos.tipo_registro
          );

        }


        // ==================================================
        // NOMBRE
        // ==================================================

        const nameInput =
          document.getElementById(
            "recipe-name"
          );


        if (nameInput) {

          nameInput.value =
            datos.nombre ||
            "";

        }


        // ==================================================
        // PLAGAS
        // ==================================================

        const plagasInput =
          document.getElementById(
            "recipe-plagas"
          );


        if (plagasInput) {

          plagasInput.value =
            Array.isArray(
              datos.plagas_objetivo
            )
              ? datos.plagas_objetivo.join(
                  ", "
                )
              : "";

        }


        // ==================================================
        // FUNCIÓN
        // ==================================================

        document
          .querySelectorAll(
            'input[name="funcion"]'
          )
          .forEach(
            (cb) => {

              const funciones =
                Array.isArray(
                  datos.funcion
                )
                  ? datos.funcion
                  : [];


              cb.checked =
                funciones.some(
                  f =>
                    String(f)
                      .toLowerCase()
                      .trim() ===
                    cb.value
                      .toLowerCase()
                      .trim()
                );

            }
          );


        // ==================================================
        // QUÍMICO
        // ==================================================

        if (
          datos.tipo_registro ===
          "quimico"
        ) {

          // -----------------------------------------------
          // INGREDIENTE ACTIVO
          // -----------------------------------------------

          const activo =
            document.getElementById(
              "recipe-activo"
            );


          if (activo) {

            activo.value =
              datos.ingrediente_activo ||
              "";

          }


          // -----------------------------------------------
          // CONCENTRACIÓN
          // -----------------------------------------------

          const concentracion =
            document.getElementById(
              "recipe-concentracion"
            );


          if (concentracion) {

            concentracion.value =
              datos.concentracion ||
              "";

          }


          // -----------------------------------------------
          // MODO DE ACCIÓN
          // -----------------------------------------------

          const modosIA =
            Array.isArray(
              datos.modo_accion
            )
              ? datos.modo_accion
              : [];


          document
            .querySelectorAll(
              'input[name="modo_accion"]'
            )
            .forEach(
              (cb) => {

                cb.checked =
                  modosIA.some(
                    modo =>
                      normalizarModo(
                        modo
                      ) ===
                      normalizarModo(
                        cb.value
                      )
                  );

              }
            );


          // -----------------------------------------------
          // DOSIS
          // -----------------------------------------------

          limpiarDosisFormulario();


          // -----------------------------------------------
          // CARENCIA
          // -----------------------------------------------

          const carencia =
            document.getElementById(
              "recipe-carencia"
            );


          if (carencia) {

            carencia.value =
              "";

          }


          // -----------------------------------------------
          // REINGRESO
          // -----------------------------------------------

          const reentrada =
            document.getElementById(
              "recipe-reentrada"
            );


          if (reentrada) {

            reentrada.value =
              "";

          }

        }


        // ==================================================
        // BIO
        // ==================================================

        else {

          const ingredientes =
            document.getElementById(
              "recipe-ingredients"
            );


          if (ingredientes) {

            ingredientes.value =
              datos.ingrediente_activo ||
              "";

          }


          limpiarDosisFormulario();

        }


        alert(
          "Información identificada correctamente. Ahora ingresa dosis, carencia y reingreso manualmente."
        );

      } catch (error) {

        console.error(
          "Error al procesar la foto con OpenRouter:",
          error
        );


        alert(
          "No se pudo extraer la información automáticamente: " +
          error.message
        );

      } finally {

        if (aiLoading) {

          aiLoading.style.display =
            "none";

        }


        btnTriggerAI.disabled =
          false;


        aiImageInput.value =
          "";

      }

    }
  );

}


// ======================================================
// NORMALIZAR MODO
// ======================================================

function normalizarModo(
  modo
) {

  const texto =
    String(
      modo ||
      ""
    )
      .toLowerCase()
      .trim();


  if (
    texto.includes(
      "sistem"
    )
  ) {

    return "sistemico";

  }


  if (
    texto.includes(
      "contact"
    )
  ) {

    return "contacto";

  }


  if (
    texto.includes(
      "ingest"
    ) ||
    texto.includes(
      "digest"
    )
  ) {

    return "digestivo";

  }


  return texto;

}


// ======================================================
// ESCAPAR HTML
// ======================================================

function escapeHTML(
  texto
) {

  return String(
    texto ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}
