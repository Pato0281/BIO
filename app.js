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

const recetasRef = collection(
    db,
    "recetas"
);


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

const recipesContainer =
    document.getElementById("recipes-container");

const searchInput =
    document.getElementById("search-input");

const filterButtons =
    document.querySelectorAll(".btn-filter");

const sectionFormContainer =
    document.querySelector(".form-section");

const recipeForm =
    document.getElementById("recipe-form");

const formTitle =
    document.getElementById("form-title");

const btnFormSubmit =
    document.getElementById("btn-form-submit");

const btnFormCancel =
    document.getElementById("btn-form-cancel");

const tipoRegistroSelect =
    document.getElementById("form-tipo-registro");

const sectionFormBio =
    document.getElementById("section-form-bio");

const sectionFormQuimico =
    document.getElementById("section-form-quimico");

const recipeId =
    document.getElementById("recipe-id");

const recipeName =
    document.getElementById("recipe-name");

const recipeActivo =
    document.getElementById("recipe-activo");

const recipeConcentracion =
    document.getElementById("recipe-concentracion");

const recipeCarencia =
    document.getElementById("recipe-carencia");

const recipeReentrada =
    document.getElementById("recipe-reentrada");


// ======================================================
// LOGIN
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
// IA
// ======================================================

const btnTriggerAI =
    document.getElementById("btn-trigger-ai");

const aiImageInput =
    document.getElementById("ai-image-input");

const aiLoading =
    document.getElementById("ai-loading");


// ======================================================
// DOSIFICACIÓN
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
// UNIDAD
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
// NÚMEROS
// ======================================================

function formatearNumero(numero) {

    if (
        Number.isInteger(numero)
    ) {

        return String(numero);

    }

    return Number(
        numero.toFixed(4)
    ).toString();

}


// ======================================================
// PLAGAS 1-4
// ======================================================

function obtenerPlagasFormulario() {

    const plagas = [];

    for (
        let i = 1;
        i <= 4;
        i++
    ) {

        const campo =
            document.getElementById(
                `recipe-plaga-${i}`
            );

        if (
            campo &&
            campo.value.trim() !== ""
        ) {

            plagas.push(
                campo.value.trim()
            );

        }

    }

    return plagas;

}


// ======================================================
// CARGAR PLAGAS
// ======================================================

function cargarPlagasFormulario(
    plagas
) {

    const lista =
        Array.isArray(plagas)
            ? plagas
            : [];

    for (
        let i = 1;
        i <= 4;
        i++
    ) {

        const campo =
            document.getElementById(
                `recipe-plaga-${i}`
            );

        if (campo) {

            campo.value =
                lista[i - 1] || "";

        }

    }

}


// ======================================================
// CAMBIAR BIO / QUÍMICO
// ======================================================

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


if (tipoRegistroSelect) {

    tipoRegistroSelect.addEventListener(
        "change",
        event => {

            alternarCamposFormulario(
                event.target.value
            );

        }
    );

}


// ======================================================
// AUTENTICACIÓN
// ======================================================

onAuthStateChanged(
    auth,
    user => {

        esAdmin =
            Boolean(user);

        if (btnOpenLogin) {

            btnOpenLogin.style.display =
                user
                    ? "none"
                    : "inline-block";

        }

        if (adminLoggedInfo) {

            adminLoggedInfo.style.display =
                user
                    ? "inline-block"
                    : "none";

        }

        if (sectionFormContainer) {

            sectionFormContainer.style.display =
                user
                    ? "block"
                    : "none";

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

                loginModal.style.display =
                    "flex";

            }

        }
    );

}


if (btnCloseLogin) {

    btnCloseLogin.addEventListener(
        "click",
        () => {

            if (loginModal) {

                loginModal.style.display =
                    "none";

            }

        }
    );

}


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const email =
                document.getElementById(
                    "login-email"
                )?.value.trim();

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

                loginModal.style.display =
                    "none";

                loginForm.reset();

            } catch (error) {

                console.error(error);

                alert(
                    "Error de acceso: " +
                    error.message
                );

            }

        }
    );

}


// ======================================================
// CERRAR SESIÓN
// ======================================================

