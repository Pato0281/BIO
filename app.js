// ======================================================
// SANIDADAPP / BIO IA
// app.js
// ======================================================
//
// ARQUITECTURA ACTUAL:
//
// FOTO
//   ↓
// IA / OpenRouter
//   ↓
// Nombre
// Ingrediente activo
// Concentración
// Modo de acción
// Función
//   ↓
// AGRICULTOR
//   ↓
// Plaga 1-4
// Dosis baja
// Dosis alta
// Unidad
// Carencia
// Reingreso
//   ↓
// BIO
//   ↓
// Cálculo 1 / 15 / 100 / 160 L
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

let esAdmin =
    false;

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
// CAMPOS DE DOSIFICACIÓN
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

const doseConfirmStatus =
    document.getElementById(
        "dose-confirm-status"
    );

const btnConfirmDoses =
    document.getElementById(
        "btn-confirm-doses"
    );

const btnCancelDoses =
    document.getElementById(
        "btn-cancel-doses"
    );


// ======================================================
// UTILIDADES GENERALES
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


function formatearNumero(
    numero
) {

    if (
        !Number.isFinite(
            numero
        )
    ) {

        return "—";

    }


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
        numero.toFixed(
            4
        )
    )
        .toString()
        .replace(
            ".",
            ","
        );

}


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
// AUTENTICACIÓN
// ======================================================

