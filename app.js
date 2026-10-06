// ======================================================
// SANIDADAPP / BIO IA
// app.js
// V FINAL - ARQUITECTURA ACTUAL
// ======================================================
//
// FLUJO:
//
// FOTO
//   ↓
// ia.js
//   ↓
// SERVIDOR IA
//   ↓
// Nombre
// Ingrediente activo
// Concentración
// Modo de acción
// Función
//   ↓
// AGRICULTOR
//   ↓
// Plaga / Enfermedad
// Dosis baja
// Dosis alta
// Unidad
// Carencia
// Reingreso
//   ↓
// BIO
//   ↓
// Tabla 1 / 15 / 100 / 160 L
//   ↓
// Confirmación
//   ↓
// Firebase
//
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

const app =
    initializeApp(
        firebaseConfig
    );

const db =
    getFirestore(
        app
    );

const auth =
    getAuth(
        app
    );

const recetasRef =
    collection(
        db,
        "recetas"
    );


// ======================================================
// ESTADO
// ======================================================

let esAdmin = false;

let mundoActual =
    "bio";

let todosLosDatos =
    [];

let filtroFuncionActual =
    "todos";

let dosisConfirmada =
    false;


// ======================================================
// ELEMENTOS PRINCIPALES
// ======================================================

const btnWorldBio =
    document.getElementById(
        "btn-world-bio"
    );

const btnWorldQui =
    document.getElementById(
        "btn-world-qui"
    );

const statsTitle =
    document.getElementById(
        "stats-title"
    );

const resultsTitle =
    document.getElementById(
        "results-title"
    );

const statConditionalCard =
    document.getElementById(
        "stat-conditional-card"
    );

const statTotal =
    document.getElementById(
        "stat-total"
    );

const sectionFormContainer =
    document.querySelector(
        ".form-section"
    );

const recipeForm =
    document.getElementById(
        "recipe-form"
    );

const tipoRegistroSelect =
    document.getElementById(
        "form-tipo-registro"
    );

const sectionFormBio =
    document.getElementById(
        "section-form-bio"
    );

const sectionFormQuimico =
    document.getElementById(
        "section-form-quimico"
    );

const recipesContainer =
    document.getElementById(
        "recipes-container"
    );

const searchInput =
    document.getElementById(
        "search-input"
    );

const filterButtons =
    document.querySelectorAll(
        ".btn-filter"
    );

const formTitle =
    document.getElementById(
        "form-title"
    );

const btnFormSubmit =
    document.getElementById(
        "btn-form-submit"
    );

const btnFormCancel =
    document.getElementById(
        "btn-form-cancel"
    );


// ======================================================
// AUTENTICACIÓN
// ======================================================

const loginModal =
    document.getElementById(
        "login-modal"
    );

const loginForm =
    document.getElementById(
        "login-form"
    );

const btnOpenLogin =
    document.getElementById(
        "btn-open-login"
    );

const btnCloseLogin =
    document.getElementById(
        "btn-close-login"
    );

const btnLogout =
    document.getElementById(
        "btn-logout"
    );

const adminLoggedInfo =
    document.getElementById(
        "admin-logged-info"
    );


// ======================================================
// ESCÁNER IA
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


// ======================================================
// DOSIFICACIÓN
// ======================================================

const doseWater =
    document.getElementById(
        "recipe-dose-water"
    );

const doseLow =
    document.getElementById(
        "recipe-dose-low"
    );

const doseHigh =
    document.getElementById(
        "recipe-dose-high"
    );

const doseTableWrapper =
    document.getElementById(
        "dose-table-wrapper"
    );

const doseValidationMessage =
    document.getElementById(
        "dose-validation-message"
    );

const doseConfirmationSummary =
    document.getElementById(
        "dose-confirmation-summary"
    );

const btnConfirmDoses =
    document.getElementById(
        "btn-confirm-doses"
    );

const btnCancelDoses =
    document.getElementById(
        "btn-cancel-doses"
    );

const doseConfirmStatus =
    document.getElementById(
        "dose-confirm-status"
    );


// ======================================================
// CAMPOS AUXILIARES
// ======================================================

const recipeId =
    document.getElementById(
        "recipe-id"
    );

const recipeName =
    document.getElementById(
        "recipe-name"
    );

const recipeApp =
    document.getElementById(
        "recipe-app"
    );

const recipePlagas =
    document.getElementById(
        "recipe-plagas"
    );

const recipeActivo =
    document.getElementById(
        "recipe-activo"
    );

const recipeConcentracion =
    document.getElementById(
        "recipe-concentracion"
    );

const recipeCarencia =
    document.getElementById(
        "recipe-carencia"
    );

const recipeReentrada =
    document.getElementById(
        "recipe-reentrada"
    );