if (btnLogout) {

    btnLogout.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

            } catch (error) {

                console.error(error);

            }

        }
    );

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

            filtroFuncionActual =
                "todos";

            resetearFiltros();

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

            filtroFuncionActual =
                "todos";

            resetearFiltros();

            calcularMetricasYRender();

        }
    );

}


// ======================================================
// FILTROS
// ======================================================

function resetearFiltros() {

    filterButtons.forEach(
        (button, index) => {

            button.style.background =
                index === 0
                    ? "#81c784"
                    : "#f1f8e9";

        }
    );

}


filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                filtroFuncionActual =
                    button.dataset.funcion ||
                    "todos";

                filterButtons.forEach(
                    btn => {

                        btn.style.background =
                            "#f1f8e9";

                    }
                );

                button.style.background =
                    "#81c784";

                calcularMetricasYRender();

            }
        );

    }
);


// ======================================================
// FIRESTORE
// ======================================================
//
// IMPORTANTE:
// Se lee la colección existente.
// NO se crea una colección nueva.
// NO se borran registros.
// ======================================================

onSnapshot(
    query(recetasRef),

    snapshot => {

        todosLosDatos = [];

        snapshot.forEach(
            firestoreDoc => {

                todosLosDatos.push({

                    id:
                        firestoreDoc.id,

                    ...firestoreDoc.data()

                });

            }
        );

        console.log(
            "SANIDADAPP:",
            todosLosDatos.length,
            "registros cargados."
        );

        calcularMetricasYRender();

    },

    error => {

        console.error(
            "ERROR FIRESTORE:",
            error
        );

        if (recipesContainer) {

            recipesContainer.innerHTML = `
                <div class="warning-box">
                    ⚠️ No se pudieron cargar
                    los registros de Firebase.
                    <br><br>
                    <small>
                        ${error.message}
                    </small>
                </div>
            `;

        }

    }
);


// ======================================================
// DOSIFICACIÓN
// ======================================================

function actualizarTablaDosis() {

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

    const valido =
        Number.isFinite(baja) &&
        Number.isFinite(alta) &&
        baja >= 0 &&
        alta >= 0 &&
        unidad !== "";

    if (!valido) {

        if (doseTableWrapper) {

            doseTableWrapper.style.display =
                "none";

        }

        return;

    }

    if (doseTableWrapper) {

        doseTableWrapper.style.display =
            "block";

    }

    [
        1,
        15,
        100,
        160
    ].forEach(
        litros => {

            const bajaCalculada =
                baja *
                litros /
                100;

            const altaCalculada =
                alta *
                litros /
                100;

            const celdaBaja =
                document.getElementById(
                    `dose-low-${litros}`
                );

            const celdaAlta =
                document.getElementById(
                    `dose-high-${litros}`
                );

            if (celdaBaja) {

                celdaBaja.textContent =
                    `${formatearNumero(
                        bajaCalculada
                    )} ${unidad}`;

            }

            if (celdaAlta) {

                celdaAlta.textContent =
                    `${formatearNumero(
                        altaCalculada
                    )} ${unidad}`;

            }

        }
    );

    if (doseConfirmationSummary) {

        doseConfirmationSummary.innerHTML =
            `
            <strong>Resumen de dosificación</strong><br>
            Base: 100 L de agua<br>
            Dosis baja:
            <strong>
                ${formatearNumero(baja)}
                ${unidad}
            </strong><br>
            Dosis alta:
            <strong>
                ${formatearNumero(alta)}
                ${unidad}
            </strong>
            `;

    }

}


doseLow?.addEventListener(
    "input",
    () => {

        dosisConfirmada =
            false;

        actualizarTablaDosis();

    }
);


doseHigh?.addEventListener(
    "input",
    () => {

        dosisConfirmada =
            false;

        actualizarTablaDosis();

    }
);


document
    .querySelectorAll(
        'input[name="dose-unit"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                "change",
                () => {

                    dosisConfirmada =
                        false;

                    actualizarTablaDosis();

                }
            );

        }
    );


// ======================================================
// CONFIRMAR DOSIS
// ======================================================

btnConfirmDoses?.addEventListener(
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
                "Completa las dosificaciones y selecciona la unidad."
            );

            return;

        }

        dosisConfirmada =
            true;

        if (doseConfirmStatus) {

            doseConfirmStatus.style.display =
                "block";

        }

    }
);