onAuthStateChanged(
    auth,
    (user) => {

        esAdmin =
            Boolean(
                user
            );


        if (
            btnOpenLogin
        ) {

            btnOpenLogin.style.display =
                user
                    ? "none"
                    : "inline-block";

        }


        if (
            adminLoggedInfo
        ) {

            adminLoggedInfo.style.display =
                user
                    ? "inline-block"
                    : "none";

        }


        if (
            sectionFormContainer
        ) {

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

if (
    btnOpenLogin &&
    loginModal
) {

    btnOpenLogin.addEventListener(
        "click",
        () => {

            loginModal.style.display =
                "flex";

        }
    );

}


if (
    btnCloseLogin &&
    loginModal
) {

    btnCloseLogin.addEventListener(
        "click",
        () => {

            loginModal.style.display =
                "none";

        }
    );

}


if (
    loginForm
) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document.getElementById(
                    "login-email"
                )?.value
                    .trim();


            const password =
                document.getElementById(
                    "login-password"
                )?.value;


            if (
                !email ||
                !password
            ) {

                alert(
                    "Completa correo y contraseña."
                );

                return;

            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                if (
                    loginModal
                ) {

                    loginModal.style.display =
                        "none";

                }


                loginForm.reset();


                alert(
                    "¡Bienvenido Modo Administrador!"
                );


            } catch (
                error
            ) {

                console.error(
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

if (
    btnLogout
) {

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


            } catch (
                error
            ) {

                console.error(
                    error
                );

            }

        }
    );

}


// ======================================================
// CAMBIO DE TIPO DE PRODUCTO
// ======================================================

if (
    tipoRegistroSelect
) {

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
        tipo ===
        "bio"
    ) {

        if (
            sectionFormBio
        ) {

            sectionFormBio.style.display =
                "block";

        }


        if (
            sectionFormQuimico
        ) {

            sectionFormQuimico.style.display =
                "none";

        }

    } else {

        if (
            sectionFormBio
        ) {

            sectionFormBio.style.display =
                "none";

        }


        if (
            sectionFormQuimico
        ) {

            sectionFormQuimico.style.display =
                "block";

        }

    }

}


// ======================================================
// MUNDO BIO
// ======================================================

if (
    btnWorldBio
) {

    btnWorldBio.addEventListener(
        "click",
        () => {

            mundoActual =
                "bio";


            btnWorldBio.className =
                "btn-world active-bio";


            if (
                btnWorldQui
            ) {

                btnWorldQui.className =
                    "btn-world";

            }


            if (
                statsTitle
            ) {

                statsTitle.textContent =
                    "Métricas Mundo Bio";

            }


            if (
                resultsTitle
            ) {

                resultsTitle.textContent =
                    "Listado de Biopreparados";

            }


            if (
                statConditionalCard
            ) {

                statConditionalCard.innerHTML =
                    'Eficacia Alta <span id="stat-alta">0</span>';

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

if (
    btnWorldQui
) {

    btnWorldQui.addEventListener(
        "click",
        () => {

            mundoActual =
                "quimico";


            btnWorldQui.className =
                "btn-world active-qui";


            if (
                btnWorldBio
            ) {

                btnWorldBio.className =
                    "btn-world";

            }


            if (
                statsTitle
            ) {

                statsTitle.textContent =
                    "Métricas Mundo Químico";

            }


            if (
                resultsTitle
            ) {

                resultsTitle.textContent =
                    "Listado de Productos Químicos";

            }


            if (
                statConditionalCard
            ) {

                statConditionalCard.innerHTML =
                    'Sistémicos <span id="stat-alta">0</span>';

            }


            filtroFuncionActual =
                "todos";


            resetearFiltros();


            calcularMetricasYRender();

        }
    );

}


function resetearFiltros() {

    filterButtons.forEach(
        (
            button,
            index
        ) => {

            button.style.background =
                index ===
                0
                    ? "#81c784"
                    : "#f1f8e9";

        }
    );

}


// ======================================================
// FIRESTORE
// ======================================================

onSnapshot(
    query(
        recetasRef
    ),
    (snapshot) => {

        todosLosDatos =
            [];


        snapshot.forEach(
            (docSnap) => {

                todosLosDatos.push(
                    {

                        id:
                            docSnap.id,

                        ...docSnap.data()

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
// OBTENER PLAGAS MANUALES
// ======================================================

function obtenerPlagasManuales() {

    const ids =
        [
            "recipe-plaga-1",
            "recipe-plaga-2",
            "recipe-plaga-3",
            "recipe-plaga-4"
        ];


    return ids
        .map(
            id =>
                document.getElementById(
                    id
                )?.value
                    ?.trim() ||
                ""
        )
        .filter(
            Boolean
        );

}


// ======================================================
// CARGAR PLAGAS EN FORMULARIO
// ======================================================

function cargarPlagasEnFormulario(
    plagas
) {

    const lista =
        Array.isArray(
            plagas
        )
            ? plagas
            : [];


    [
        "recipe-plaga-1",
        "recipe-plaga-2",
        "recipe-plaga-3",
        "recipe-plaga-4"
    ]
    .forEach(
        (
            id,
            index
        ) => {

            const campo =
                document.getElementById(
                    id
                );


            if (
                campo
            ) {

                campo.value =
                    lista[index] ||
                    "";

            }

        }
    );

}


// ======================================================
// DOSIFICACIÓN
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


function obtenerDatosDosis() {

    const agua =
        parseFloat(
            doseWater?.value
        ) ||
        100;


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


    return {

        agua,

        baja,

        alta,

        unidad,

        valido:

            Number.isFinite(
                baja
            ) &&
            baja > 0 &&

            Number.isFinite(
                alta
            ) &&
            alta > 0 &&

            alta >= baja &&

            Boolean(
                unidad
            )

    };

}


// ======================================================
// ACTUALIZAR TABLA DE DOSIS
// ======================================================

function actualizarDosis() {

    const datos =
        obtenerDatosDosis();


    dosisConfirmada =
        false;


    if (
        doseConfirmStatus
    ) {

        doseConfirmStatus.style.display =
            "none";

    }


    if (
        !datos.valido
    ) {

        if (
            doseTableWrapper
        ) {

            doseTableWrapper.style.display =
                "none";

        }


        if (
            doseValidationMessage
        ) {

            doseValidationMessage.style.display =
                "block";


            if (
                Number.isFinite(
                    datos.baja
                ) &&
                Number.isFinite(
                    datos.alta
                ) &&
                datos.alta <
                    datos.baja
            ) {

                doseValidationMessage.textContent =
                    "La dosis alta no puede ser menor que la dosis baja.";

            } else {

                doseValidationMessage.textContent =
                    "Completa dosis baja, dosis alta y selecciona g, cc o mL.";

            }

        }


        return;

    }


    if (
        doseValidationMessage
    ) {

        doseValidationMessage.style.display =
            "none";

    }


    if (
        doseTableWrapper
    ) {

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
        (
            L
        ) => {

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


            if (
                lowCell
            ) {

                lowCell.textContent =
                    `${formatearNumero(baja)} ${datos.unidad}`;

            }


            if (
                highCell
            ) {

                highCell.textContent =
                    `${formatearNumero(alta)} ${datos.unidad}`;

            }

        }
    );


    if (
        doseConfirmationSummary
    ) {

        doseConfirmationSummary.innerHTML =
            `
            <strong>
                Resumen de dosificación
            </strong>
            <br>

            Referencia:
            <strong>
                ${datos.agua} L de agua
            </strong>
            <br>

            Preventivo (Baja):
            <strong>
                ${formatearNumero(datos.baja)}
                ${datos.unidad}
            </strong>
            <br>

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

if (
    doseLow
) {

    doseLow.addEventListener(
        "input",
        actualizarDosis
    );

}


if (
    doseHigh
) {

    doseHigh.addEventListener(
        "input",
        actualizarDosis
    );

}


document
    .querySelectorAll(
        'input[name="dose-unit"]'
    )
    .forEach(
        (
            radio
        ) => {

            radio.addEventListener(
                "change",
                actualizarDosis
            );

        }
    );


// ======================================================
// CONFIRMAR DOSIFICACIONES
// ======================================================

if (
    btnConfirmDoses
) {

    btnConfirmDoses.addEventListener(
        "click",
        () => {

            const datos =
                obtenerDatosDosis();


            if (
                !datos.valido
            ) {

                alert(
                    "Completa la dosis baja, dosis alta y la unidad."
                );

                return;

            }


            const confirmado =
                window.confirm(
                    `¿Confirmas que las dosificaciones son correctas?\n\n` +

                    `Preventivo (Baja): ` +

                    `${formatearNumero(datos.baja)} ` +

                    `${datos.unidad} / ${datos.agua} L\n\n` +

                    `Curativo (Alta): ` +

                    `${formatearNumero(datos.alta)} ` +

                    `${datos.unidad} / ${datos.agua} L`
                );


            if (
                confirmado
            ) {

                dosisConfirmada =
                    true;


                if (
                    doseConfirmStatus
                ) {

                    doseConfirmStatus.style.display =
                        "block";

                }

            }

        }
    );

}


// ======================================================
// CORREGIR DOSIFICACIONES
// ======================================================

if (
    btnCancelDoses
) {

    btnCancelDoses.addEventListener(
        "click",
        () => {

            dosisConfirmada =
                false;


            if (
                doseConfirmStatus
            ) {

                doseConfirmStatus.style.display =
                    "none";

            }


            doseLow?.focus();

        }
    );

}


// ======================================================
// CONSTRUIR DOSIS PARA FIREBASE
// ======================================================

function construirDosisConfig() {

    const datos =
        obtenerDatosDosis();


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
            [
                1,
                15,
                100,
                160
            ]
            .map(
                (
                    L
                ) => {

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
        !dosis
    ) {

        return "";

    }


    return (
        `${dosis.agua_referencia} L: ` +

        `Preventivo ${formatearNumero(
            dosis.dosis_baja
        )} ${dosis.unidad}; ` +

        `Curativo ${formatearNumero(
            dosis.dosis_alta
        )} ${dosis.unidad}`
    );

}


// ======================================================
// TABLA DOSIS PARA TARJETAS
// ======================================================

function generarTablaDosisHTML(
    item
) {

    const dosis =
        item?.dosis_config;


    if (
        !dosis ||
        !dosis.confirmado ||
        !Array.isArray(
            dosis.tabla
        )
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
                <strong>
                    Dosificación:
                </strong>

                No especificada
            </div>
        `;

    }


    const filas =
        dosis.tabla
            .map(
                (
                    fila
                ) => {

                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${fila.litros} L
                                </strong>
                            </td>

                            <td>
                                ${formatearNumero(
                                    fila.preventivo
                                )}
                                ${fila.unidad}
                            </td>

                            <td>
                                ${formatearNumero(
                                    fila.curativo
                                )}
                                ${fila.unidad}
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");


    return `

        <div
            style="
                margin-top:12px;
            "
        >

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

                        ${filas}

                    </tbody>

                </table>

            </div>


            <div
                class="calc-box calc-qui"
                style="
                    margin-top:12px;
                "
            >

                <strong>
                    Calculadora Rápida para Estanque
                </strong>


                <div class="calc-row">

                    <input
                        type="number"
                        class="calc-input input-litros"
                        data-id="${item.id}"
                        value="100"
                        min="1"
                        step="1"
                        placeholder="Litros"
                    >

                </div>


                <div class="calc-row">

                    <button
                        type="button"
                        class="btn-calc-type btn-prev active-preventivo"
                        data-id="${item.id}"
                        data-base="${dosis.agua_referencia}"
                        data-dosis="${dosis.dosis_baja}"
                        data-unidad="${escapeHTML(dosis.unidad)}"
                    >
                        Preventivo (Baja)
                    </button>


                    <button
                        type="button"
                        class="btn-calc-type btn-cur"
                        data-id="${item.id}"
                        data-base="${dosis.agua_referencia}"
                        data-dosis="${dosis.dosis_alta}"
                        data-unidad="${escapeHTML(dosis.unidad)}"
                    >
                        Curativo (Alta)
                    </button>

                </div>


                <div
                    class="calc-result-box"
                    id="res-calc-${item.id}"
                >

                    Mezclar:
                    <strong>
                        ${formatearNumero(
                            dosis.dosis_baja
                        )}
                        ${dosis.unidad}
                    </strong>

                    para
                    ${dosis.agua_referencia}
                    L

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// CALCULADORA DE TARJETAS
// ======================================================

function activarCalculadoras() {

    document
        .querySelectorAll(
            ".input-litros"
        )
        .forEach(
            (
                input
            ) => {

                input.addEventListener(
                    "input",
                    () => {

                        ejecutarCalculoTarjeta(
                            input.dataset.id
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
            (
                button
            ) => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;


                        const esCurativo =
                            button.classList.contains(
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


                        if (
                            esCurativo
                        ) {

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


                        ejecutarCalculoTarjeta(
                            id
                        );

                    }
                );

            }
        );

}


function ejecutarCalculoTarjeta(
    id
) {

    const input =
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


    const resultado =
        document.getElementById(
            `res-calc-${id}`
        );


    if (
        !input ||
        !resultado
    ) {

        return;

    }


    const curativo =
        btnCur?.classList.contains(
            "active-curativo"
        );


    const activo =
        curativo
            ? btnCur
            : btnPrev;


    if (
        !activo
    ) {

        return;

    }


    const litros =
        parseFloat(
            input.value
        );


    const base =
        parseFloat(
            activo.dataset.base
        );


    const dosis =
        parseFloat(
            activo.dataset.dosis
        );


    const unidad =
        activo.dataset.unidad ||
        "cc";


    if (
        !Number.isFinite(
            litros
        ) ||
        litros <= 0 ||
        !Number.isFinite(
            base
        ) ||
        base <= 0 ||
        !Number.isFinite(
            dosis
        )
    ) {

        resultado.innerHTML =
            "⚠️ Ingresa una cantidad válida de litros.";

        return;

    }


    const valor =
        litros *
        dosis /
        base;


    const modo =
        curativo
            ? "Curativo (Alta)"
            : "Preventivo (Baja)";


    resultado.innerHTML =
        `Modo ${modo}: Agregar <strong>${formatearNumero(valor)} ${unidad}</strong>`;

}


// ======================================================
// MÉTRICAS Y LISTADO
// ======================================================

function calcularMetricasYRender() {

    if (
        !recipesContainer
    ) {

        return;

    }


    const datosMundo =
        todosLosDatos.filter(
            (
                item
            ) =>
                (
                    item.tipo_registro ||
                    "bio"
                ) ===
                mundoActual
        );


    if (
        statTotal
    ) {

        statTotal.textContent =
            datosMundo.length;

    }


    let contador =
        0;


    datosMundo.forEach(
        (
            item
        ) => {

            if (
                mundoActual ===
                "bio" &&
                item.efectividad ===
                    "Eficacia Alta"
            ) {

                contador++;

            }


            if (
                mundoActual ===
                "quimico" &&
                Array.isArray(
                    item.modo_accion
                ) &&
                item.modo_accion.some(
                    modo =>
                        normalizeText(
                            modo
                        ).includes(
                            "sistem"
                        )
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


    if (
        statAlta
    ) {

        statAlta.textContent =
            contador;

    }


    const busqueda =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const filtrados =
        datosMundo.filter(
            (
                item
            ) => {

                const nombre =
                    normalizeText(
                        item.nombre
                    );


                const activo =
                    normalizeText(
                        item.ingrediente_activo
                    );


                const plagas =
                    Array.isArray(
                        item.plagas_objetivo
                    )
                        ? item.plagas_objetivo
                        : [];


                const textoPlagas =
                    plagas
                        .map(
                            p =>
                                normalizeText(
                                    p
                                )
                        );


                const coincideBusqueda =
                    !busqueda ||

                    nombre.includes(
                        busqueda
                    ) ||

                    activo.includes(
                        busqueda
                    ) ||

                    textoPlagas.some(
                        p =>
                            p.includes(
                                busqueda
                            )
                    );


                const coincideFuncion =
                    filtroFuncionActual ===
                        "todos" ||

                    (
                        Array.isArray(
                            item.funcion
                        ) &&
                        item.funcion.includes(
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
        (
            item
        ) => {

            const card =
                document.createElement(
                    "div"
                );


            const esQuimico =
                item.tipo_registro ===
                "quimico";


            card.className =
                esQuimico
                    ? "recipe-card card-qui"
                    : "recipe-card card-bio";


            const funcionesHTML =
                Array.isArray(
                    item.funcion
                )
                    ? item.funcion
                        .map(
                            funcion =>
                                `
                                <span class="tag">
                                    ${escapeHTML(
                                        funcion
                                    )}
                                </span>
                                `
                        )
                        .join("")
                    : "";


            const plagasHTML =
                Array.isArray(
                    item.plagas_objetivo
                ) &&
                item.plagas_objetivo.length
                    ? `
                        <p
                            style="
                                font-size:13px;
                                color:#555;
                            "
                        >
                            <strong>
                                A controlar:
                            </strong>

                            ${item.plagas_objetivo
                                .map(
                                    p =>
                                        escapeHTML(
                                            p
                                        )
                                )
                                .join(
                                    ", "
                                )}
                        </p>
                    `
                    : "";


            const botonesAdmin =
                esAdmin
                    ? `
                        <div class="action-buttons">

                            <button
                                class="btn-action btn-edit"
                                data-id="${item.id}"
                                type="button"
                            >
                                ✏️
                            </button>


                            <button
                                class="btn-action btn-delete"
                                data-id="${item.id}"
                                type="button"
                            >
                                🗑️
                            </button>

                        </div>
                    `
                    : "";


            if (
                esQuimico
            ) {

                const modosHTML =
                    Array.isArray(
                        item.modo_accion
                    ) &&
                    item.modo_accion.length
                        ? item.modo_accion
                            .map(
                                modo =>
                                    normalizeText(
                                        modo
                                    )
                            )
                            .join(
                                ", "
                            )
                        : "No especificado";


                card.innerHTML =
                    `

                    ${botonesAdmin}


                    <h3 class="qui-title">
                        ${escapeHTML(
                            item.nombre ||
                            ""
                        )}
                    </h3>


                    <div
                        style="
                            margin-bottom:8px;
                        "
                    >
                        ${funcionesHTML}
                    </div>


                    <div class="info-box-qui">


                        <p>

                            <strong>
                                Ingrediente activo:
                            </strong>

                            ${escapeHTML(
                                item.ingrediente_activo ||
                                "No especificado"
                            )}

                        </p>


                        <p>

                            <strong>
                                Concentración:
                            </strong>

                            ${escapeHTML(
                                item.concentracion ||
                                "No especificada"
                            )}

                        </p>


                        <p>

                            <strong>
                                Modo de acción:
                            </strong>

                            ${escapeHTML(
                                modosHTML
                            )}

                        </p>


                    </div>


                    ${plagasHTML}


                    ${generarTablaDosisHTML(
                        item
                    )}


                    <button
                        class="btn-toggle qui-toggle"
                        data-id="${item.id}"
                        type="button"
                    >
                        Ver Carencia y Reentrada
                    </button>


                    <div
                        class="extra-content"
                        id="extra-${item.id}"
                        style="
                            display:none;
                        "
                    >

                        <p>

                            <strong>
                                Días de Carencia:
                            </strong>

                            ${escapeHTML(
                                item.carencia ||
                                "No indicado"
                            )}

                        </p>


                        <p>

                            <strong>
                                Horas de Reentrada:
                            </strong>

                            ${escapeHTML(
                                item.reentrada ||
                                "No indicado"
                            )}

                        </p>

                    </div>

                    `;

            } else {

                card.innerHTML =
                    `

                    ${botonesAdmin}


                    <h3>
                        ${escapeHTML(
                            item.nombre ||
                            ""
                        )}
                    </h3>


                    <div
                        style="
                            margin-bottom:8px;
                        "
                    >

                        ${funcionesHTML}


                        <span
                            class="tag-efectividad"
                        >
                            ${escapeHTML(
                                item.efectividad ||
                                "En evaluación"
                            )}
                        </span>

                    </div>


                    ${plagasHTML}


                    ${generarTablaDosisHTML(
                        item
                    )}


                    ${
                        item.contraindicacion
                            ? `
                                <div class="warning-box">

                                    ⚠️
                                    ${escapeHTML(
                                        item.contraindicacion
                                    )}

                                </div>
                            `
                            : ""
                    }


                    <button
                        class="btn-toggle"
                        data-id="${item.id}"
                        type="button"
                    >
                        Ver Preparación e Ingredientes
                    </button>


                    <div
                        class="extra-content"
                        id="extra-${item.id}"
                        style="
                            display:none;
                        "
                    >

                        <p>

                            <strong>
                                Ingredientes:
                            </strong>

                            ${escapeHTML(
                                item.ingredientes ||
                                "No especificados"
                            )}

                        </p>


                        <p>

                            <strong>
                                Preparación:
                            </strong>

                            ${escapeHTML(
                                item.preparacion ||
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

    activarCalculadoras();

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
            (
                button
            ) => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;


                        const panel =
                            document.getElementById(
                                `extra-${id}`
                            );


                        if (
                            !panel
                        ) {

                            return;

                        }


                        const abierto =
                            panel.style.display ===
                            "block";


                        panel.style.display =
                            abierto
                                ? "none"
                                : "block";


                        if (
                            abierto
                        ) {

                            button.textContent =
                                button.classList.contains(
                                    "qui-toggle"
                                )
                                    ? "Ver Carencia y Reentrada"
                                    : "Ver Preparación e Ingredientes";

                        } else {

                            button.textContent =
                                "Ocultar Detalles";

                        }

                    }
                );

            }
        );


    if (
        !esAdmin
    ) {

        return;

    }


    document
        .querySelectorAll(
            ".btn-edit"
        )
        .forEach(
            (
                button
            ) => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            todosLosDatos.find(
                                registro =>
                                    registro.id ===
                                    button.dataset.id
                            );


                        if (
                            item
                        ) {

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
            (
                button
            ) => {

                button.addEventListener(
                    "click",
                    async () => {

                        const confirmar =
                            window.confirm(
                                "¿Estás seguro de eliminar este registro?"
                            );


                        if (
                            !confirmar
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


// ======================================================
// CARGAR PRODUCTO EN EDICIÓN
// ======================================================

function cargarItemEnFormulario(
    item
) {

    document.getElementById(
        "recipe-id"
    ).value =
        item.id;


    if (
        formTitle
    ) {

        formTitle.textContent =
            "Editar Registro Fitosanitario";

    }


    if (
        btnFormSubmit
    ) {

        btnFormSubmit.textContent =
            "Actualizar Cambios";

    }


    if (
        btnFormCancel
    ) {

        btnFormCancel.style.display =
            "block";

    }


    tipoRegistroSelect.value =
        item.tipo_registro ||
        "bio";


    alternarCamposFormulario(
        tipoRegistroSelect.value
    );


    document.getElementById(
        "recipe-name"
    ).value =
        item.nombre ||
        "";


    // Funciones
    document
        .querySelectorAll(
            'input[name="funcion"]'
        )
        .forEach(
            (
                checkbox
            ) => {

                checkbox.checked =
                    Array.isArray(
                        item.funcion
                    ) &&
                    item.funcion.includes(
                        checkbox.value
                    );

            }
        );


    // Plagas manuales
    cargarPlagasEnFormulario(
        item.plagas_objetivo
    );


    // Dosis
    const dosis =
        item.dosis_config;


    if (
        dosis
    ) {

        doseWater.value =
            dosis.agua_referencia ||
            100;


        doseLow.value =
            dosis.dosis_baja ??
            "";


        doseHigh.value =
            dosis.dosis_alta ??
            "";


        document
            .querySelectorAll(
                'input[name="dose-unit"]'
            )
            .forEach(
                (
                    radio
                ) => {

                    radio.checked =
                        radio.value ===
                        dosis.unidad;

                }
            );


        dosisConfirmada =
            false;


        actualizarDosis();

    } else {

        limpiarFormularioDosis();

    }


    // Químico
    if (
        item.tipo_registro ===
        "quimico"
    ) {

        const activo =
            document.getElementById(
                "recipe-activo"
            );


        if (
            activo
        ) {

            activo.value =
                item.ingrediente_activo ||
                "";

        }


        const concentracion =
            document.getElementById(
                "recipe-concentracion"
            );


        if (
            concentracion
        ) {

            concentracion.value =
                item.concentracion ||
                "";

        }


        document
            .querySelectorAll(
                'input[name="modo_accion"]'
            )
            .forEach(
                (
                    checkbox
                ) => {

                    checkbox.checked =
                        Array.isArray(
                            item.modo_accion
                        ) &&
                        item.modo_accion.some(
                            modo =>
                                normalizarModo(
                                    modo
                                ) ===
                                normalizarModo(
                                    checkbox.value
                                )
                        );

                }
            );

    }


    // Seguridad
    const carencia =
        document.getElementById(
            "recipe-carencia"
        );


    const reentrada =
        document.getElementById(
            "recipe-reentrada"
        );


    if (
        carencia
    ) {

        carencia.value =
            item.carencia ||
            "";

    }


    if (
        reentrada
    ) {

        reentrada.value =
            item.reentrada ||
            "";

    }


    // BIO
    if (
        item.tipo_registro ===
        "bio"
    ) {

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


    recipeForm.scrollIntoView(
        {
            behavior:
                "smooth"
        }
    );

}


// ======================================================
// SUBMIT FORMULARIO
// ======================================================

if (
    recipeForm
) {

    recipeForm.addEventListener(
        "submit",
        async (
            event
        ) => {

            event.preventDefault();


            if (
                !esAdmin
            ) {

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
                )
                    .value
                    .trim();


            if (
                !nombre
            ) {

                alert(
                    "Ingresa el nombre del producto."
                );

                return;

            }


            // ----------------------------------------------
            // FUNCIÓN
            // ----------------------------------------------

            const funciones =
                Array.from(
                    document.querySelectorAll(
                        'input[name="funcion"]:checked'
                    )
                )
                .map(
                    checkbox =>
                        checkbox.value
                );


            // ----------------------------------------------
            // PLAGAS MANUALES
            // ----------------------------------------------

            const plagas =
                obtenerPlagasManuales();


            // ----------------------------------------------
            // DOSIS
            // ----------------------------------------------

            const dosis =
                construirDosisConfig();


            if (
                !dosis
            ) {

                alert(
                    "Completa la dosis baja, dosis alta y selecciona g, cc o mL."
                );

                return;

            }


            if (
                !dosisConfirmada
            ) {

                alert(
                    "Debes confirmar que las dosificaciones son correctas antes de guardar."
                );

                return;

            }


            // ----------------------------------------------
            // DATOS BASE
            // ----------------------------------------------

            const datos =
            {

                tipo_registro:
                    tipo,

                nombre:
                    nombre,

                funcion:
                    funciones,

                plagas_objetivo:
                    plagas,

                modo_aplicacion:
                    construirTextoDosis(
                        dosis
                    ),

                dosis_config:
                    dosis,

                actualizado_el:
                    new Date().toISOString()

            };


            // ----------------------------------------------
            // QUÍMICO
            // ----------------------------------------------

            if (
                tipo ===
                "quimico"
            ) {

                datos.ingrediente_activo =
                    document.getElementById(
                        "recipe-activo"
                    )
                        ?.value
                        ?.trim() ||
                    "";


                datos.concentracion =
                    document.getElementById(
                        "recipe-concentracion"
                    )
                        ?.value
                        ?.trim() ||
                    "";


                datos.modo_accion =
                    Array.from(
                        document.querySelectorAll(
                            'input[name="modo_accion"]:checked'
                        )
                    )
                    .map(
                        checkbox =>
                            checkbox.value
                    );


                datos.carencia =
                    document.getElementById(
                        "recipe-carencia"
                    )
                        ?.value
                        ?.trim() ||
                    "";


                datos.reentrada =
                    document.getElementById(
                        "recipe-reentrada"
                    )
                        ?.value
                        ?.trim() ||
                    "";

            }


            // ----------------------------------------------
            // BIO
            // ----------------------------------------------

            else {

                datos.efectividad =
                    document.getElementById(
                        "recipe-efectividad"
                    )
                        ?.value ||
                    "En fase de evaluación";


                datos.contraindicacion =
                    document.getElementById(
                        "recipe-contra"
                    )
                        ?.value
                        ?.trim() ||
                    "";


                datos.ingredientes =
                    document.getElementById(
                        "recipe-ingredients"
                    )
                        ?.value
                        ?.trim() ||
                    "";


                datos.preparacion =
                    document.getElementById(
                        "recipe-prep"
                    )
                        ?.value
                        ?.trim() ||
                    "";

            }


            // ----------------------------------------------
            // GUARDAR
            // ----------------------------------------------

            try {

                if (
                    id
                ) {

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

                } else {

                    await addDoc(
                        recetasRef,
                        datos
                    );


                    alert(
                        "¡Producto registrado con éxito!"
                    );

                }


                resetearFormulario();

            } catch (
                error
            ) {

                console.error(
                    "Error guardando en Firebase:",
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
// RESET DOSIS
// ======================================================

function limpiarFormularioDosis() {

    dosisConfirmada =
        false;


    if (
        doseWater
    ) {

        doseWater.value =
            "100";

    }


    if (
        doseLow
    ) {

        doseLow.value =
            "";

    }


    if (
        doseHigh
    ) {

        doseHigh.value =
            "";

    }


    document
        .querySelectorAll(
            'input[name="dose-unit"]'
        )
        .forEach(
            (
                radio
            ) => {

                radio.checked =
                    false;

            }
        );


    if (
        doseTableWrapper
    ) {

        doseTableWrapper.style.display =
            "none";

    }


    if (
        doseValidationMessage
    ) {

        doseValidationMessage.style.display =
            "none";

    }


    if (
        doseConfirmationSummary
    ) {

        doseConfirmationSummary.innerHTML =
            "";

    }


    if (
        doseConfirmStatus
    ) {

        doseConfirmStatus.style.display =
            "none";

    }

}


// ======================================================
// RESET GENERAL
// ======================================================

function resetearFormulario() {

    if (
        recipeForm
    ) {

        recipeForm.reset();

    }


    const id =
        document.getElementById(
            "recipe-id"
        );


    if (
        id
    ) {

        id.value =
            "";

    }


    if (
        formTitle
    ) {

        formTitle.textContent =
            "Agregar Nuevo Registro Fitosanitario";

    }


    if (
        btnFormSubmit
    ) {

        btnFormSubmit.textContent =
            "Guardar Producto";

    }


    if (
        btnFormCancel
    ) {

        btnFormCancel.style.display =
            "none";

    }


    tipoRegistroSelect.value =
        mundoActual;


    alternarCamposFormulario(
        mundoActual
    );


    limpiarFormularioDosis();

}


// ======================================================
// CANCELAR EDICIÓN
// ======================================================

if (
    btnFormCancel
) {

    btnFormCancel.addEventListener(
        "click",
        resetearFormulario
    );

}


// ======================================================
// BUSCADOR
// ======================================================

if (
    searchInput
) {

    searchInput.addEventListener(
        "input",
        calcularMetricasYRender
    );

}


// ======================================================
// FILTROS
// ======================================================

filterButtons.forEach(
    (
        button
    ) => {

        button.addEventListener(
            "click",
            () => {

                filtroFuncionActual =
                    button.dataset.funcion;


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
// LECTOR IA
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
        async (
            event
        ) => {

            const file =
                event.target
                    .files?.[0];


            if (
                !file
            ) {

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

                aiImageInput.value =
                    "";

                return;

            }


            if (
                aiLoading
            ) {

                aiLoading.style.display =
                    "block";

            }


            btnTriggerAI.disabled =
                true;


            try {

                console.log(
                    "Enviando imagen a IA..."
                );


                const resultado =
                    await analizarEtiqueta(
                        file
                    );


                console.log(
                    "Respuesta IA:",
                    resultado
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


                // ------------------------------------------
                // TIPO
                // ------------------------------------------

                if (
                    datos.tipo_registro
                ) {

                    tipoRegistroSelect.value =
                        datos.tipo_registro;


                    alternarCamposFormulario(
                        datos.tipo_registro
                    );

                }


                // ------------------------------------------
                // NOMBRE
                // ------------------------------------------

                const nombre =
                    document.getElementById(
                        "recipe-name"
                    );


                if (
                    nombre
                ) {

                    nombre.value =
                        datos.nombre ===
                            "No encontrado"
                            ? ""
                            : (
                                datos.nombre ||
                                ""
                            );

                }


                // ------------------------------------------
                // FUNCIÓN
                // ------------------------------------------

                const funciones =
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
                        (
                            checkbox
                        ) => {

                            checkbox.checked =
                                funciones.some(
                                    funcion =>
                                        normalizeText(
                                            funcion
                                        ) ===
                                        normalizeText(
                                            checkbox.value
                                        )
                                );

                        }
                    );


                // ------------------------------------------
                // PRODUCTO QUÍMICO
                // ------------------------------------------

                if (
                    datos.tipo_registro ===
                    "quimico"
                ) {

                    const activo =
                        document.getElementById(
                            "recipe-activo"
                        );


                    if (
                        activo
                    ) {

                        activo.value =
                            datos.ingrediente_activo ===
                                "No encontrado"
                                ? ""
                                : (
                                    datos.ingrediente_activo ||
                                    ""
                                );

                    }


                    const concentracion =
                        document.getElementById(
                            "recipe-concentracion"
                        );


                    if (
                        concentracion
                    ) {

                        concentracion.value =
                            datos.concentracion ===
                                "No encontrado"
                                ? ""
                                : (
                                    datos.concentracion ||
                                    ""
                                );

                    }


                    // Modo de acción
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
                            (
                                checkbox
                            ) => {

                                checkbox.checked =
                                    modosIA.some(
                                        modo =>
                                            normalizarModo(
                                                modo
                                            ) ===
                                            normalizarModo(
                                                checkbox.value
                                            )
                                    );

                            }
                        );

                }


                // ------------------------------------------
                // PLAGAS:
                // YA NO LAS MANDA LA IA
                // ------------------------------------------

                cargarPlagasEnFormulario(
                    []
                );


                // ------------------------------------------
                // DOSIS:
                // MANUAL
                // ------------------------------------------

                limpiarFormularioDosis();


                // ------------------------------------------
                // CARENCIA / REINGRESO:
                // MANUAL
                // ------------------------------------------

                const carencia =
                    document.getElementById(
                        "recipe-carencia"
                    );


                const reentrada =
                    document.getElementById(
                        "recipe-reentrada"
                    );


                if (
                    carencia
                ) {

                    carencia.value =
                        "";

                }


                if (
                    reentrada
                ) {

                    reentrada.value =
                        "";

                }


                alert(
                    "Producto identificado correctamente. Ahora ingresa la plaga o enfermedad a controlar, las dosis, la unidad, la carencia y el reingreso."
                );


            } catch (
                error
            ) {

                console.error(
                    "Error al procesar la fotografía:",
                    error
                );


                alert(
                    "No se pudo extraer la información automáticamente: " +
                    error.message
                );


            } finally {

                if (
                    aiLoading
                ) {

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
// NORMALIZAR TEXTO
// ======================================================

function normalizeText(
    texto
) {

    return String(
        texto ||
        ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}
