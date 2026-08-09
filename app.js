// 1. IMPORTS OFICIALES (Todos al inicio del archivo)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { analizarEtiqueta } from "./ia.js";
import { firebaseConfig } from "./config.js";


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const recetasRef = collection(db, "recetas");

// Clave de IA Gemini (formato "AQ." = Auth Key, es el formato correcto y vigente desde 2026)


// Estado de Administrador
let esAdmin = false;

// Elementos de Control de Mundos
let mundoActual = 'bio';
const btnWorldBio = document.getElementById('btn-world-bio');
const btnWorldQui = document.getElementById('btn-world-qui');
const statsTitle = document.getElementById('stats-title');
const resultsTitle = document.getElementById('results-title');
const statConditionalCard = document.getElementById('stat-conditional-card');

// Formularios e Interfaz
const sectionFormContainer = document.querySelector('.form-section');
const recipeForm = document.getElementById('recipe-form');
const tipoRegistroSelect = document.getElementById('form-tipo-registro');
const sectionFormBio = document.getElementById('section-form-bio');
const sectionFormQuimico = document.getElementById('section-form-quimico');
const recipesContainer = document.getElementById('recipes-container');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.btn-filter');
const formTitle = document.getElementById('form-title');
const btnFormSubmit = document.getElementById('btn-form-submit');
const btnFormCancel = document.getElementById('btn-form-cancel');

// Elementos de Autenticación
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const btnOpenLogin = document.getElementById('btn-open-login');
const btnCloseLogin = document.getElementById('btn-close-login');
const btnLogout = document.getElementById('btn-logout');
const adminLoggedInfo = document.getElementById('admin-logged-info');

// Métricas
const statTotal = document.getElementById('stat-total');

let todosLosDatos = [];
let filtroFuncionActual = 'todos';

// --- CONTROL DE ESTADO DE AUTENTICACIÓN (ADMIN VS LECTOR)
onAuthStateChanged(auth, (user) => {
  if (user) {
    esAdmin = true;
    if (btnOpenLogin) btnOpenLogin.style.display = 'none';
    if (adminLoggedInfo) adminLoggedInfo.style.display = 'inline-block';
    if (sectionFormContainer) sectionFormContainer.style.display = 'block';
  } else {
    esAdmin = false;
    if (btnOpenLogin) btnOpenLogin.style.display = 'inline-block';
    if (adminLoggedInfo) adminLoggedInfo.style.display = 'none';
    if (sectionFormContainer) sectionFormContainer.style.display = 'none';
  }
  calcularMetricasYRender();
});

// Eventos Modal Login
if (btnOpenLogin) btnOpenLogin.addEventListener('click', () => loginModal.style.display = 'flex');
if (btnCloseLogin) btnCloseLogin.addEventListener('click', () => loginModal.style.display = 'none');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      loginModal.style.display = 'none';
      loginForm.reset();
      alert("¡Bienvenido Modo Administrador!");
    } catch (err) {
      alert("Error de acceso: " + err.message);
    }
  });
}

if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    signOut(auth);
    alert("Sesión cerrada.");
  });
}

// --- SWITCHER DE FORMULARIO DINÁMICO
if (tipoRegistroSelect) {
  tipoRegistroSelect.addEventListener('change', (e) => {
    alternarCamposFormulario(e.target.value);
  });
}

function alternarCamposFormulario(tipo) {
  if (tipo === 'bio') {
    if (sectionFormBio) sectionFormBio.style.display = 'block';
    if (sectionFormQuimico) sectionFormQuimico.style.display = 'none';
  } else {
    if (sectionFormBio) sectionFormBio.style.display = 'none';
    if (sectionFormQuimico) sectionFormQuimico.style.display = 'block';
  }
}

// --- CAMBIAR ENTRE MUNDO BIO Y QUÍMICO
if (btnWorldBio) {
  btnWorldBio.addEventListener('click', () => {
    mundoActual = 'bio';
    btnWorldBio.className = 'btn-world active-bio';
    if (btnWorldQui) btnWorldQui.className = 'btn-world';
    if (statsTitle) statsTitle.textContent = "Métricas Mundo Bio";
    if (resultsTitle) resultsTitle.textContent = "Listado de Biopreparados";
    if (statConditionalCard) statConditionalCard.innerHTML = 'Eficacia Alta <span id="stat-alta">0</span>';
    filtroFuncionActual = 'todos';
    resetearFiltrosBotones();
    calcularMetricasYRender();
  });
}