// ======================================================
// AUTENTICACIÓN - ESTADO
// ======================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            esAdmin = true;

            if (btnOpenLogin) {
                btnOpenLogin.style.display =
                    "none";
            }

            if (adminLoggedInfo) {
                adminLoggedInfo.style.display =
                    "inline-block";
            }

            if (sectionFormContainer) {
                sectionFormContainer.style.display =
                    "block";
            }

        } else {

            esAdmin = false;

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

        calcularMetricasYRender();

    }
);


// ======================================================
// ABRIR LOGIN
// ======================================================

if (
    btnOpenLogin &&
    loginModal
) {

    btnOpenLogin.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            loginModal.style.display =
                "flex";

        }
    );

}


// ======================================================
// CERRAR LOGIN
// ======================================================

if (
    btnCloseLogin &&
    loginModal
) {

    btnCloseLogin.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            loginModal.style.display =
                "none";

        }
    );

}


// ======================================================
// LOGIN FIREBASE
// ======================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                document.getElementById(
                    "login-email"
                )?.value
                ?.trim();

            const password =
                document.getElementById(
                    "login-password"
                )?.value;


            if (
                !email ||
                !password
            ) {

                alert(
                    "Ingresa correo y contraseña."
                );

                return;

            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                if (loginModal) {

                    loginModal.style.display =
                        "none";

                }


                loginForm.reset();


                alert(
                    "¡Bienvenido Modo Administrador!"
                );


            } catch (error) {

                console.error(
                    "ERROR FIREBASE AUTH:",
                    error
                );


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

                await signOut(
                    auth
                );

                alert(
                    "Sesión cerrada."
                );

            } catch (error) {

                console.error(
                    "Error al cerrar sesión:",
                    error
                );

            }

        }
    );

}


// ======================================================
// CAMBIO DE TIPO DE PRODUCTO
// ======================================================

if (tipoRegistroSelect) {

    tipoRegistroSelect.addEventListener(
        "change",
        (event) => {

            alternarCamposFormulario(
                event.target.value
            );

        }
    );

}


function alternarCamposFormulario(
    tipo
) {

    if (
        tipo === "bio"
    ) {

        if (sectionFormBio) {

            sectionFormBio.style.display =
                "block";

        }

        if (sectionFormQuimico) {

            sectionFormQuimico.style.display =
                "none";

        }

    } else {

        if (sectionFormBio) {

            sectionFormBio.style.display =
                "none";

        }

        if (sectionFormQuimico) {

            sectionFormQuimico.style.display =
                "block";

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

            mundoActual =
                "bio";

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

            filtroFuncionActual =
                "todos";

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

            mundoActual =
                "quimico";

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

            filtroFuncionActual =
                "todos";

            resetearFiltrosBotones();

            calcularMetricasYRender();

        }
    );

}


// ======================================================
// FILTROS
// ======================================================

function resetearFiltrosBotones() {

    filterButtons.forEach(
        (
            button,
            index
        ) => {

            if (
                index === 0
            ) {

                button.style.background =
                    "#81c784";

            } else {

                button.style.background =
                    "#f1f8e9";

            }

        }
    );

}


filterButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            (event) => {

                filtroFuncionActual =
                    event.currentTarget
                        .getAttribute(
                            "data-funcion"
                        );

                filterButtons.forEach(
                    (btn) => {

                        btn.style.background =
                            "#f1f8e9";

                    }
                );

                event.currentTarget.style.background =
                    "#81c784";

                calcularMetricasYRender();

            }
        );

    }
);


// ======================================================
// FIREBASE - ESCUCHA EN TIEMPO REAL
// ======================================================

