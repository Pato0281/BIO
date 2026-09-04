<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        SanidadApp - Control Fitosanitario
    </title>

    <link
        rel="stylesheet"
        href="./styles.css"
    >

    <link
        rel="icon"
        type="image/png"
        href="./icon-192.png"
    >

    <link
        rel="apple-touch-icon"
        sizes="192x192"
        href="./icon-192.png"
    >

    <link
        rel="apple-touch-icon"
        sizes="512x512"
        href="./icon-512.png"
    >

    <link
        rel="manifest"
        href="./manifest.json"
    >

</head>


<body>


    <!-- ==================================================
         CABECERA
    =================================================== -->

    <header>

        <h1>
            🌿 SanidadApp
        </h1>

        <p>
            Control de Plagas y Manejo Fitosanitario Completo
        </p>


        <!-- ACCESO ADMIN -->

        <div
            id="admin-bar"
            style="margin-top:10px;"
        >

            <button
                id="btn-open-login"
                class="btn-admin-access"
                type="button"
            >
                🔐 Acceso Admin
            </button>


            <div
                id="admin-logged-info"
                style="display:none;"
            >

                <span
                    style="
                        font-size:13px;
                        font-weight:bold;
                    "
                >
                    👤 Modo Administrador
                </span>


                <button
                    id="btn-logout"
                    class="btn-logout"
                    type="button"
                >
                    Cerrar Sesión
                </button>

            </div>

        </div>

    </header>



    <main class="container">


        <!-- ==================================================
             MUNDOS
        =================================================== -->

        <div class="world-switcher">

            <button
                id="btn-world-bio"
                class="btn-world active-bio"
                type="button"
            >
                🍃 MUNDO BIO
            </button>


            <button
                id="btn-world-qui"
                class="btn-world"
                type="button"
            >
                🧪 MUNDO QUÍMICO
            </button>

        </div>



        <!-- ==================================================
             MÉTRICAS
        =================================================== -->

        <section class="stats-section">

            <h2 id="stats-title">
                Métricas Mundo Bio
            </h2>


            <div class="stats-grid">


                <div class="stat-card">

                    Total Registrados

                    <span id="stat-total">
                        0
                    </span>

                </div>


                <div
                    class="stat-card"
                    id="stat-conditional-card"
                >

                    Eficacia Alta

                    <span id="stat-alta">
                        0
                    </span>

                </div>


            </div>

        </section>



        <!-- ==================================================
             BUSCADOR
        =================================================== -->

        <section class="search-section">

            <h2>
                Buscar Fitosanitario
            </h2>


            <input
                type="text"
                id="search-input"
                placeholder="Buscar por plaga, nombre, o activo..."
            >


            <div
                class="filter-tags"
                id="tags-container"
            >

                <button
                    class="btn-filter"
                    data-funcion="todos"
                    type="button"
                    style="
                        background:#81c784;
                        font-weight:bold;
                    "
                >
                    Todos
                </button>


                <button
                    class="btn-filter"
                    data-funcion="insecticida"
                    type="button"
                >
                    Insecticidas
                </button>


                <button
                    class="btn-filter"
                    data-funcion="fungicida"
                    type="button"
                >
                    Fungicidas
                </button>


                <button
                    class="btn-filter"
                    data-funcion="herbicida"
                    type="button"
                >
                    Herbicidas
                </button>


                <button
                    class="btn-filter"
                    data-funcion="estimulante"
                    type="button"
                >
                    Estimulantes
                </button>

            </div>

        </section>



        <!-- ==================================================
             RESULTADOS
        =================================================== -->

        <section class="results-section">

            <h2 id="results-title">
                Listado de Biopreparados
            </h2>


            <div id="recipes-container">

                <p class="loading-text">
                    Cargando datos...
                </p>

            </div>

        </section>



        <!-- ==================================================
             FORMULARIO
        =================================================== -->

        <section class="form-section">

            <h2 id="form-title">
                Agregar Nuevo Registro Fitosanitario
            </h2>


            <form id="recipe-form">


                <input
                    type="hidden"
                    id="recipe-id"
                >



                <!-- ==================================================
                     1. ESCÁNER DE ETIQUETA
                =================================================== -->

                <div
                    id="ai-scanner-box"
                    style="
                        background:#e8f5e9;
                        border:2px dashed #4caf50;
                        padding:15px;
                        border-radius:8px;
                        margin-bottom:20px;
                        text-align:center;
                    "
                >

                    <h3
                        style="
                            margin-top:0;
                            color:#2e7d32;
                        "
                    >
                        📸 Escáner de Etiqueta con IA
                    </h3>


                    <p
                        style="
                            font-size:13px;
                            color:#424242;
                            margin-bottom:10px;
                        "
                    >
                        Sube o toma una fotografía de
                        la etiqueta o ficha del producto.
                    </p>


                    <input
                        type="file"
                        id="ai-image-input"
                        accept="image/*"
                        capture="environment"
                        style="display:none;"
                    >


                    <button
                        type="button"
                        id="btn-trigger-ai"
                        class="btn-submit"
                        style="
                            background:#2e7d32;
                            width:100%;
                            max-width:250px;
                        "
                    >
                        📷 Tomar / Cargar Foto
                    </button>


                    <div
                        id="ai-loading"
                        style="
                            display:none;
                            margin-top:10px;
                            font-weight:bold;
                            color:#1b5e20;
                        "
                    >
                        ⏳ Analizando etiqueta con IA...
                        Por favor espera unos segundos.
                    </div>

                </div>



                <!-- ==================================================
                     2. TIPO DE CONTROL
                =================================================== -->

                <label
                    for="form-tipo-registro"
                >
                    Tipo de Control:
                </label>


                <select
                    id="form-tipo-registro"
                >

                    <option value="bio">
                        Ecológico / BIO 🍃
                    </option>


                    <option value="quimico">
                        Químico / Sintético 🧪
                    </option>

                </select>



                <!-- ==================================================
                     3. IDENTIFICACIÓN DEL PRODUCTO
                =================================================== -->

                <div
                    id="identificacion-producto"
                    class="dynamic-section"
                >

                    <h3
                        style="
                            color:#1b5e20;
                            margin-top:0;
                        "
                    >
                        🔎 Identificación del Producto
                    </h3>


                    <!-- NOMBRE -->

                    <label
                        for="recipe-name"
                    >
                        Nombre Comercial / Producto:
                    </label>


                    <input
                        type="text"
                        id="recipe-name"
                        required
                        placeholder="Ej: Orthene 75 SP"
                    >



                    <!-- FUNCIÓN -->

                    <label>
                        Función Técnica
                        (Puedes marcar varias):
                    </label>


                    <div class="checkbox-group">

                        <label>

                            <input
                                type="checkbox"
                                name="funcion"
                                value="insecticida"
                            >

                            Insecticida

                        </label>


                        <label>

                            <input
                                type="checkbox"
                                name="funcion"
                                value="fungicida"
                            >

                            Fungicida

                        </label>


                        <label>

                            <input
                                type="checkbox"
                                name="funcion"
                                value="herbicida"
                            >

                            Herbicida

                        </label>


                        <label>

                            <input
                                type="checkbox"
                                name="funcion"
                                value="estimulante"
                            >

                            Estimulante Radicular

                        </label>

                    </div>



                    <!-- DATOS QUÍMICOS -->

                    <div
                        id="section-form-quimico"
                        class="dynamic-section"
                        style="
                            display:none;
                            border-color:#37474f;
                        "
                    >


                        <!-- INGREDIENTE ACTIVO -->

                        <label
                            for="recipe-activo"
                        >
                            Ingrediente Activo:
                        </label>


                        <input
                            type="text"
                            id="recipe-activo"
                            placeholder="Ej: Acefato"
                        >



                        <!-- CONCENTRACIÓN -->

                        <label
                            for="recipe-concentracion"
                        >
                            Concentración:
                        </label>


                        <input
                            type="text"
                            id="recipe-concentracion"
                            placeholder="Ej: 750 g/kg o 75 %"
                        >



                        <!-- MODO DE ACCIÓN -->

                        <label>
                            Modo de Acción
                            (Selecciona los que correspondan):
                        </label>


                        <div class="checkbox-group">

                            <label>

                                <input
                                    type="checkbox"
                                    name="modo_accion"
                                    value="contacto"
                                >

                                Contacto

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    name="modo_accion"
                                    value="sistemico"
                                >

                                Sistémico

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    name="modo_accion"
                                    value="digestivo"
                                >

                                Digestivo / Ingestión

                            </label>

                        </div>

                    </div>

                </div>



                <!-- ==================================================
                     4. PLAGAS / ENFERMEDADES A CONTROLAR
                =================================================== -->

                <div
                    id="plagas-control-section"
                    class="dynamic-section"
                >

                    <h3
                        style="
                            color:#1b5e20;
                            margin-top:0;
                            margin-bottom:5px;
                        "
                    >
                        🎯 Plaga o Enfermedad a Controlar
                    </h3>


                    <p
                        style="
                            margin-top:0;
                            font-size:13px;
                            color:#555;
                        "
                    >
                        Ingresa el problema que deseas
                        controlar en esta aplicación.
                    </p>


                    <!-- PLAGA 1 -->

                    <label
                        for="recipe-plaga-1"
                    >
                        Plaga / Enfermedad 1:
                    </label>


                    <input
                        type="text"
                        id="recipe-plaga-1"
                        placeholder="Ej: Trips"
                    >


                    <!-- PLAGA 2 -->

                    <label
                        for="recipe-plaga-2"
                    >
                        Plaga / Enfermedad 2:
                    </label>


                    <input
                        type="text"
                        id="recipe-plaga-2"
                        placeholder="Ej: Botrytis"
                    >


                    <!-- PLAGA 3 -->

                    <label
                        for="recipe-plaga-3"
                    >
                        Plaga / Enfermedad 3:
                    </label>


                    <input
                        type="text"
                        id="recipe-plaga-3"
                        placeholder="Ej: Pulgón"
                    >


                    <!-- PLAGA 4 -->

                    <label
                        for="recipe-plaga-4"
                    >
                        Plaga / Enfermedad 4:
                    </label>


                    <input
                        type="text"
                        id="recipe-plaga-4"
                        placeholder="Ej: Mosca blanca"
                    >


                    <!-- COMPATIBILIDAD CON VERSIONES ANTIGUAS -->

                    <input
                        type="hidden"
                        id="recipe-plagas"
                    >

                </div>



                <!-- ==================================================
                     5. DOSIFICACIÓN
                =================================================== -->

                <div
                    id="dosificacion-section"
                    style="
                        margin-top:18px;
                        padding:15px;
                        border:1px solid #c8e6c9;
                        border-radius:8px;
                        background:#fafafa;
                    "
                >

                    <h3
                        style="
                            margin-top:0;
                            margin-bottom:5px;
                            color:#2e7d32;
                        "
                    >
                        💧 Dosificación
                    </h3>


                    <p
                        style="
                            margin-top:0;
                            font-size:13px;
                            color:#555;
                        "
                    >
                        Ingresa las dosis tomando
                        <strong>100 L de agua</strong>
                        como referencia.
                    </p>


                    <div
                        style="
                            display:grid;
                            grid-template-columns:
                                1fr 1fr 1fr;
                            gap:10px;
                            align-items:end;
                        "
                    >


                        <!-- AGUA -->

                        <div>

                            <label
                                for="recipe-dose-water"
                            >
                                Agua:
                            </label>


                            <input
                                type="number"
                                id="recipe-dose-water"
                                value="100"
                                min="100"
                                readonly
                                style="
                                    background:#eeeeee;
                                    font-weight:bold;
                                "
                            >

                        </div>



                        <!-- DOSIS BAJA -->

                        <div>

                            <label
                                for="recipe-dose-low"
                            >
                                Dosis Baja
                                <small>
                                    (Preventivo)
                                </small>
                            </label>


                            <input
                                type="number"
                                id="recipe-dose-low"
                                min="0"
                                step="any"
                                placeholder="Ej: 25"
                            >

                        </div>



                        <!-- DOSIS ALTA -->

                        <div>

                            <label
                                for="recipe-dose-high"
                            >
                                Dosis Alta
                                <small>
                                    (Curativo)
                                </small>
                            </label>


                            <input
                                type="number"
                                id="recipe-dose-high"
                                min="0"
                                step="any"
                                placeholder="Ej: 100"
                            >

                        </div>

                    </div>



                    <!-- ==================================================
                         6. UNIDAD
                    =================================================== -->

                    <div
                        style="
                            margin-top:12px;
                        "
                    >

                        <label>
                            Tipo de producto / Unidad:
                        </label>


                        <div
                            class="checkbox-group"
                            style="
                                display:flex;
                                gap:18px;
                                flex-wrap:wrap;
                            "
                        >

                            <label>

                                <input
                                    type="radio"
                                    name="dose-unit"
                                    value="g"
                                >

                                g

                            </label>


                            <label>

                                <input
                                    type="radio"
                                    name="dose-unit"
                                    value="cc"
                                >

                                cc

                            </label>


                            <label>

                                <input
                                    type="radio"
                                    name="dose-unit"
                                    value="mL"
                                >

                                mL

                            </label>

                        </div>

                    </div>



                    <!-- MENSAJE VALIDACIÓN -->

                    <div
                        id="dose-validation-message"
                        style="
                            display:none;
                            margin-top:10px;
                            padding:8px 10px;
                            border-radius:6px;
                            background:#fff3cd;
                            color:#856404;
                            font-size:13px;
                        "
                    >
                    </div>



                    <!-- ==================================================
                         TABLA DE EQUIVALENCIAS
                    =================================================== -->

                    <div
                        id="dose-table-wrapper"
                        style="
                            display:none;
                            margin-top:18px;
                        "
                    >

                        <h4
                            style="
                                margin-bottom:10px;
                            "
                        >
                            Tabla de equivalencias
                        </h4>


                        <div
                            class="tabla-dosis-container"
                            style="
                                overflow-x:auto;
                            "
                        >

                            <table
                                class="tabla-dosis"
                                id="dose-table"
                            >

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


                                    <tr
                                        data-litros="1"
                                    >

                                        <td>
                                            <strong>
                                                1 L
                                            </strong>
                                        </td>


                                        <td
                                            id="dose-low-1"
                                        >
                                            —
                                        </td>


                                        <td
                                            id="dose-high-1"
                                        >
                                            —
                                        </td>

                                    </tr>



                                    <tr
                                        data-litros="15"
                                    >

                                        <td>
                                            <strong>
                                                15 L
                                            </strong>
                                        </td>


                                        <td
                                            id="dose-low-15"
                                        >
                                            —
                                        </td>


                                        <td
                                            id="dose-high-15"
                                        >
                                            —
                                        </td>

                                    </tr>



                                    <tr
                                        data-litros="100"
                                    >

                                        <td>
                                            <strong>
                                                100 L
                                            </strong>
                                        </td>


                                        <td
                                            id="dose-low-100"
                                        >
                                            —
                                        </td>


                                        <td
                                            id="dose-high-100"
                                        >
                                            —
                                        </td>

                                    </tr>



                                    <tr
                                        data-litros="160"
                                    >

                                        <td>
                                            <strong>
                                                160 L
                                            </strong>
                                        </td>


                                        <td
                                            id="dose-low-160"
                                        >
                                            —
                                        </td>


                                        <td
                                            id="dose-high-160"
                                        >
                                            —
                                        </td>

                                    </tr>


                                </tbody>

                            </table>

                        </div>



                        <!-- RESUMEN -->

                        <div
                            id="dose-confirmation-summary"
                            style="
                                margin-top:12px;
                                padding:10px;
                                background:#e8f5e9;
                                border-radius:6px;
                                font-size:13px;
                            "
                        >
                        </div>



                        <!-- CONFIRMACIÓN -->

                        <div
                            id="dose-confirm-box"
                            style="
                                margin-top:12px;
                                padding:12px;
                                border:1px solid #81c784;
                                border-radius:6px;
                                background:#f1f8e9;
                            "
                        >

                            <strong>
                                ¿Confirmas que las
                                dosificaciones ingresadas
                                son las correctas?
                            </strong>


                            <div
                                style="
                                    display:flex;
                                    gap:10px;
                                    margin-top:10px;
                                    flex-wrap:wrap;
                                "
                            >

                                <button
                                    type="button"
                                    id="btn-confirm-doses"
                                    class="btn-submit"
                                    style="
                                        background:#2e7d32;
                                    "
                                >
                                    ✅ Sí, confirmar
                                </button>


                                <button
                                    type="button"
                                    id="btn-cancel-doses"
                                    class="btn-cancel"
                                >
                                    ✖ Corregir
                                </button>

                            </div>


                            <div
                                id="dose-confirm-status"
                                style="
                                    display:none;
                                    margin-top:8px;
                                    font-size:13px;
                                    font-weight:bold;
                                    color:#2e7d32;
                                "
                            >
                                ✅ Dosificaciones confirmadas.
                            </div>

                        </div>

                    </div>

                </div>



                <!-- ==================================================
                     7. CARENCIA / REINGRESO
                =================================================== -->

                <div
                    id="seguridad-aplicacion"
                    class="dynamic-section"
                >

                    <h3
                        style="
                            color:#37474f;
                            margin-top:0;
                            margin-bottom:12px;
                        "
                    >
                        🛡️ Seguridad de Aplicación
                    </h3>


                    <!-- CARENCIA -->

                    <label
                        for="recipe-carencia"
                    >
                        ⏳ Días de Carencia:
                    </label>


                    <input
                        type="text"
                        id="recipe-carencia"
                        placeholder="Ej: 7 días"
                    >


                    <!-- REINGRESO -->

                    <label
                        for="recipe-reentrada"
                    >
                        🚪 Horas de Reentrada Segura:
                    </label>


                    <input
                        type="text"
                        id="recipe-reentrada"
                        placeholder="Ej: 12 horas"
                    >

                </div>



                <!-- ==================================================
                     MUNDO BIO
                =================================================== -->

                <div
                    id="section-form-bio"
                    class="dynamic-section"
                >

                    <label
                        for="recipe-efectividad"
                    >
                        Evaluación de Efectividad:
                    </label>


                    <select
                        id="recipe-efectividad"
                    >

                        <option
                            value="En fase de evaluación"
                        >
                            En fase de evaluación
                        </option>


                        <option
                            value="Eficacia Moderada"
                        >
                            Eficacia Moderada
                        </option>


                        <option
                            value="Eficacia Alta"
                        >
                            Eficacia Alta
                        </option>

                    </select>



                    <label
                        for="recipe-contra"
                    >
                        ⚠️ Contraindicaciones /
                        Advertencias:
                    </label>


                    <input
                        type="text"
                        id="recipe-contra"
                        placeholder="Ej: No aplicar a pleno sol."
                    >



                    <label
                        for="recipe-ingredients"
                    >
                        Ingredientes y Cantidades:
                    </label>


                    <textarea
                        id="recipe-ingredients"
                        rows="2"
                        placeholder="Ej: 1kg Ortiga fresca, 10L Agua"
                    ></textarea>



                    <label
                        for="recipe-prep"
                    >
                        Instrucciones de Preparación
                        (Paso a Paso):
                    </label>


                    <textarea
                        id="recipe-prep"
                        rows="2"
                        placeholder="Pasos para fermentar o mezclar..."
                    ></textarea>

                </div>



                <!-- ==================================================
                     BOTÓN GUARDAR
                =================================================== -->

                <button
                    type="submit"
                    class="btn-submit"
                    id="btn-form-submit"
                >
                    Guardar Producto
                </button>


                <button
                    type="button"
                    class="btn-cancel"
                    id="btn-form-cancel"
                    style="display:none;"
                >
                    Cancelar Edición
                </button>


            </form>

        </section>

    </main>



    <!-- ==================================================
         MODAL LOGIN
    =================================================== -->

    <div
        id="login-modal"
        class="modal-overlay"
        style="display:none;"
    >

        <div class="modal-content">


            <h3>
                🔒 Acceso Administrador
            </h3>


            <p>
                Ingresa tus credenciales para
                gestionar productos.
            </p>


            <form
                id="login-form"
            >


                <label
                    for="login-email"
                >
                    Correo:
                </label>


                <input
                    type="email"
                    id="login-email"
                    required
                    placeholder="tu@correo.com"
                >



                <label
                    for="login-password"
                >
                    Contraseña:
                </label>


                <input
                    type="password"
                    id="login-password"
                    required
                    placeholder="******"
                >



                <div class="modal-buttons">


                    <button
                        type="submit"
                        class="btn-submit"
                    >
                        Ingresar
                    </button>


                    <button
                        type="button"
                        id="btn-close-login"
                        class="btn-cancel"
                    >
                        Cancelar
                    </button>


                </div>


            </form>

        </div>

    </div>



    <!-- ==================================================
         APP.JS
    =================================================== -->

    <script
        type="module"
        src="./app.js"
    ></script>


</body>

</html>