if (btnWorldQui) {
  btnWorldQui.addEventListener('click', () => {
    mundoActual = 'quimico';
    btnWorldQui.className = 'btn-world active-qui';
    if (btnWorldBio) btnWorldBio.className = 'btn-world';
    if (statsTitle) statsTitle.textContent = "Métricas Mundo Químico";
    if (resultsTitle) resultsTitle.textContent = "Listado de Productos Químicos";
    if (statConditionalCard) statConditionalCard.innerHTML = 'Sistémicos <span id="stat-alta">0</span>';
    filtroFuncionActual = 'todos';
    resetearFiltrosBotones();
    calcularMetricasYRender();
  });
}

function resetearFiltrosBotones() {
  filterButtons.forEach((btn, index) => {
    if (index === 0) btn.style.background = '#81c784';
    else btn.style.background = '#f1f8e9';
  });
}

// --- ESCUCHA DE FIREBASE EN TIEMPO REAL
onSnapshot(query(recetasRef), (snapshot) => {
  todosLosDatos = [];
  snapshot.forEach((doc) => {
    todosLosDatos.push({ id: doc.id, ...doc.data() });
  });
  calcularMetricasYRender();
});

// --- PROCESADOR Y TABLA ESTRUCTURADA DE DOSIS
function generarTablaDosisHTML(textoDosis, recipeId, esQuimico) {
  if (!textoDosis) return '<p><strong>Dosis:</strong> No especificada</p>';

  const textoLimpiado = textoDosis.replace(/BAJA ALTA|Baja|Alta/g, '').trim();
  const regexDoble = /(\d+\s*lts?|\d+\s*litros?)\s*=?\s*([\d\.,]+\s*(?:cc|lt|lts|ml|gr|g)?)\s+([\d\.,]+\s*(?:cc|lt|lts|ml|gr|g)?)/gi;
  let coincidenciasDobles = [...textoLimpiado.matchAll(regexDoble)];

  let tablaHTML = '';
  let baseAgua = 100;
  let dosisBaja = 0;
  let dosisAlta = 0;
  let unidad = 'cc';

  if (coincidenciasDobles.length > 0) {
    let filasHTML = '';
    coincidenciasDobles.forEach((match, index) => {
      const volumen = match[1].replace(/lts/i, 'Lt').replace(/lt/i, 'Lt');
      const dBaja = match[2];
      const dAlta = match[3];

      if (index === 0) {
        baseAgua = parseFloat(match[1]) || 100;
        dosisBaja = parseFloat(dBaja.replace(',', '.')) || 0;
        dosisAlta = parseFloat(dAlta.replace(',', '.')) || dosisBaja;
        const matchUnidad = dBaja.match(/[a-zA-Z]+/);
        if (matchUnidad) unidad = matchUnidad[0];
      }

      filasHTML += `
        <tr>
          <td><strong>${volumen}</strong></td>
          <td><span class="badge-baja">${dBaja}</span></td>
          <td><span class="badge-alta">${dAlta}</span></td>
        </tr>`;
    });

    tablaHTML = `
      <div style="margin-top: 12px;">
        <strong>Dosis Fitosanitaria Estructurada:</strong>
        <div class="tabla-dosis-container">
          <table class="tabla-dosis">
            <thead>
              <tr><th>Agua</th><th>Dosis Baja</th><th>Dosis Alta</th></tr>
            </thead>
            <tbody>${filasHTML}</tbody>
          </table>
        </div>
      </div>`;
  } else {
    const regexSimple = /(\d+\s*lts?|\d+\s*litros?)\s*=?\s*([\d\.,]+\s*(?:cc|lt|lts|ml|gr|g)?)/gi;
    let coincidenciasSimples = [...textoLimpiado.matchAll(regexSimple)];

    if (coincidenciasSimples.length > 0) {
      let filasHTML = '';
      coincidenciasSimples.forEach((match, index) => {
        const volumen = match[1].replace(/lts/i, 'Lt').replace(/lt/i, 'Lt');
        const dosisUnica = match[2];

        if (index === 0) {
          baseAgua = parseFloat(match[1]) || 100;
          dosisBaja = parseFloat(dosisUnica.replace(',', '.')) || 0;
          dosisAlta = dosisBaja;
          const matchUnidad = dosisUnica.match(/[a-zA-Z]+/);
          if (matchUnidad) unidad = matchUnidad[0];
        }

        filasHTML += `
          <tr>
            <td><strong>${volumen}</strong></td>
            <td colspan="2"><span class="badge-baja" style="background-color:#1976d2">${dosisUnica}</span></td>
          </tr>`;
      });

      tablaHTML = `
        <div style="margin-top: 12px;">
          <strong>Dosis Fitosanitaria Estructurada:</strong>
          <div class="tabla-dosis-container">
            <table class="tabla-dosis">
              <thead>
                <tr><th>Agua</th><th colspan="2">Dosis Recomendada</th></tr>
              </thead>
              <tbody>${filasHTML}</tbody>
            </table>
          </div>
        </div>`;
    } else {
      tablaHTML = `
        <div style="margin-top: 10px;">
          <strong>Dosis Fitosanitaria:</strong>
          <div style="background-color: #f5f5f5; padding: 8px 12px; border-radius: 6px;">${textoDosis}</div>
        </div>`;
    }
  }

  const calcClass = esQuimico ? 'calc-box calc-qui' : 'calc-box';

  return `
    ${tablaHTML}
    <!-- CALCULADORA MATEMÁTICA INTERACTIVA -->
    <div class="${calcClass}">
      <strong style="font-size: 13px;">Calculadora Rápida para Estanque:</strong>
      <div class="calc-row">
        <input type="number" class="calc-input input-litros" data-id="${recipeId}" placeholder="Litros de estanque (ej: 100)" value="100">
      </div>
      <div class="calc-row">
        <button type="button" class="btn-calc-type btn-prev active-preventivo" data-id="${recipeId}" data-base="${baseAgua}" data-dosis="${dosisBaja}" data-unidad="${unidad}">Preventivo (Baja)</button>
        <button type="button" class="btn-calc-type btn-cur" data-id="${recipeId}" data-base="${baseAgua}" data-dosis="${dosisAlta}" data-unidad="${unidad}">Curativo (Alta)</button>
      </div>
      <div class="calc-result-box" id="res-calc-${recipeId}">
        Mezclar: <strong>${dosisBaja} ${unidad}</strong> para 100 L
      </div>
    </div>`;
}