onSnapshot(
    query(recetasRef),
    (snapshot) => {

        todosLosDatos = [];

        snapshot.forEach(
            (snapshotDoc) => {

                todosLosDatos.push(
                    {
                        id:
                            snapshotDoc.id,

                        ...snapshotDoc.data()

                    }
                );

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
// DOSIFICACIÓN - UNIDAD
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
// DOSIFICACIÓN - FORMATO
// ======================================================

function formatearNumero(
    numero
) {

    if (
        Number.isInteger(
            numero
        )
    ) {

        return String(
            numero
        );

    }

    return Number(
        numero.toFixed(4)
    )
        .toString();

}


// ======================================================
// DOSIFICACIÓN - TABLA
// ======================================================

function actualizarTablaDosis() {

    if (
        !doseLow ||
        !doseHigh
    ) {

        return;

    }


    const baja =
        parseFloat(
            doseLow.value
        );

    const alta =
        parseFloat(
            doseHigh.value
        );

    const unidad =
        obtenerUnidadDosis();


    const datosValidos =
        Number.isFinite(baja) &&
        Number.isFinite(alta) &&
        baja >= 0 &&
        alta >= 0 &&
        unidad !== "";


    if (
        !datosValidos
    ) {

        if (doseTableWrapper) {

            doseTableWrapper.style.display =
                "none";

        }

        if (doseValidationMessage) {

            doseValidationMessage.style.display =
                "block";

            doseValidationMessage.textContent =
                "Ingresa la dosis baja, la dosis alta y selecciona la unidad de medida.";

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


    const litros =
        [
            1,
            15,
            100,
            160
        ];


    litros.forEach(
        (litrosAgua) => {

            const valorBaja =
                (
                    baja *
                    litrosAgua /
                    100
                );

            const valorAlta =
                (
                    alta *
                    litrosAgua /
                    100
                );


            const celdaBaja =
                document.getElementById(
                    `dose-low-${litrosAgua}`
                );

            const celdaAlta =
                document.getElementById(
                    `dose-high-${litrosAgua}`
                );


            if (celdaBaja) {

                celdaBaja.textContent =
                    `${formatearNumero(valorBaja)} ${unidad}`;

            }


            if (celdaAlta) {

                celdaAlta.textContent =
                    `${formatearNumero(valorAlta)} ${unidad}`;

            }

        }
    );


    if (doseConfirmationSummary) {

        doseConfirmationSummary.innerHTML =
            `
            <strong>Resumen de dosificación</strong><br>
            Referencia: 100 L de agua<br>
            Preventivo (baja):
            <strong>${formatearNumero(baja)} ${unidad}</strong><br>
            Curativo (alta):
            <strong>${formatearNumero(alta)} ${unidad}</strong>
            `;

    }


    // Cada modificación obliga a confirmar nuevamente.

    dosisConfirmada =
        false;

    if (doseConfirmStatus) {

        doseConfirmStatus.style.display =
            "none";

    }

}


// ======================================================
// EVENTOS DOSIFICACIÓN
// ======================================================

if (doseLow) {

    doseLow.addEventListener(
        "input",
        actualizarTablaDosis
    );

}


if (doseHigh) {

    doseHigh.addEventListener(
        "input",
        actualizarTablaDosis
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
                actualizarTablaDosis
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

            const baja =
                parseFloat(
                    doseLow?.value
                );

            const alta =
                parseFloat(
                    doseHigh?.value
                );

            const unidad =
                obtenerUnidadDosis();


            if (
                !Number.isFinite(baja) ||
                !Number.isFinite(alta) ||
                !unidad
            ) {

                alert(
                    "Completa primero la dosis baja, la dosis alta y la unidad."
                );

                return;

            }


            if (
                baja < 0 ||
                alta < 0
            ) {

                alert(
                    "Las dosis no pueden ser negativas."
                );

                return;

            }


            dosisConfirmada =
                true;


            if (doseConfirmStatus) {

                doseConfirmStatus.style.display =
                    "block";

            }


            if (doseValidationMessage) {

                doseValidationMessage.style.display =
                    "none";

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


            if (doseValidationMessage) {

                doseValidationMessage.style.display =
                    "block";

                doseValidationMessage.textContent =
                    "Puedes modificar las dosificaciones. Después deberás volver a confirmarlas.";

            }

        }
    );

}


// ======================================================
// CONSTRUIR TEXTO DE DOSIS
// ======================================================

function construirTextoDosis() {

    const baja =
        parseFloat(
            doseLow?.value
        );

    const alta =
        parseFloat(
            doseHigh?.value
        );

    const unidad =
        obtenerUnidadDosis();


    if (
        !Number.isFinite(baja) ||
        !Number.isFinite(alta) ||
        !unidad
    ) {

        return "";

    }


    return (
        `100 L = ` +
        `${formatearNumero(baja)} ${unidad} preventivo / ` +
        `${formatearNumero(alta)} ${unidad} curativo`
    );

}


// ======================================================
// TABLA DE DOSIS PARA LAS TARJETAS
// ======================================================

function generarTablaDosisHTML(
    registro
) {

    const baja =
        parseFloat(
            registro.dosis_baja
        );

    const alta =
        parseFloat(
            registro.dosis_alta
        );

    const unidad =
        registro.unidad_dosis ||
        "";


    if (
        !Number.isFinite(baja) ||
        !Number.isFinite(alta) ||
        !unidad
    ) {

        return `
            <div style="
                margin-top:10px;
                padding:10px;
                background:#f5f5f5;
                border-radius:6px;
            ">
                <strong>Dosificación:</strong>
                No registrada.
            </div>
        `;

    }


    const litros =
        [
            1,
            15,
            100,
            160
        ];


    let filas =
        "";


    litros.forEach(
        (litrosAgua) => {

            const valorBaja =
                baja *
                litrosAgua /
                100;

            const valorAlta =
                alta *
                litrosAgua /
                100;


            filas +=
                `
                <tr>
                    <td>
                        <strong>
                            ${litrosAgua} L
                        </strong>
                    </td>

                    <td>
                        ${formatearNumero(valorBaja)}
                        ${unidad}
                    </td>

                    <td>
                        ${formatearNumero(valorAlta)}
                        ${unidad}
                    </td>
                </tr>
                `;

        }
    );


    return `
        <div style="margin-top:12px;">

            <strong>
                Dosificación
            </strong>

            <div
                class="tabla-dosis-container"
                style="
                    overflow-x:auto;
                    margin-top:8px;
                "
            >

                <table
                    class="tabla-dosis"
                    style="
                        width:100%;
                        border-collapse:collapse;
                    "
                >

                    <thead>

                        <tr>

                            <th>
                                Agua
                            </th>

                            <th>
                                Preventivo
                                (Baja)
                            </th>

                            <th>
                                Curativo
                                (Alta)
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${filas}

                    </tbody>

                </table>

            </div>

        </div>
    `;

}


// ======================================================
// MÉTRICAS Y RENDER
// ======================================================

function calcularMetricasYRender() {

    const datosDelMundo =
        todosLosDatos.filter(
            (registro) =>
                (
                    registro.tipo_registro ||
                    "bio"
                ) === mundoActual
        );


    if (statTotal) {

        statTotal.textContent =
            datosDelMundo.length;

    }


    let condicionalContador =
        0;


    datosDelMundo.forEach(
        (registro) => {

            if (
                mundoActual === "bio" &&
                registro.efectividad ===
                    "Eficacia Alta"
            ) {

                condicionalContador++;

            }


            if (
                mundoActual === "quimico" &&
                Array.isArray(
                    registro.modo_accion
                ) &&
                registro.modo_accion.includes(
                    "sistemico"
                )
            ) {

                condicionalContador++;

            }

        }
    );


    const badgeAlta =
        document.getElementById(
            "stat-alta"
        );


    if (badgeAlta) {

        badgeAlta.textContent =
            condicionalContador;

    }


    if (!recipesContainer) {

        return;

    }


    const busqueda =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    recipesContainer.innerHTML =
        "";


    const filtrados =
        datosDelMundo.filter(
            (registro) => {

                const nombre =
                    String(
                        registro.nombre ||
                        ""
                    )
                        .toLowerCase();


                const ingrediente =
                    String(
                        registro.ingrediente_activo ||
                        ""
                    )
                        .toLowerCase();


                const plagas =
                    Array.isArray(
                        registro.plagas_objetivo
                    )
                        ? registro.plagas_objetivo
                        : [];


                const textoPlagas =
                    plagas
                        .join(" ")
                        .toLowerCase();


                const coincideTexto =
                    nombre.includes(
                        busqueda
                    ) ||
                    ingrediente.includes(
                        busqueda
                    ) ||
                    textoPlagas.includes(
                        busqueda
                    );


                const coincideFuncion =
                    filtroFuncionActual ===
                        "todos" ||

                    (
                        Array.isArray(
                            registro.funcion
                        ) &&
                        registro.funcion.includes(
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
        filtrados.length ===
        0
    ) {

        recipesContainer.innerHTML =
            `
            <p class="loading-text">
                No se encontraron productos registrados.
            </p>
            `;

        return;

    }


    filtrados.forEach(
        (registro) => {

            const card =
                document.createElement(
                    "div"
                );


            const esQuimico =
                registro.tipo_registro ===
                "quimico";


            card.className =
                `recipe-card ${
                    esQuimico
                        ? "card-qui"
                        : "card-bio"
                }`;


            const funciones =
                Array.isArray(
                    registro.funcion
                )
                    ? registro.funcion
                    : [];


            const tagsHTML =
                funciones
                    .map(
                        (funcion) =>
                            `
                            <span class="tag ${
                                esQuimico
                                    ? "tag-qui-label"
                                    : ""
                            }">
                                ${funcion}
                            </span>
                            `
                    )
                    .join("");


            const plagas =
                Array.isArray(
                    registro.plagas_objetivo
                )
                    ? registro.plagas_objetivo
                    : [];


            const plagasHTML =
                plagas.length > 0
                    ? `
                        <p
                            style="
                                font-size:13px;
                                color:#555;
                            "
                        >
                            <strong>
                                Plagas / Enfermedades:
                            </strong>
                            ${plagas.join(", ")}
                        </p>
                    `
                    : "";


            const botonesAccion =
                esAdmin
                    ? `
                        <div
                            class="action-buttons"
                        >

                            <button
                                class="btn-action btn-edit"
                                data-id="${registro.id}"
                                type="button"
                            >
                                ✏️
                            </button>

                            <button
                                class="btn-action btn-delete"
                                data-id="${registro.id}"
                                type="button"
                            >
                                🗑️
                            </button>

                        </div>
                    `
                    : "";


            if (esQuimico) {

                const modos =
                    Array.isArray(
                        registro.modo_accion
                    )
                        ? registro.modo_accion.join(
                            ", "
                        )
                        : "No especificado";


                card.innerHTML =
                    `
                    ${botonesAccion}

                    <h3
                        class="qui-title"
                    >
                        ${registro.nombre || ""}
                    </h3>


                    <div
                        style="
                            margin-bottom:8px;
                        "
                    >
                        ${tagsHTML}
                    </div>


                    <div
                        class="info-box-qui"
                    >

                        <p>
                            <strong>
                                I. Activo:
                            </strong>

                            ${
                                registro.ingrediente_activo ||
                                "No especificado"
                            }
                        </p>


                        <p>
                            <strong>
                                Concentración:
                            </strong>

                            ${
                                registro.concentracion ||
                                "No especificada"
                            }
                        </p>


                        <p>
                            <strong>
                                Modo Acción:
                            </strong>

                            ${modos}
                        </p>

                    </div>


                    ${generarTablaDosisHTML(
                        registro
                    )}


                    ${plagasHTML}


                    <button
                        class="btn-toggle qui-toggle"
                        data-id="${registro.id}"
                        type="button"
                    >
                        Ver Carencia y Reentrada
                    </button>


                    <div
                        class="extra-content"
                        id="extra-${registro.id}"
                        style="display:none;"
                    >

                        <p>
                            <strong>
                                Período de Carencia:
                            </strong>

                            ${
                                registro.carencia ||
                                "No indicado"
                            }
                        </p>


                        <p>
                            <strong>
                                Seguridad de Reentrada:
                            </strong>

                            ${
                                registro.reentrada ||
                                "No indicado"
                            }
                        </p>

                    </div>
                    `;

            } else {

                const contraHTML =
                    registro.contraindicacion
                        ? `
                            <div
                                class="warning-box"
                            >
                                ⚠️
                                ${registro.contraindicacion}
                            </div>
                        `
                        : "";


                card.innerHTML =
                    `
                    ${botonesAccion}

                    <h3>
                        ${registro.nombre || ""}
                    </h3>


                    <div
                        style="
                            margin-bottom:8px;
                        "
                    >

                        ${tagsHTML}

                        <span
                            class="tag-efectividad"
                        >
                            ${
                                registro.efectividad ||
                                "En evaluación"
                            }
                        </span>

                    </div>


                    ${generarTablaDosisHTML(
                        registro
                    )}


                    ${contraHTML}


                    ${plagasHTML}


                    <button
                        class="btn-toggle"
                        data-id="${registro.id}"
                        type="button"
                    >
                        Ver Preparación e Ingredientes
                    </button>


                    <div
                        class="extra-content"
                        id="extra-${registro.id}"
                        style="display:none;"
                    >

                        <p>
                            <strong>
                                Ingredientes:
                            </strong>

                            ${
                                registro.ingredientes ||
                                "No especificados"
                            }
                        </p>


                        <p>
                            <strong>
                                Preparación:
                            </strong>

                            ${
                                registro.preparacion ||
                                "No especificada"
                            }
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

}


// ======================================================
// EVENTOS DE TARJETAS
// ======================================================

function asignarEventosTarjetas() {

    document
        .querySelectorAll(
            ".btn-toggle"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    (event) => {

                        const id =
                            event.currentTarget
                                .getAttribute(
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


                            event.currentTarget.textContent =
                                event.currentTarget.classList.contains(
                                    "qui-toggle"
                                )
                                    ? "Ver Carencia y Reentrada"
                                    : "Ver Preparación e Ingredientes";

                        } else {

                            panel.style.display =
                                "block";


                            event.currentTarget.textContent =
                                "Ocultar Detalles";

                        }

                    }
                );

            }
        );


    if (!esAdmin) {

        return;

    }


    document
        .querySelectorAll(
            ".btn-edit"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    (event) => {

                        const id =
                            event.currentTarget
                                .getAttribute(
                                    "data-id"
                                );


                        const item =
                            todosLosDatos.find(
                                (registro) =>
                                    registro.id === id
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
            (button) => {

                button.addEventListener(
                    "click",
                    async (event) => {

                        const id =
                            event.currentTarget
                                .getAttribute(
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

                        } catch (error) {

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


// ======================================================
// CARGAR PRODUCTO PARA EDITAR
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


    if (recipeId) {

        recipeId.value =
            item.id;

    }


    if (tipoRegistroSelect) {

        tipoRegistroSelect.value =
            item.tipo_registro ||
            "bio";

        alternarCamposFormulario(
            tipoRegistroSelect.value
        );

    }


    if (recipeName) {

        recipeName.value =
            item.nombre ||
            "";

    }


    if (recipeApp) {

        recipeApp.value =
            item.modo_aplicacion ||
            "";

    }


    if (recipePlagas) {

        recipePlagas.value =
            Array.isArray(
                item.plagas_objetivo
            )
                ? item.plagas_objetivo.join(
                    ", "
                )
                : "";

    }


    document
        .querySelectorAll(
            'input[name="funcion"]'
        )
        .forEach(
            (checkbox) => {

                checkbox.checked =
                    Array.isArray(
                        item.funcion
                    ) &&
                    item.funcion.includes(
                        checkbox.value
                    );

            }
        );


    if (
        (
            item.tipo_registro ||
            "bio"
        ) ===
        "bio"
    ) {

        const efectividad =
            document.getElementById(
                "recipe-efectividad"
            );

        const contra =
            document.getElementById(
                "recipe-contra"
            );

        const ingredientes =
            document.getElementById(
                "recipe-ingredients"
            );

        const preparacion =
            document.getElementById(
                "recipe-prep"
            );


        if (efectividad) {

            efectividad.value =
                item.efectividad ||
                "En fase de evaluación";

        }


        if (contra) {

            contra.value =
                item.contraindicacion ||
                "";

        }


        if (ingredientes) {

            ingredientes.value =
                item.ingredientes ||
                "";

        }


        if (preparacion) {

            preparacion.value =
                item.preparacion ||
                "";

        }

    } else {

        if (recipeActivo) {

            recipeActivo.value =
                item.ingrediente_activo ||
                "";

        }


        if (recipeConcentracion) {

            recipeConcentracion.value =
                item.concentracion ||
                "";

        }


        if (recipeCarencia) {

            recipeCarencia.value =
                item.carencia ||
                "";

        }


        if (recipeReentrada) {

            recipeReentrada.value =
                item.reentrada ||
                "";

        }


        document
            .querySelectorAll(
                'input[name="modo_accion"]'
            )
            .forEach(
                (checkbox) => {

                    checkbox.checked =
                        Array.isArray(
                            item.modo_accion
                        ) &&
                        item.modo_accion.includes(
                            checkbox.value
                        );

                }
            );

    }


    if (doseWater) {

        doseWater.value =
            "100";

    }


    if (doseLow) {

        doseLow.value =
            item.dosis_baja ??
            "";

    }


    if (doseHigh) {

        doseHigh.value =
            item.dosis_alta ??
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
                    item.unidad_dosis;

            }
        );


    dosisConfirmada =
        Boolean(
            item.dosis_confirmada
        );


    actualizarTablaDosis();


    if (
        dosisConfirmada &&
        doseConfirmStatus
    ) {

        doseConfirmStatus.style.display =
            "block";

    }


    if (recipeForm) {

        recipeForm.scrollIntoView(
            {
                behavior:
                    "smooth"
            }
        );

    }

}


// ======================================================
// GUARDAR / ACTUALIZAR
// ======================================================

if (recipeForm) {

    recipeForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!esAdmin) {

                alert(
                    "Acceso denegado: debes ser Administrador."
                );

                return;

            }


            // ------------------------------------------
            // VALIDAR DOSIFICACIÓN
            // ------------------------------------------

            const baja =
                parseFloat(
                    doseLow?.value
                );

            const alta =
                parseFloat(
                    doseHigh?.value
                );

            const unidad =
                obtenerUnidadDosis();


            if (
                !Number.isFinite(baja) ||
                !Number.isFinite(alta) ||
                !unidad
            ) {

                alert(
                    "Debes ingresar la dosis baja, la dosis alta y seleccionar la unidad."
                );

                return;

            }


            if (
                !dosisConfirmada
            ) {

                alert(
                    "Debes confirmar que las dosificaciones ingresadas son correctas."
                );

                return;

            }


            // ------------------------------------------
            // DATOS BÁSICOS
            // ------------------------------------------

            const id =
                recipeId?.value ||
                "";

            const tipo =
                tipoRegistroSelect?.value ||
                mundoActual;


            const funciones =
                [];


            document
                .querySelectorAll(
                    'input[name="funcion"]:checked'
                )
                .forEach(
                    (checkbox) => {

                        funciones.push(
                            checkbox.value
                        );

                    }
                );


            // ------------------------------------------
            // PLAGAS
            // ------------------------------------------
            //
            // Por ahora index.html tiene un campo único.
            //
            // En el siguiente paso lo cambiaremos
            // a Plaga 1 / 2 / 3 / 4.
            //
            // Este bloque ya guarda el resultado
            // como arreglo.
            // ------------------------------------------

            const plagasTexto =
                recipePlagas?.value ||
                "";


            const plagasArray =
                plagasTexto
                    .split(",")
                    .map(
                        (plaga) =>
                            plaga.trim()
                    )
                    .filter(
                        (plaga) =>
                            plaga !== ""
                    );


            // ------------------------------------------
            // DATOS COMUNES
            // ------------------------------------------

            const datos = {

                tipo_registro:
                    tipo,

                nombre:
                    recipeName?.value
                        ?.trim() ||
                    "",

                funcion:
                    funciones,

                plagas_objetivo:
                    plagasArray,

                dosis_baja:
                    baja,

                dosis_alta:
                    alta,

                unidad_dosis:
                    unidad,

                agua_referencia:
                    100,

                dosis_confirmada:
                    true,

                modo_aplicacion:
                    construirTextoDosis(),

                actualizado_el:
                    new Date()
                        .toISOString()

            };


            // ------------------------------------------
            // MUNDO BIO
            // ------------------------------------------

            if (
                tipo ===
                "bio"
            ) {

                const efectividad =
                    document.getElementById(
                        "recipe-efectividad"
                    );

                const contra =
                    document.getElementById(
                        "recipe-contra"
                    );

                const ingredientes =
                    document.getElementById(
                        "recipe-ingredients"
                    );

                const preparacion =
                    document.getElementById(
                        "recipe-prep"
                    );


                datos.efectividad =
                    efectividad?.value ||
                    "En fase de evaluación";


                datos.contraindicacion =
                    contra?.value
                        ?.trim() ||
                    "";


                datos.ingredientes =
                    ingredientes?.value
                        ?.trim() ||
                    "";


                datos.preparacion =
                    preparacion?.value
                        ?.trim() ||
                    "";

            }


            // ------------------------------------------
            // MUNDO QUÍMICO
            // ------------------------------------------

            else {

                const modos =
                    [];


                document
                    .querySelectorAll(
                        'input[name="modo_accion"]:checked'
                    )
                    .forEach(
                        (checkbox) => {

                            modos.push(
                                checkbox.value
                            );

                        }
                    );


                datos.ingrediente_activo =
                    recipeActivo?.value
                        ?.trim() ||
                    "";


                datos.concentracion =
                    recipeConcentracion?.value
                        ?.trim() ||
                    "";


                datos.modo_accion =
                    modos;


                datos.carencia =
                    recipeCarencia?.value
                        ?.trim() ||
                    "";


                datos.reentrada =
                    recipeReentrada?.value
                        ?.trim() ||
                    "";

            }


            // ------------------------------------------
            // GUARDAR
            // ------------------------------------------

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
                    "Error Firebase:",
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


    if (recipeId) {

        recipeId.value =
            "";

    }


    if (recipeForm) {

        recipeForm.reset();

    }


    if (doseWater) {

        doseWater.value =
            "100";

    }


    dosisConfirmada =
        false;


    if (doseTableWrapper) {

        doseTableWrapper.style.display =
            "none";

    }


    if (doseConfirmStatus) {

        doseConfirmStatus.style.display =
            "none";

    }


    if (doseValidationMessage) {

        doseValidationMessage.style.display =
            "none";

    }


    if (tipoRegistroSelect) {

        tipoRegistroSelect.value =
            mundoActual;

        alternarCamposFormulario(
            mundoActual
        );

    }

}


// ======================================================
// CANCELAR EDICIÓN
// ======================================================

if (btnFormCancel) {

    btnFormCancel.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            resetearFormulario();

        }
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
// ESCÁNER DE ETIQUETA
// ======================================================
//
// IMPORTANTE:
//
// app.js NO llama directamente a Gemini,
// OpenRouter ni ninguna API de IA.
//
// Todo pasa por:
//      analizarEtiqueta(file)
//              ↓
//             ia.js
//              ↓
//      servidor de IA
//
// ======================================================

if (
    btnTriggerAI &&
    aiImageInput
) {

    btnTriggerAI.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            aiImageInput.click();

        }
    );


    aiImageInput.addEventListener(
        "change",
        async (event) => {

            const file =
                event.target.files?.[0];


            if (!file) {

                return;

            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Por favor selecciona una imagen válida."
                );

                aiImageInput.value =
                    "";

                return;

            }


            if (aiLoading) {

                aiLoading.style.display =
                    "block";

            }


            btnTriggerAI.disabled =
                true;


            try {

                console.log(
                    "===================================="
                );

                console.log(
                    "BIO IA - INICIO ANÁLISIS"
                );

                console.log(
                    "Imagen:",
                    file.name
                );

                console.log(
                    "Tipo:",
                    file.type
                );

                console.log(
                    "===================================="
                );


                const resultado =
                    await analizarEtiqueta(
                        file
                    );


                console.log(
                    "BIO IA - RESULTADO:",
                    resultado
                );


                if (
                    !resultado ||
                    resultado.ok !== true
                ) {

                    throw new Error(
                        resultado?.mensaje ||
                        "La IA no devolvió información válida."
                    );

                }


                const datos =
                    resultado.datos ||
                    {};


                // --------------------------------------
                // TIPO DE REGISTRO
                // --------------------------------------

                const tipo =
                    datos.tipo_registro ||
                    "quimico";


                if (
                    tipoRegistroSelect
                ) {

                    tipoRegistroSelect.value =
                        tipo;

                    alternarCamposFormulario(
                        tipo
                    );

                }


                // --------------------------------------
                // NOMBRE
                // --------------------------------------

                if (
                    recipeName
                ) {

                    recipeName.value =
                        datos.nombre ||
                        "";

                }


                // --------------------------------------
                // INGREDIENTE ACTIVO
                // --------------------------------------

                if (
                    recipeActivo
                ) {

                    recipeActivo.value =
                        datos.ingrediente_activo ||
                        "";

                }


                // --------------------------------------
                // CONCENTRACIÓN
                // --------------------------------------

                if (
                    recipeConcentracion
                ) {

                    recipeConcentracion.value =
                        datos.concentracion ||
                        "";

                }


                // --------------------------------------
                // FUNCIÓN
                // --------------------------------------

                const funcionesIA =
                    Array.isArray(
                        datos.funcion
                    )
                        ? datos.funcion
                            .map(
                                (valor) =>
                                    String(
                                        valor
                                    )
                                        .toLowerCase()
                            )
                        : [];


                document
                    .querySelectorAll(
                        'input[name="funcion"]'
                    )
                    .forEach(
                        (checkbox) => {

                            checkbox.checked =
                                funcionesIA.includes(
                                    String(
                                        checkbox.value
                                    )
                                        .toLowerCase()
                                );

                        }
                    );


                // --------------------------------------
                // MODO DE ACCIÓN
                // --------------------------------------

                const modosIA =
                    Array.isArray(
                        datos.modo_accion
                    )
                        ? datos.modo_accion
                            .map(
                                (valor) =>
                                    String(
                                        valor
                                    )
                                        .toLowerCase()
                            )
                        : [];


                document
                    .querySelectorAll(
                        'input[name="modo_accion"]'
                    )
                    .forEach(
                        (checkbox) => {

                            checkbox.checked =
                                modosIA.includes(
                                    String(
                                        checkbox.value
                                    )
                                        .toLowerCase()
                                );

                        }
                    );


                // --------------------------------------
                // MUY IMPORTANTE
                // --------------------------------------
                //
                // NO hacemos:
                //
                // plagas = IA
                // dosis = IA
                // carencia = IA
                // reentrada = IA
                //
                // Esos campos pertenecen al agricultor.
                // --------------------------------------


                if (recipePlagas) {

                    recipePlagas.value =
                        "";

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


                if (recipeCarencia) {

                    recipeCarencia.value =
                        "";

                }


                if (recipeReentrada) {

                    recipeReentrada.value =
                        "";

                }


                dosisConfirmada =
                    false;


                if (doseTableWrapper) {

                    doseTableWrapper.style.display =
                        "none";

                }


                if (doseConfirmStatus) {

                    doseConfirmStatus.style.display =
                        "none";

                }


                // --------------------------------------
                // MENSAJE FINAL
                // --------------------------------------

                alert(
                    "Producto identificado correctamente. Ahora ingresa manualmente la plaga, dosis, unidad, carencia y reingreso."
                );


            } catch (error) {

                console.error(
                    "ERROR ANALIZANDO ETIQUETA:",
                    error
                );


                alert(
                    "No se pudo extraer la información automáticamente: " +
                    (
                        error?.message ||
                        error
                    )
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
// INICIALIZACIÓN
// ======================================================

alternarCamposFormulario(
    tipoRegistroSelect?.value ||
    mundoActual
);


actualizarTablaDosis();


console.log(
    "===================================="
);

console.log(
    "BIO IA APP.JS CARGADO CORRECTAMENTE"
);

console.log(
    "IA directa desde navegador: DESACTIVADA"
);

console.log(
    "IA mediante ia.js: ACTIVADA"
);

console.log(
    "Dosis manuales: ACTIVADAS"
);

console.log(
    "Confirmación de dosis: ACTIVADA"
);

console.log(
    "===================================="
);