// ======================================================
// CORREGIR DOSIS
// ======================================================

btnCancelDoses?.addEventListener(
    "click",
    () => {

        dosisConfirmada =
            false;

        if (doseConfirmStatus) {

            doseConfirmStatus.style.display =
                "none";

        }

    }
);


// ======================================================
// TEXTO DOSIS
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

    return `
100 L = ${formatearNumero(baja)} ${unidad}
preventivo / ${formatearNumero(alta)} ${unidad}
curativo
`.replace(/\n/g, " ").trim();

}


// ======================================================
// TABLA EN LAS TARJETAS
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

    // Registros antiguos
    if (
        !Number.isFinite(baja) ||
        !Number.isFinite(alta) ||
        !unidad
    ) {

        if (
            registro.modo_aplicacion
        ) {

            return `
                <div
                    style="
                        margin-top:10px;
                        padding:10px;
                        background:#f5f5f5;
                        border-radius:6px;
                    "
                >
                    <strong>Dosis:</strong>
                    ${registro.modo_aplicacion}
                </div>
            `;

        }

        return `
            <div
                style="
                    margin-top:10px;
                    padding:10px;
                    background:#f5f5f5;
                    border-radius:6px;
                "
            >
                <strong>Dosis:</strong>
                No registrada.
            </div>
        `;

    }

    let filas = "";

    [
        1,
        15,
        100,
        160
    ].forEach(
        litros => {

            filas += `
                <tr>
                    <td>
                        <strong>
                            ${litros} L
                        </strong>
                    </td>

                    <td>
                        ${formatearNumero(
                            baja * litros / 100
                        )}
                        ${unidad}
                    </td>

                    <td>
                        ${formatearNumero(
                            alta * litros / 100
                        )}
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
                            <th>Agua</th>
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
// MÉTRICAS + RENDER
// ======================================================

function calcularMetricasYRender() {

    if (!recipesContainer) {

        return;

    }

    const datosDelMundo =
        todosLosDatos.filter(
            registro =>
                (
                    registro.tipo_registro ||
                    "bio"
                ) === mundoActual
        );

    if (statTotal) {

        statTotal.textContent =
            datosDelMundo.length;

    }

    let contador =
        0;

    datosDelMundo.forEach(
        registro => {

            if (
                mundoActual === "bio" &&
                registro.efectividad ===
                    "Eficacia Alta"
            ) {

                contador++;

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

                contador++;

            }

        }
    );

    const statAlta =
        document.getElementById(
            "stat-alta"
        );

    if (statAlta) {

        statAlta.textContent =
            contador;

    }

    const textoBusqueda =
        searchInput?.value
            ?.toLowerCase()
            .trim() ||
        "";

    const filtrados =
        datosDelMundo.filter(
            registro => {

                const nombre =
                    String(
                        registro.nombre ||
                        ""
                    ).toLowerCase();

                const activo =
                    String(
                        registro.ingrediente_activo ||
                        ""
                    ).toLowerCase();

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

                const coincideBusqueda =
                    !textoBusqueda ||
                    nombre.includes(
                        textoBusqueda
                    ) ||
                    activo.includes(
                        textoBusqueda
                    ) ||
                    textoPlagas.includes(
                        textoBusqueda
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
                    coincideBusqueda &&
                    coincideFuncion
                );

            }
        );

    recipesContainer.innerHTML =
        "";

    if (
        filtrados.length === 0
    ) {

        recipesContainer.innerHTML =
            `
            <p class="loading-text">
                ${
                    todosLosDatos.length === 0
                        ? "Cargando productos..."
                        : "No se encontraron productos registrados."
                }
            </p>
            `;

        return;

    }

    filtrados.forEach(
        registro => {

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

            const tags =
                funciones
                    .map(
                        funcion =>
                            `
                            <span
                                class="tag ${
                                    esQuimico
                                        ? "tag-qui-label"
                                        : ""
                                }"
                            >
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
                plagas.length
                    ? `
                    <p
                        style="
                            font-size:13px;
                            color:#555;
                        "
                    >
                        <strong>
                            Plagas /
                            Enfermedades:
                        </strong>
                        ${plagas.join(", ")}
                    </p>
                    `
                    : "";

            const botones =
                esAdmin
                    ? `
                    <div class="action-buttons">

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
                    ${botones}

                    <h3 class="qui-title">
                        ${registro.nombre || ""}
                    </h3>

                    <div>
                        ${tags}
                    </div>

                    <div class="info-box-qui">

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

                card.innerHTML =
                    `
                    ${botones}

                    <h3>
                        ${registro.nombre || ""}
                    </h3>

                    <div>
                        ${tags}

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

                    ${
                        registro.contraindicacion
                            ? `
                            <div
                                class="warning-box"
                            >
                                ⚠️
                                ${registro.contraindicacion}
                            </div>
                            `
                            : ""
                    }

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
// EVENTOS TARJETAS
// ======================================================

function asignarEventosTarjetas() {

    document
        .querySelectorAll(
            ".btn-toggle"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        const panel =
                            document.getElementById(
                                `extra-${id}`
                            );

                        if (!panel) {

                            return;

                        }

                        const abierto =
                            panel.style.display ===
                            "block";

                        panel.style.display =
                            abierto
                                ? "none"
                                : "block";

                        button.textContent =
                            abierto
                                ? (
                                    button.classList.contains(
                                        "qui-toggle"
                                    )
                                        ? "Ver Carencia y Reentrada"
                                        : "Ver Preparación e Ingredientes"
                                )
                                : "Ocultar Detalles";

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
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            todosLosDatos.find(
                                registro =>
                                    registro.id ===
                                    button.dataset.id
                            );

                        if (item) {

                            cargarItemFormulario(
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
            button => {

                button.addEventListener(
                    "click",
                    async () => {

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
                                    button.dataset.id
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
// CARGAR PARA EDITAR
// ======================================================

function cargarItemFormulario(
    item
) {

    if (recipeId) {

        recipeId.value =
            item.id;

    }

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

    cargarPlagasFormulario(
        item.plagas_objetivo
    );

    document
        .querySelectorAll(
            'input[name="funcion"]'
        )
        .forEach(
            checkbox => {

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
        item.tipo_registro ===
        "quimico"
    ) {

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
                checkbox => {

                    checkbox.checked =
                        Array.isArray(
                            item.modo_accion
                        ) &&
                        item.modo_accion.includes(
                            checkbox.value
                        );

                }
            );

    } else {

        document.getElementById(
            "recipe-efectividad"
        ).value =
            item.efectividad ||
            "En fase de evaluación";

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
            radio => {

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

    recipeForm?.scrollIntoView({
        behavior: "smooth"
    });

}


// ======================================================
// GUARDAR
// ======================================================

recipeForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (!esAdmin) {

            alert(
                "Debes iniciar sesión como administrador."
            );

            return;

        }

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
                "Completa las dosis y la unidad."
            );

            return;

        }

        if (!dosisConfirmada) {

            alert(
                "Debes confirmar las dosificaciones."
            );

            return;

        }

        const tipo =
            tipoRegistroSelect?.value ||
            mundoActual;

        const funciones = [];

        document
            .querySelectorAll(
                'input[name="funcion"]:checked'
            )
            .forEach(
                checkbox => {

                    funciones.push(
                        checkbox.value
                    );

                }
            );

        const datos = {

            tipo_registro:
                tipo,

            nombre:
                recipeName?.value.trim() ||
                "",

            funcion:
                funciones,

            // ==========================================
            // AHORA SON 4 CAMPOS INDEPENDIENTES
            // ==========================================

            plagas_objetivo:
                obtenerPlagasFormulario(),

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
                new Date().toISOString()

        };


        if (
            tipo === "bio"
        ) {

            datos.efectividad =
                document.getElementById(
                    "recipe-efectividad"
                )?.value ||
                "En fase de evaluación";

            datos.contraindicacion =
                document.getElementById(
                    "recipe-contra"
                )?.value.trim() ||
                "";

            datos.ingredientes =
                document.getElementById(
                    "recipe-ingredients"
                )?.value.trim() ||
                "";

            datos.preparacion =
                document.getElementById(
                    "recipe-prep"
                )?.value.trim() ||
                "";

        } else {

            const modos = [];

            document
                .querySelectorAll(
                    'input[name="modo_accion"]:checked'
                )
                .forEach(
                    checkbox => {

                        modos.push(
                            checkbox.value
                        );

                    }
                );

            datos.ingrediente_activo =
                recipeActivo?.value.trim() ||
                "";

            datos.concentracion =
                recipeConcentracion?.value.trim() ||
                "";

            datos.modo_accion =
                modos;

            datos.carencia =
                recipeCarencia?.value.trim() ||
                "";

            datos.reentrada =
                recipeReentrada?.value.trim() ||
                "";

        }


        try {

            if (
                recipeId?.value
            ) {

                await updateDoc(
                    doc(
                        db,
                        "recetas",
                        recipeId.value
                    ),
                    datos
                );

                alert(
                    "¡Registro actualizado correctamente!"
                );

            } else {

                await addDoc(
                    recetasRef,
                    datos
                );

                alert(
                    "¡Producto registrado correctamente!"
                );

            }

            resetearFormulario();

        } catch (error) {

            console.error(
                "ERROR GUARDANDO:",
                error
            );

            alert(
                "No se pudo guardar el registro: " +
                error.message
            );

        }

    }
);


// ======================================================
// RESET
// ======================================================

function resetearFormulario() {

    recipeForm?.reset();

    if (recipeId) {

        recipeId.value =
            "";

    }

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

    alternarCamposFormulario(
        mundoActual
    );

}


// ======================================================
// CANCELAR EDICIÓN
// ======================================================

btnFormCancel?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        resetearFormulario();

    }
);


// ======================================================
// BUSCADOR
// ======================================================

searchInput?.addEventListener(
    "input",
    calcularMetricasYRender
);


// ======================================================
// IA
// ======================================================

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
        async event => {

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
                    "Selecciona una imagen válida."
                );

                return;

            }

            try {

                if (aiLoading) {

                    aiLoading.style.display =
                        "block";

                }

                btnTriggerAI.disabled =
                    true;

                const resultado =
                    await analizarEtiqueta(
                        file
                    );

                if (
                    !resultado ||
                    resultado.ok !== true
                ) {

                    throw new Error(
                        resultado?.mensaje ||
                        "La IA no devolvió datos válidos."
                    );

                }

                const datos =
                    resultado.datos ||
                    {};

                if (tipoRegistroSelect) {

                    tipoRegistroSelect.value =
                        datos.tipo_registro ||
                        "quimico";

                    alternarCamposFormulario(
                        tipoRegistroSelect.value
                    );

                }

                if (recipeName) {

                    recipeName.value =
                        datos.nombre ||
                        "";

                }

                if (recipeActivo) {

                    recipeActivo.value =
                        datos.ingrediente_activo ||
                        "";

                }

                if (recipeConcentracion) {

                    recipeConcentracion.value =
                        datos.concentracion ||
                        "";

                }

                const funcionesIA =
                    Array.isArray(
                        datos.funcion
                    )
                        ? datos.funcion
                        : [];

                document
                    .querySelectorAll(
                        'input[name="funcion"]'
                    )
                    .forEach(
                        checkbox => {

                            checkbox.checked =
                                funcionesIA.includes(
                                    checkbox.value
                                );

                        }
                    );

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
                        checkbox => {

                            checkbox.checked =
                                modosIA.includes(
                                    checkbox.value
                                );

                        }
                    );


                // ======================================
                // LA IA NO TOCA:
                //
                // PLAGAS
                // DOSIS
                // UNIDAD
                // CARENCIA
                // REENTRADA
                // ======================================

                cargarPlagasFormulario([]);

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
                        radio => {

                            radio.checked =
                                false;

                        }
                    );

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

                alert(
                    "Producto identificado. Ahora completa manualmente las plagas, dosis, carencia y reentrada."
                );

            } catch (error) {

                console.error(
                    "ERROR IA:",
                    error
                );

                alert(
                    "No se pudo analizar la etiqueta: " +
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
// INICIO
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
    "SANIDADAPP CARGADO"
);

console.log(
    "Firebase: proyecto original"
);

console.log(
    "Colección: recetas"
);

console.log(
    "Plagas: 4 campos manuales"
);

console.log(
    "Dosis: manual + confirmación"
);

console.log(
    "IA: mediante ia.js"
);

console.log(
    "===================================="
);