// --- ASIGNAR EVENTOS MATEMÁTICOS DE LA CALCULADORA
function activarCalculadorasEnPantalla() {
  document.querySelectorAll('.input-litros').forEach(input => {
    input.addEventListener('input', (e) => ejecutarCalculo(e.target.getAttribute('data-id')));
  });

  document.querySelectorAll('.btn-calc-type').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const esCurativo = e.target.classList.contains('btn-cur');
      const btnPrev = document.querySelector(`.btn-prev[data-id="${id}"]`);
      const btnCur = document.querySelector(`.btn-cur[data-id="${id}"]`);

      if (esCurativo) {
        btnCur.classList.add('active-curativo');
        btnPrev.classList.remove('active-preventivo');
      } else {
        btnPrev.classList.add('active-preventivo');
        btnCur.classList.remove('active-curativo');
      }
      ejecutarCalculo(id);
    });
  });
}

function ejecutarCalculo(id) {
  const inputLitros = document.querySelector(`.input-litros[data-id="${id}"]`);
  const btnCur = document.querySelector(`.btn-cur[data-id="${id}"]`);
  if (!inputLitros || !btnCur) return;

  const btnActivo = btnCur.classList.contains('active-curativo') ? btnCur : document.querySelector(`.btn-prev[data-id="${id}"]`);
  const resBox = document.getElementById(`res-calc-${id}`);
  if (!resBox || !btnActivo) return;

  const litrosUsuario = parseFloat(inputLitros.value) || 0;
  const baseAgua = parseFloat(btnActivo.getAttribute('data-base')) || 100;
  const dosisBase = parseFloat(btnActivo.getAttribute('data-dosis')) || 0;
  const unidad = btnActivo.getAttribute('data-unidad') || 'cc';

  if (litrosUsuario <= 0 || dosisBase <= 0) {
    resBox.innerHTML = '⚠️ Ingresa una cantidad válida de litros';
    return;
  }

  const resultadoCalculado = ((litrosUsuario / baseAgua) * dosisBase).toFixed(1);
  const modoTexto = btnCur.classList.contains('active-curativo') ? 'Curativo (Alta)' : 'Preventivo (Baja)';
  resBox.innerHTML = `Modo ${modoTexto}: Agregar <strong>${resultadoCalculado} ${unidad}</strong>`;
}

// --- CALCULAR MÉTRICAS Y MOSTRAR DATOS
function calcularMetricasYRender() {
  const datosDelMundo = todosLosDatos.filter(r => (r.tipo_registro || 'bio') === mundoActual);
  if (statTotal) statTotal.textContent = datosDelMundo.length;

  let condicionalContador = 0;
  datosDelMundo.forEach(r => {
    if (mundoActual === 'bio' && r.efectividad === 'Eficacia Alta') condicionalContador++;
    if (mundoActual === 'quimico' && r.modo_accion && r.modo_accion.includes('sistemico')) condicionalContador++;
  });

  const badgeAlta = document.getElementById('stat-alta');
  if (badgeAlta) badgeAlta.textContent = condicionalContador;

  const busqueda = searchInput ? searchInput.value.toLowerCase().trim() : '';
  if (!recipesContainer) return;

  recipesContainer.innerHTML = '';

  const filtrados = datosDelMundo.filter(r => {
    const coincideTxt = r.nombre.toLowerCase().includes(busqueda) ||
      (r.plagas_objetivo && r.plagas_objetivo.some(p => p.toLowerCase().includes(busqueda))) ||
      (r.ingrediente_activo && r.ingrediente_activo.toLowerCase().includes(busqueda));

    const coincideBtn = (filtroFuncionActual === 'todos' || (r.funcion && r.funcion.includes(filtroFuncionActual)));
    return coincideTxt && coincideBtn;
  });

  if (filtrados.length === 0) {
    recipesContainer.innerHTML = '<p class="loading-text">No se encontraron productos registrados.</p>';
    return;
  }

  filtrados.forEach(r => {
    const card = document.createElement('div');
    const esQui = r.tipo_registro === 'quimico';
    card.className = `recipe-card ${esQui ? 'card-qui' : 'card-bio'}`;

    const tagsHTML = r.funcion ? r.funcion.map(f => `<span class="tag ${esQui ? 'tag-qui-label' : ''}">${f}</span>`).join('') : '';
    const plagasHTML = r.plagas_objetivo && r.plagas_objetivo.length > 0 ? `<p style="font-size: 13px; color: #555;"><strong>Plagas:</strong> ${r.plagas_objetivo.join(', ')}</p>` : '';

    const botonesAccion = esAdmin ? `
      <div class="action-buttons">
        <button class="btn-action btn-edit" data-id="${r.id}">✏️</button>
        <button class="btn-action btn-delete" data-id="${r.id}">🗑️</button>
      </div>` : '';

    if (esQui) {
      const modosHTML = r.modo_accion && r.modo_accion.length > 0 ? r.modo_accion.join(', ') : 'No especificado';
      card.innerHTML = `
        ${botonesAccion}
        <h3 class="qui-title">${r.nombre}</h3>
        <div style="margin-bottom: 8px;">${tagsHTML}</div>
        <div class="info-box-qui">
          <p><strong>I. Activo:</strong> ${r.ingrediente_activo || 'No especificado'}</p>
          <p><strong>Modo Acción:</strong> ${modosHTML}</p>
        </div>
        ${generarTablaDosisHTML(r.modo_aplicacion, r.id, true)}
        <div style="margin-top: 8px;">${plagasHTML}</div>
        <button class="btn-toggle qui-toggle" data-id="${r.id}">Ver Carencia y Reentrada</button>
        <div class="extra-content" id="extra-${r.id}" style="display:none;">
          <p><strong>Período de Carencia:</strong> ${r.carencia || 'No indicado'}</p>
          <p><strong>Seguridad de Reentrada:</strong> ${r.reentrada || 'No indicado'}</p>
        </div>`;
    } else {
      const contraHTML = r.contraindicacion ? `<div class="warning-box">⚠️ ${r.contraindicacion}</div>` : '';
      card.innerHTML = `
        ${botonesAccion}
        <h3>${r.nombre}</h3>
        <div style="margin-bottom: 8px;">
          ${tagsHTML}
          <span class="tag-efectividad">${r.efectividad || 'En evaluación'}</span>
        </div>
        ${generarTablaDosisHTML(r.modo_aplicacion, r.id, false)}
        ${contraHTML}
        ${plagasHTML}
        <button class="btn-toggle" data-id="${r.id}">Ver Preparación e Ingredientes</button>
        <div class="extra-content" id="extra-${r.id}" style="display:none;">
          <p><strong>Ingredientes:</strong> ${r.ingredientes || 'No especificados'}</p>
          <p><strong>Preparación:</strong> ${r.preparacion || 'No especificada'}</p>
        </div>`;
    }

    recipesContainer.appendChild(card);
  });

  asignarEventosTarjetas();
  activarCalculadorasEnPantalla();
}

function asignarEventosTarjetas() {
  document.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const panel = document.getElementById(`extra-${id}`);
      if (panel.style.display === "block") {
        panel.style.display = "none";
        e.target.textContent = e.target.classList.contains('qui-toggle') ? "Ver Carencia y Reentrada" : "Ver Preparación e Ingredientes";
      } else {
        panel.style.display = "block";
        e.target.textContent = "Ocultar Detalles";
      }
    });
  });

  if (esAdmin) {
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const item = todosLosDatos.find(r => r.id === id);
        if (item) cargarItemEnFormulario(item);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm("¿Estás seguro de eliminar este registro?")) {
          await deleteDoc(doc(db, "recetas", id));
        }
      });
    });
  }
}

function cargarItemEnFormulario(item) {
  if (formTitle) formTitle.textContent = "Editar Registro Fitosanitario";
  if (btnFormSubmit) btnFormSubmit.textContent = "Actualizar Cambios";
  if (btnFormCancel) btnFormCancel.style.display = "block";
  document.getElementById('recipe-id').value = item.id;
  tipoRegistroSelect.value = item.tipo_registro || 'bio';
  alternarCamposFormulario(item.tipo_registro || 'bio');
  document.getElementById('recipe-name').value = item.nombre;
  document.getElementById('recipe-app').value = item.modo_aplicacion || '';
  document.getElementById('recipe-plagas').value = item.plagas_objetivo ? item.plagas_objetivo.join(', ') : '';

  document.querySelectorAll('input[name="funcion"]').forEach(cb => {
    cb.checked = item.funcion ? item.funcion.includes(cb.value) : false;
  });

  if ((item.tipo_registro || 'bio') === 'bio') {
    document.getElementById('recipe-efectividad').value = item.efectividad || 'En evaluación';
    document.getElementById('recipe-contra').value = item.contraindicacion || '';
    document.getElementById('recipe-ingredients').value = item.ingredientes || '';
    document.getElementById('recipe-prep').value = item.preparacion || '';
  } else {
    document.getElementById('recipe-activo').value = item.ingrediente_activo || '';
    document.getElementById('recipe-carencia').value = item.carencia || '';
    document.getElementById('recipe-reentrada').value = item.reentrada || '';
    document.querySelectorAll('input[name="modo_accion"]').forEach(cb => {
      cb.checked = item.modo_accion ? item.modo_accion.includes(cb.value) : false;
    });
  }

  recipeForm.scrollIntoView({ behavior: 'smooth' });
}

if (recipeForm) {
  recipeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!esAdmin) return alert("Acceso denegado: debes ser Administrador.");

    const id = document.getElementById('recipe-id').value;
    const tipo = tipoRegistroSelect.value;
    const funciones = [];
    document.querySelectorAll('input[name="funcion"]:checked').forEach(cb => funciones.push(cb.value));
    const plagasArray = document.getElementById('recipe-plagas').value.split(',').map(p => p.trim()).filter(p => p !== '');

    let datos = {
      tipo_registro: tipo,
      nombre: document.getElementById('recipe-name').value.trim(),
      funcion: funciones,
      plagas_objetivo: plagasArray,
      modo_aplicacion: document.getElementById('recipe-app').value.trim(),
      actualizado_el: new Date().toISOString()
    };

    if (tipo === 'bio') {
      datos.efectividad = document.getElementById('recipe-efectividad').value;
      datos.contraindicacion = document.getElementById('recipe-contra').value.trim();
      datos.ingredientes = document.getElementById('recipe-ingredients').value.trim();
      datos.preparacion = document.getElementById('recipe-prep').value.trim();
    } else {
      const modos = [];
      document.querySelectorAll('input[name="modo_accion"]:checked').forEach(cb => modos.push(cb.value));
      datos.ingrediente_activo = document.getElementById('recipe-activo').value.trim();
      datos.modo_accion = modos;
      datos.carencia = document.getElementById('recipe-carencia').value.trim();
      datos.reentrada = document.getElementById('recipe-reentrada').value.trim();
    }

    try {
      if (id === "") {
        await addDoc(recetasRef, datos);
        alert("¡Producto registrado con éxito!");
      } else {
        await updateDoc(doc(db, "recetas", id), datos);
        alert("¡Registro actualizado con éxito!");
      }
      resetearFormulario();
    } catch (err) {
      console.error(err);
      alert("Error al guardar en Firebase.");
    }
  });
}

function resetearFormulario() {
  if (formTitle) formTitle.textContent = "Agregar Nuevo Registro Fitosanitario";
  if (btnFormSubmit) btnFormSubmit.textContent = "Guardar Producto";
  if (btnFormCancel) btnFormCancel.style.display = "none";
  document.getElementById('recipe-id').value = "";
  if (recipeForm) recipeForm.reset();
  if (tipoRegistroSelect) tipoRegistroSelect.value = mundoActual;
  alternarCamposFormulario(mundoActual);
}

if (btnFormCancel) btnFormCancel.addEventListener('click', resetearFormulario);
if (searchInput) searchInput.addEventListener('input', calcularMetricasYRender);

filterButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    filtroFuncionActual = e.target.getAttribute('data-funcion');
    filterButtons.forEach(btn => btn.style.background = '#f1f8e9');
    e.target.style.background = '#81c784';
    calcularMetricasYRender();
  });
});

// --- LECTOR DE ETIQUETAS CON INTELIGENCIA ARTIFICIAL (REST API DIRECTA v1)
const btnTriggerAI = document.getElementById('btn-trigger-ai');
const aiImageInput = document.getElementById('ai-image-input');
const aiLoading = document.getElementById('ai-loading');

if (btnTriggerAI && aiImageInput) {
  btnTriggerAI.addEventListener('click', () => aiImageInput.click());

  aiImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (aiLoading) aiLoading.style.display = 'block';
    btnTriggerAI.disabled = true;

    // Validamos que sea una imagen (foto de cámara o archivo elegido en el PC)
    if (!file.type.startsWith('image/')) {
      alert("Por favor selecciona o toma una foto de la etiqueta (formato imagen: jpg, png, etc).");
      if (aiLoading) aiLoading.style.display = 'none';
      btnTriggerAI.disabled = false;
      aiImageInput.value = '';
      return;
    }

    try {
    
const resultado = await analizarEtiqueta(file);

if (!resultado.ok) {
    throw new Error(resultado.mensaje);
}

const datos = resultado.datos;

tipoRegistroSelect.value = datos.tipo_registro;
alternarCamposFormulario(datos.tipo_registro);

document.getElementById("recipe-name").value = datos.nombre;
document.getElementById("recipe-app").value = datos.dosis;
document.getElementById("recipe-plagas").value =
    datos.plagas_objetivo.join(", ");

document
.querySelectorAll('input[name="funcion"]')
.forEach(cb=>{

    cb.checked=
        datos.funcion
            .map(f=>f.toLowerCase())
            .includes(cb.value);

});

if(datos.tipo_registro==="quimico"){

    document.getElementById("recipe-activo").value=
        datos.ingrediente_activo;

    document.getElementById("recipe-carencia").value=
        datos.carencia;

    document.getElementById("recipe-reentrada").value=
        datos.reentrada;

    document
    .querySelectorAll('input[name="modo_accion"]')
    .forEach(cb=>{

        cb.checked=
            datos.modo_accion
                .map(m=>m.toLowerCase())
                .includes(cb.value);

    });

}
else{

    document.getElementById("recipe-ingredients").value=
        datos.ingrediente_activo;

}

alert("Información cargada correctamente.");
    } catch (error) {
      console.error("Error al procesar la foto con Gemini:", error);
      alert("No se pudo extraer la información automáticamente: " + error.message);
    } finally {
      if (aiLoading) aiLoading.style.display = 'none';
      btnTriggerAI.disabled = false;
      aiImageInput.value = '';
    }
  });
}

// --- FUNCIÓN DE COMPRESIÓN Y REDIMENSIONADO DE FOTOS
function comprimirYConvertirImagen(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}