// =====================================================
// BÍO IA V6
// analizarEtiqueta.js
// =====================================================
//
// FLUJO:
//
// 1. Recibe fotografía
// 2. OpenRouter identifica producto
// 3. Busca producto en SAG Chile
// 4. Abre publicación SAG
// 5. Localiza etiqueta / HDS PDF
// 6. Lee el documento oficial
// 7. OpenRouter interpreta la documentación
// 8. Aplica reglas agronómicas BIO
// 9. Calcula dosis para 1 / 15 / 100 / 160 L
// 10. Interpreta 1X = preventivo / 2X = curativo
// 11. Devuelve JSON compatible con ia.js
//
// NO utiliza Gemini.
//
// =====================================================


// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_KEY =
    process.env.OPENROUTER_API_KEY;

const OPENROUTER_URL =
    "https://openrouter.ai/api/v1/chat/completions";

const MODELO =
    "openrouter/free";

const SAG_PUBLICACIONES =
    "https://www.sag.gob.cl/ambitos-de-accion/autorizacion-y-evaluacion-de-plaguicidas/publicaciones";

const SAG_DOMINIO =
    "https://www.sag.gob.cl";

const JINA_READER =
    "https://r.jina.ai/http://";

const MAX_DOCUMENT_CHARS =
    70000;

const MAX_PAGE_CHARS =
    50000;

const REQUEST_TIMEOUT =
    30000;


// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

exports.handler = async (event) => {

    console.log("========================================");
    console.log("BÍO IA V6 - INICIO");
    console.log("========================================");


    // -------------------------------------------------
    // MÉTODO
    // -------------------------------------------------

    if (event.httpMethod !== "POST") {

        return responder(
            405,
            {
                ok: false,
                mensaje:
                    "Método no permitido. Utilice POST."
            }
        );

    }


    try {

        // -------------------------------------------------
        // API KEY
        // -------------------------------------------------

        if (!API_KEY) {

            console.error(
                "OPENROUTER_API_KEY no está configurada."
            );

            return responder(
                500,
                {
                    ok: false,
                    mensaje:
                        "No está configurada OPENROUTER_API_KEY en Netlify.",
                    proveedor:
                        "OpenRouter",
                    modelo:
                        MODELO
                }
            );

        }


        // -------------------------------------------------
        // BODY
        // -------------------------------------------------

        const body =
            leerBody(event);


        let image =
            body.image ||
            body.imageBase64 ||
            "";


        const promptOriginal =
            body.prompt ||
            "";


        if (!image) {

            return responder(
                400,
                {
                    ok: false,
                    mensaje:
                        "No se recibió ninguna imagen."
                }
            );

        }


        // -------------------------------------------------
        // MIME
        // -------------------------------------------------

        let mimeType =
            "image/jpeg";


        if (
            image.startsWith("data:")
        ) {

            const match =
                image.match(
                    /^data:([^;]+);base64,/
                );

            if (
                match &&
                match[1]
            ) {

                mimeType =
                    match[1];

            }

        }


        // -------------------------------------------------
        // LIMPIAR DATA URL
        // -------------------------------------------------

        if (
            image.includes(",")
        ) {

            image =
                image.split(",")[1];

        }


        console.log(
            "Imagen recibida:",
            mimeType
        );

        console.log(
            "Tamaño Base64:",
            image.length
        );


        // -------------------------------------------------
        // ETAPA 1
        // IDENTIFICACIÓN VISUAL
        // -------------------------------------------------

        console.log(
            "ETAPA 1: Identificando producto..."
        );


        const identificacion =
            await identificarProducto(
                image,
                mimeType,
                promptOriginal
            );


        console.log(
            "Producto:",
            identificacion.nombre
        );

        console.log(
            "Ingrediente:",
            identificacion.ingrediente_activo
        );

        console.log(
            "Registro:",
            identificacion.registro
        );


        // -------------------------------------------------
        // ETAPA 2
        // BUSCAR SAG
        // -------------------------------------------------

        console.log(
            "ETAPA 2: Buscando producto en SAG..."
        );


        const sag =
            await buscarEnSAG(
                identificacion
            );


        console.log(
            "SAG:",
            JSON.stringify(
                sag
            )
        );


        // -------------------------------------------------
        // ETAPA 3
        // OBTENER DOCUMENTO
        // -------------------------------------------------

        let documento =
            "";


        let documentoURL =
            "";


        if (
            sag.pdfUrl
        ) {

            console.log(
                "ETAPA 3: Leyendo PDF SAG..."
            );


            documentoURL =
                sag.pdfUrl;


            documento =
                await leerDocumento(
                    sag.pdfUrl
                );

        }


        // -------------------------------------------------
        // FALLBACK: PÁGINA SAG
        // -------------------------------------------------

        if (
            !documento &&
            sag.productUrl
        ) {

            console.log(
                "No se pudo leer PDF. Intentando página SAG..."
            );


            documentoURL =
                sag.productUrl;


            documento =
                await leerDocumento(
                    sag.productUrl
                );

        }


        // -------------------------------------------------
        // ETAPA 4
        // INTERPRETACIÓN DOCUMENTAL
        // -------------------------------------------------

        let datos;


        if (
            documento
        ) {

            console.log(
                "ETAPA 4: Interpretando documentación oficial..."
            );


            datos =
                await interpretarDocumento(
                    identificacion,
                    documento,
                    promptOriginal
                );

        } else {

            console.log(
                "No se obtuvo documento SAG."
            );


            datos =
                normalizarDatos(
                    identificacion
                );

        }


        // -------------------------------------------------
        // ETAPA 5
        // REGLAS BIO
        // -------------------------------------------------

        console.log(
            "ETAPA 5: Aplicando reglas BIO..."
        );


        datos =
            aplicarReglasBIO(
                datos,
                documento
            );


        // -------------------------------------------------
        // ETAPA 6
        // DOSIS
        // -------------------------------------------------

        console.log(
            "ETAPA 6: Construyendo dosis BIO..."
        );


        datos.dosis =
            construirDosisBIO(
                datos.dosis
            );


        // -------------------------------------------------
        // FUENTE
        // -------------------------------------------------

        datos.observaciones =
            agregarFuente(
                datos.observaciones,
                sag,
                documentoURL
            );


        // -------------------------------------------------
        // LOG FINAL
        // -------------------------------------------------

        console.log(
            "========================================"
        );

        console.log(
            "BÍO IA V6 - RESULTADO"
        );

        console.log(
            "========================================"
        );

        console.log(
            JSON.stringify(
                datos
            )
        );


        // -------------------------------------------------
        // RESPUESTA
        // -------------------------------------------------

        return responder(
            200,
            {

                ok:
                    true,

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO,

                modelo_utilizado:
                    null,

                fuente:
                    sag.encontrado
                        ? "SAG Chile"
                        : "Imagen",

                fuente_url:
                    documentoURL ||
                    sag.productUrl ||
                    null,

                sag:
                    sag,

                datos:
                    datos

            }
        );


    } catch (error) {

        console.error(
            "========================================"
        );

        console.error(
            "ERROR BÍO IA V6"
        );

        console.error(
            error
        );

        console.error(
            "========================================"
        );


        return responder(
            500,
            {

                ok:
                    false,

                mensaje:
                    error?.message ||
                    String(error),

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO

            }
        );

    }

};


// =====================================================
// LEER BODY
// =====================================================

function leerBody(
    event
) {

    try {

        return JSON.parse(
            event.body ||
            "{}"
        );

    } catch {

        throw new Error(
            "El cuerpo de la solicitud no contiene JSON válido."
        );

    }

}


// =====================================================
// ETAPA 1
// IDENTIFICAR PRODUCTO
// =====================================================

async function identificarProducto(
    image,
    mimeType,
    promptOriginal
) {

    const prompt = `

Eres BÍO IA, especialista en protección vegetal
y productos agrícolas utilizados en Chile.

Analiza cuidadosamente la fotografía.

TU OBJETIVO PRINCIPAL ES IDENTIFICAR EL PRODUCTO.

NO INVENTES DATOS.

Identifica, cuando sea visible:

- nombre comercial
- ingrediente activo
- concentración
- formulación
- fabricante
- distribuidor
- registro
- contenido
- función
- plagas
- cultivos
- modo de acción

IMPORTANTE SOBRE MODO DE ACCIÓN:

Si la etiqueta dice:

"actividad sistémica"

devuelve:

"Sistémico"

Si dice:

"acción de contacto"

devuelve:

"Contacto"

Si dice:

"acción de ingestión"

devuelve:

"Ingestión"

Si indica más de uno,
devuelve todos.

NO inventes dosis.

NO inventes carencia.

NO inventes reentrada.

Devuelve EXCLUSIVAMENTE JSON válido.

ESTRUCTURA:

{
  "tipo_registro": "",
  "nombre": "",
  "fabricante": "",
  "registro": "",
  "funcion": [],
  "ingrediente_activo": "",
  "grupo_quimico": "",
  "concentracion": "",
  "formulacion": "",
  "dosis": "",
  "unidad_dosis": "",
  "mojamiento": "",
  "cultivos": [],
  "plagas_objetivo": [],
  "enfermedades": [],
  "malezas": [],
  "modo_accion": [],
  "carencia": "",
  "reentrada": "",
  "contenido": "",
  "compatibilidad": "",
  "observaciones": ""
}

Cuando algo no sea visible:

texto:
"No encontrado"

array:
[]

Información adicional:

${promptOriginal}

`;


    const data =
        await llamarOpenRouter(
            prompt,
            [
                {

                    type:
                        "image_url",

                    image_url:
                    {

                        url:
                            `data:${mimeType};base64,${image}`

                    }

                }
            ]
        );


    const texto =
        extraerTexto(
            data
        );


    const resultado =
        parsearJSON(
            texto
        );


    return normalizarDatos(
        resultado
    );

}


// =====================================================
// ETAPA 2
// BUSCAR EN SAG
// =====================================================

async function buscarEnSAG(
    identificacion
) {

    const nombre =
        limpiar(
            identificacion.nombre
        );


    const ingrediente =
        limpiar(
            identificacion.ingrediente_activo
        );


    const registro =
        limpiar(
            identificacion.registro
        );


    if (
        !nombre ||
        nombre === "No encontrado"
    ) {

        return {

            encontrado:
                false,

            mensaje:
                "No existe nombre comercial suficiente para buscar en SAG."

        };

    }


    try {

        // -------------------------------------------------
        // PRIMERA BÚSQUEDA:
        // NOMBRE COMERCIAL
        // -------------------------------------------------

        const resultadosNombre =
            await buscarPublicacionesSAG(
                nombre
            );


        console.log(
            "Resultados SAG por nombre:",
            resultadosNombre.length
        );


        let coincidencia =
            seleccionarMejorResultadoSAG(
                resultadosNombre,
                nombre,
                registro,
                ingrediente
            );


        // -------------------------------------------------
        // SEGUNDA BÚSQUEDA:
        // SI NO HAY RESULTADO
        // BUSCAR POR REGISTRO
        // -------------------------------------------------

        if (
            !coincidencia &&
            registro &&
            registro !== "No encontrado"
        ) {

            const resultadosRegistro =
                await buscarPublicacionesSAG(
                    registro
                );


            coincidencia =
                seleccionarMejorResultadoSAG(
                    resultadosRegistro,
                    nombre,
                    registro,
                    ingrediente
                );

        }


        // -------------------------------------------------
        // TERCERA BÚSQUEDA:
        // NOMBRE + INGREDIENTE
        // -------------------------------------------------

        if (
            !coincidencia &&
            ingrediente &&
            ingrediente !== "No encontrado"
        ) {

            const resultadosCombinados =
                await buscarPublicacionesSAG(
                    `${nombre} ${ingrediente}`
                );


            coincidencia =
                seleccionarMejorResultadoSAG(
                    resultadosCombinados,
                    nombre,
                    registro,
                    ingrediente
                );

        }


        if (
            !coincidencia
        ) {

            return {

                encontrado:
                    false,

                productoBuscado:
                    nombre,

                mensaje:
                    "No se encontró una publicación coincidente en SAG."

            };

        }


        // -------------------------------------------------
        // LEER PÁGINA DEL PRODUCTO
        // -------------------------------------------------

        let pagina =
            "";


        if (
            coincidencia.url
        ) {

            pagina =
                await fetchText(
                    coincidencia.url
                );

        }


        // -------------------------------------------------
        // BUSCAR PDF
        // -------------------------------------------------

        const pdfUrl =
            encontrarPDF(
                pagina
            );


        return {

            encontrado:
                true,

            producto:
                coincidencia.titulo,

            productUrl:
                coincidencia.url,

            pdfUrl:
                pdfUrl,

            empresa:
                coincidencia.empresa,

            ano:
                coincidencia.ano,

            fuente:
                "SAG Chile"

        };


    } catch (error) {

        console.error(
            "Error SAG:",
            error
        );


        return {

            encontrado:
                false,

            mensaje:
                "No fue posible consultar SAG.",

            error:
                error?.message ||
                String(error)

        };

    }

}


// =====================================================
// BUSCAR PUBLICACIONES SAG
// =====================================================

async function buscarPublicacionesSAG(
    termino
) {

    const url =
        SAG_PUBLICACIONES +
        "?title=" +
        encodeURIComponent(
            termino
        );


    console.log(
        "Consulta SAG:",
        url
    );


    const html =
        await fetchText(
            url
        );


    return extraerResultadosSAG(
        html
    );

}


// =====================================================
// EXTRAER RESULTADOS SAG
// =====================================================

function extraerResultadosSAG(
    html
) {

    if (
        !html
    ) {

        return [];

    }


    const resultados =
        [];


    const regex =
        /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


    let match;


    while (
        (match =
            regex.exec(
                html
            )) !== null
    ) {

        const href =
            convertirURL(
                decodeHTML(
                    match[1]
                )
            );


        const texto =
            limpiarEspacios(
                stripHTML(
                    match[2]
                )
            );


        if (
            !texto
        ) {

            continue;

        }


        if (
            href.includes(
                "sag.gob.cl/content/"
            )
        ) {

            resultados.push(
                {

                    titulo:
                        texto,

                    url:
                        href,

                    empresa:
                        "",

                    ano:
                        ""

                }
            );

        }

    }


    return eliminarDuplicados(
        resultados
    );

}


// =====================================================
// SELECCIONAR MEJOR RESULTADO SAG
// =====================================================

function seleccionarMejorResultadoSAG(
    resultados,
    nombre,
    registro,
    ingrediente
) {

    if (
        !Array.isArray(
            resultados
        ) ||
        resultados.length === 0
    ) {

        return null;

    }


    const nombreN =
        normalizarTexto(
            nombre
        );


    const registroN =
        normalizarTexto(
            registro
        );


    const ingredienteN =
        normalizarTexto(
            ingrediente
        );


    let mejor =
        null;


    let mejorPuntaje =
        0;


    for (
        const resultado
        of resultados
    ) {

        const tituloN =
            normalizarTexto(
                resultado.titulo
            );


        let puntaje =
            0;


        // Coincidencia exacta
        if (
            tituloN ===
            nombreN
        ) {

            puntaje +=
                100;

        }


        // Nombre incluido
        if (
            tituloN.includes(
                nombreN
            )
        ) {

            puntaje +=
                60;

        }


        if (
            nombreN.includes(
                tituloN
            )
        ) {

            puntaje +=
                30;

        }


        // Registro
        if (
            registroN &&
            registroN !== "no encontrado" &&
            tituloN.includes(
                registroN
            )
        ) {

            puntaje +=
                30;

        }


        // Ingrediente
        if (
            ingredienteN &&
            ingredienteN !== "no encontrado" &&
            tituloN.includes(
                ingredienteN
            )
        ) {

            puntaje +=
                10;

        }


        if (
            puntaje >
            mejorPuntaje
        ) {

            mejorPuntaje =
                puntaje;

            mejor =
                resultado;

        }

    }


    return mejor;

}


// =====================================================
// ENCONTRAR PDF
// =====================================================

function encontrarPDF(
    html
) {

    if (
        !html
    ) {

        return "";

    }


    // Buscar cualquier href terminado en PDF
    const regex =
        /href=["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi;


    let match;


    while (
        (match =
            regex.exec(
                html
            )) !== null
    ) {

        return convertirURL(
            decodeHTML(
                match[1]
            )
        );

    }


    // Algunos sitios usan mayúsculas
    const regex2 =
        /href=["']([^"']+\.PDF(?:\?[^"']*)?)["']/g;


    const match2 =
        regex2.exec(
            html
        );


    if (
        match2
    ) {

        return convertirURL(
            decodeHTML(
                match2[1]
            )
        );

    }


    return "";

}


// =====================================================
// LEER DOCUMENTO
// =====================================================

async function leerDocumento(
    url
) {

    if (
        !url
    ) {

        return "";

    }


    try {

        console.log(
            "Documento:",
            url
        );


        // -------------------------------------------------
        // PDF
        // -------------------------------------------------

        if (
            /\.pdf(?:$|\?)/i.test(
                url
            )
        ) {

            const jinaURL =
                construirJinaURL(
                    url
                );


            const texto =
                await fetchText(
                    jinaURL
                );


            return texto
                ? texto.slice(
                    0,
                    MAX_DOCUMENT_CHARS
                )
                : "";

        }


        // -------------------------------------------------
        // HTML
        // -------------------------------------------------

        const html =
            await fetchText(
                url
            );


        if (
            !html
        ) {

            return "";

        }


        const texto =
            stripHTML(
                html
            );


        return limpiarEspacios(
            texto
        ).slice(
            0,
            MAX_PAGE_CHARS
        );


    } catch (error) {

        console.error(
            "Error leyendo documento:",
            error
        );


        return "";

    }

}


// =====================================================
// CONSTRUIR URL JINA
// =====================================================

function construirJinaURL(
    url
) {

    const limpio =
        url.replace(
            /^https?:\/\//i,
            ""
        );


    return (
        "https://r.jina.ai/http://" +
        limpio
    );

}


// =====================================================
// ETAPA 4
// INTERPRETAR DOCUMENTACIÓN
// =====================================================

async function interpretarDocumento(
    identificacion,
    documento,
    promptOriginal
) {

    const prompt = `

Eres BÍO IA, especialista en fitosanidad,
protección vegetal y uso de productos agrícolas
en Chile.

Tienes una identificación inicial del producto
y una documentación obtenida desde SAG Chile.

Debes completar la información utilizando
PRIORITARIAMENTE el documento oficial.

=========================================
REGLA FUNDAMENTAL
=========================================

NO INVENTES.

Cuando un dato no esté respaldado:

"No encontrado"

=========================================
PRIORIDAD
=========================================

1. Etiqueta oficial SAG.
2. HDS/documentación oficial SAG.
3. Información visible de la fotografía.

=========================================
CRISANTEMO Y FLORES
=========================================

Si la aplicación trabaja con CRISANTEMO:

1. Buscar primero:
   - crisantemo
   - flores
   - ornamentales

2. Si no existe recomendación específica,
   utilizar HORTALIZAS / VERDURAS como
   referencia agronómica BIO.

3. Nunca utilizar:
   - árboles
   - vides

MUY IMPORTANTE:

Si se utiliza hortalizas como referencia,
debe indicarse:

"Referencia agronómica BIO tomada de hortalizas
por ausencia de recomendación específica para
crisantemo/flores."

Esto NO debe presentarse como autorización SAG
para crisantemo.

=========================================
MODO DE ACCIÓN
=========================================

Buscar expresamente:

- sistémico
- contacto
- ingestión
- translaminar
- fumigante
- preventivo
- curativo
- erradicante
- residual

Si la etiqueta dice:

"actividad sistémica"

→ "Sistémico"

Si dice:

"acción de contacto"

→ "Contacto"

Si dice:

"acción de ingestión"

→ "Ingestión"

Si existen varios,
devolver todos.

También buscar:

- IRAC
- FRAC
- HRAC

=========================================
DOSIS
=========================================

Extrae exactamente la dosis oficial.

Puede estar expresada como:

- g/100 L
- kg/100 L
- mL/100 L
- L/100 L
- g/ha
- kg/ha
- mL/ha
- L/ha

NO asumir una unidad distinta.

=========================================
1X / 2X
=========================================

REGLA BIO:

1X = PREVENTIVO = presión baja

2X = CURATIVO = presión alta

Si el documento dice:

1X–2X

interpretar:

1X → Preventivo

2X → Curativo

Si el documento dice que la dosis mayor
se utiliza para alta presión de plaga,
puede relacionarse:

dosis menor → presión baja / preventivo

dosis mayor → presión alta / curativo

Pero NO inventes esta relación si el documento
no la respalda.

=========================================
CARRENCIA
=========================================

Prioridad:

1. cultivo específico
2. flores / ornamentales
3. invernadero
4. otro dato oficial aplicable

No confundir carencia con reingreso.

=========================================
REINGRESO
=========================================

Prioridad:

1. invernadero
2. cultivo específico
3. general

=========================================
DOSIS PARA BIO
=========================================

La aplicación debe entregar referencias para:

1 L
15 L
100 L
160 L

Si la dosis es por 100 L:

30 g/100 L

entonces:

1 L = 0,30 g
15 L = 4,50 g
100 L = 30 g
160 L = 48 g

Si es un rango,
mantener el rango.

Si la dosis es por hectárea,
NO convertir directamente a litros
sin disponer del mojamiento oficial.

=========================================
PRODUCTO IDENTIFICADO
=========================================

${JSON.stringify(
    identificacion
)}

=========================================
DOCUMENTACIÓN SAG
=========================================

${documento}

=========================================
INFORMACIÓN ADICIONAL
=========================================

${promptOriginal}

=========================================
RESPUESTA
=========================================

Devuelve EXCLUSIVAMENTE JSON válido:

{
  "tipo_registro": "",
  "nombre": "",
  "fabricante": "",
  "registro": "",
  "funcion": [],
  "ingrediente_activo": "",
  "grupo_quimico": "",
  "concentracion": "",
  "formulacion": "",
  "dosis": "",
  "unidad_dosis": "",
  "mojamiento": "",
  "cultivos": [],
  "plagas_objetivo": [],
  "enfermedades": [],
  "malezas": [],
  "modo_accion": [],
  "carencia": "",
  "reentrada": "",
  "contenido": "",
  "compatibilidad": "",
  "observaciones": ""
}

`;


    const data =
        await llamarOpenRouter(
            prompt,
            []
        );


    const texto =
        extraerTexto(
            data
        );


    return normalizarDatos(
        parsearJSON(
            texto
        )
    );

}


// =====================================================
// REGLAS BIO
// =====================================================

function aplicarReglasBIO(
    datos,
    documento
) {

    // -------------------------------------------------
    // TEXTO DOCUMENTAL
    // -------------------------------------------------

    const doc =
        normalizarTexto(
            documento || ""
        );


    // -------------------------------------------------
    // MODO DE ACCIÓN
    // -------------------------------------------------

    let acciones =
        Array.isArray(
            datos.modo_accion
        )
            ? datos.modo_accion
            : [];


    const agregarAccion =
        (accion) => {

            const existe =
                acciones.some(
                    x =>
                        normalizarTexto(
                            x
                        ) ===
                        normalizarTexto(
                            accion
                        )
                );


            if (
                !existe
            ) {

                acciones.push(
                    accion
                );

            }

        };


    if (
        doc.includes(
            "actividad sistemica"
        ) ||
        doc.includes(
            "accion sistemica"
        ) ||
        doc.includes(
            "sistemico"
        )
    ) {

        agregarAccion(
            "Sistémico"
        );

    }


    if (
        doc.includes(
            "accion de contacto"
        ) ||
        doc.includes(
            "accion contacto"
        ) ||
        doc.includes(
            "de contacto"
        )
    ) {

        agregarAccion(
            "Contacto"
        );

    }


    if (
        doc.includes(
            "accion de ingestion"
        ) ||
        doc.includes(
            "accion de ingestión"
        ) ||
        doc.includes(
            "de ingestión"
        )
    ) {

        agregarAccion(
            "Ingestión"
        );

    }


    if (
        doc.includes(
            "translaminar"
        )
    ) {

        agregarAccion(
            "Translaminar"
        );

    }


    if (
        doc.includes(
            "preventivo"
        )
    ) {

        agregarAccion(
            "Preventivo"
        );

    }


    if (
        doc.includes(
            "curativo"
        )
    ) {

        agregarAccion(
            "Curativo"
        );

    }


    datos.modo_accion =
        acciones;


    // -------------------------------------------------
    // 1X / 2X
    // -------------------------------------------------

    const dosisOriginal =
        String(
            datos.dosis ||
            ""
        );


    let dosisBIO =
        dosisOriginal;


    if (
        /1\s*x/i.test(
            dosisOriginal
        ) ||
        /2\s*x/i.test(
            dosisOriginal
        )
    ) {

        if (
            !/preventivo/i.test(
                dosisBIO
            )
        ) {

            dosisBIO +=
                " | 1X = Preventivo";

        }


        if (
            !/curativo/i.test(
                dosisBIO
            )
        ) {

            dosisBIO +=
                " | 2X = Curativo";

        }

    }


    datos.dosis =
        dosisBIO;


    // -------------------------------------------------
    // ALTA PRESIÓN
    // -------------------------------------------------

    if (
        doc.includes(
            "alta presion"
        ) ||
        doc.includes(
            "alta presión"
        ) ||
        doc.includes(
            "presion alta"
        ) ||
        doc.includes(
            "presión alta"
        )
    ) {

        if (
            !normalizarTexto(
                datos.observaciones
            ).includes(
                "presion alta"
            )
        ) {

            datos.observaciones +=
                " La dosis mayor se relaciona con alta presión de plaga cuando así lo establece la documentación.";

        }

    }


    // -------------------------------------------------
    // REGLA CRISANTEMO
    // -------------------------------------------------

    const cultivos =
        datos.cultivos.join(
            " "
        );


    const cultivosN =
        normalizarTexto(
            cultivos
        );


    if (
        cultivosN.includes(
            "crisantemo"
        )
    ) {

        // Ya existe recomendación directa.
        return datos;

    }


    if (
        cultivosN.includes(
            "flor"
        ) ||
        cultivosN.includes(
            "ornamental"
        )
    ) {

        return datos;

    }


    // -------------------------------------------------
    // No hacemos una falsa autorización.
    // La asociación con hortalizas se marca en
    // observaciones y se utilizará como regla BIO
    // cuando falte crisantemo/flores.
    // -------------------------------------------------

    if (
        datos.nombre &&
        datos.nombre !==
            "No encontrado"
    ) {

        if (
            !normalizarTexto(
                datos.observaciones
            ).includes(
                "hortalizas"
            )
        ) {

            datos.observaciones +=
                " Regla BIO: si no existe recomendación específica para crisantemo/flores, utilizar hortalizas como referencia agronómica y nunca árboles o vides.";

        }

    }


    return datos;

}


// =====================================================
// DOSIS BIO
// =====================================================

function construirDosisBIO(
    dosis
) {

    if (
        !dosis
    ) {

        return "No encontrado";

    }


    const original =
        String(
            dosis
        ).trim();


    if (
        normalizarTexto(
            original
        ) ===
        "no encontrado"
    ) {

        return original;

    }


    // -------------------------------------------------
    // Rango:
    //
    // 30-40 g / 100 L
    // 30 a 40 g / 100 L
    // -------------------------------------------------

    const rango =
        original.match(
            /(\d+(?:[.,]\d+)?)\s*(?:-|a)\s*(\d+(?:[.,]\d+)?)\s*(mg|g|kg|ml|mL|cc|l|L)\s*\/\s*100\s*(?:l|L)/i
        );


    if (
        rango
    ) {

        const a =
            parseNumber(
                rango[1]
            );


        const b =
            parseNumber(
                rango[2]
            );


        const unidad =
            normalizarUnidad(
                rango[3]
            );


        const calculos =
            construirCalculos(
                a,
                b,
                unidad
            );


        let resultado =
            original +
            "\n\nCálculo BIO por volumen de agua:";


        resultado +=
            calculos;


        if (
            /1\s*x/i.test(
                original
            ) ||
            /2\s*x/i.test(
                original
            )
        ) {

            resultado +=
                "\n1X = Preventivo (presión baja)";

            resultado +=
                "\n2X = Curativo (presión alta)";

        }


        return resultado;

    }


    // -------------------------------------------------
    // Dosis única:
    //
    // 30 g / 100 L
    // -------------------------------------------------

    const unica =
        original.match(
            /(\d+(?:[.,]\d+)?)\s*(mg|g|kg|ml|mL|cc|l|L)\s*\/\s*100\s*(?:l|L)/i
        );


    if (
        unica
    ) {

        const valor =
            parseNumber(
                unica[1]
            );


        const unidad =
            normalizarUnidad(
                unica[2]
            );


        const calculos =
            construirCalculos(
                valor,
                null,
                unidad
            );


        let resultado =
            original +
            "\n\nCálculo BIO por volumen de agua:";


        resultado +=
            calculos;


        if (
            /1\s*x/i.test(
                original
            ) ||
            /2\s*x/i.test(
                original
            )
        ) {

            resultado +=
                "\n1X = Preventivo (presión baja)";

            resultado +=
                "\n2X = Curativo (presión alta)";

        }


        return resultado;

    }


    // -------------------------------------------------
    // Dosis por hectárea:
    //
    // No convertir sin mojamiento.
    // -------------------------------------------------

    if (
        /\/\s*ha/i.test(
            original
        ) ||
        /por\s+hect[aá]rea/i.test(
            original
        )
    ) {

        return (
            original +
            "\n\nCálculo BIO para 1 / 15 / 100 / 160 L: requiere mojamiento oficial de referencia para convertir una dosis por hectárea. No se realiza una conversión inventada."
        );

    }


    return original;

}


// =====================================================
// CALCULOS 1 / 15 / 100 / 160 L
// =====================================================

function construirCalculos(
    valor1,
    valor2,
    unidad
) {

    const litros =
        [
            1,
            15,
            100,
            160
        ];


    let resultado =
        "";


    for (
        const L
        of litros
    ) {

        const a =
            valor1 *
            L /
            100;


        const b =
            valor2 != null
                ? valor2 *
                    L /
                    100
                : null;


        if (
            b != null
        ) {

            resultado +=
                `\n${L} L = ${formatear(a)}-${formatear(b)} ${unidad}`;

        } else {

            resultado +=
                `\n${L} L = ${formatear(a)} ${unidad}`;

        }

    }


    return resultado;

}


// =====================================================
// NORMALIZAR DATOS
// =====================================================

function normalizarDatos(
    datos
) {

    if (
        !datos ||
        typeof datos !== "object" ||
        Array.isArray(
            datos
        )
    ) {

        datos =
            {};

    }


    const strings =
        [

            "tipo_registro",
            "nombre",
            "fabricante",
            "registro",
            "ingrediente_activo",
            "grupo_quimico",
            "concentracion",
            "formulacion",
            "dosis",
            "unidad_dosis",
            "mojamiento",
            "carencia",
            "reentrada",
            "contenido",
            "compatibilidad",
            "observaciones"

        ];


    const arrays =
        [

            "funcion",
            "cultivos",
            "plagas_objetivo",
            "enfermedades",
            "malezas",
            "modo_accion"

        ];


    for (
        const campo
        of strings
    ) {

        if (
            typeof datos[campo] !==
                "string" ||
            !datos[campo].trim()
        ) {

            datos[campo] =
                "No encontrado";

        }

    }


    for (
        const campo
        of arrays
    ) {

        if (
            !Array.isArray(
                datos[campo]
            )
        ) {

            if (
                datos[campo] &&
                String(
                    datos[campo]
                ).trim()
            ) {

                datos[campo] =
                    [
                        String(
                            datos[campo]
                        ).trim()
                    ];

            } else {

                datos[campo] =
                    [];

            }

        }

    }


    return datos;

}


// =====================================================
// NORMALIZAR UNIDAD
// =====================================================

function normalizarUnidad(
    unidad
) {

    const u =
        String(
            unidad
        ).toLowerCase();


    if (
        u === "ml" ||
        u === "cc"
    ) {

        return "mL";

    }


    if (
        u === "l"
    ) {

        return "L";

    }


    if (
        u === "kg"
    ) {

        return "kg";

    }


    if (
        u === "mg"
    ) {

        return "mg";

    }


    return "g";

}


// =====================================================
// PARSEAR NÚMERO
// =====================================================

function parseNumber(
    valor
) {

    return parseFloat(
        String(
            valor
        ).replace(
            ",",
            "."
        )
    );

}


// =====================================================
// FORMATEAR
// =====================================================

function formatear(
    valor
) {

    if (
        Number.isInteger(
            valor
        )
    ) {

        return String(
            valor
        );

    }


    return Number(
        valor.toFixed(
            4
        )
    )
        .toString()
        .replace(
            ".",
            ","
        );

}


// =====================================================
// LIMPIAR
// =====================================================

function limpiar(
    valor
) {

    return typeof valor ===
        "string"
        ? valor.trim()
        : "";

}


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function normalizarTexto(
    texto
) {

    return String(
        texto || ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            " "
        )
        .trim();

}


// =====================================================
// LIMPIAR HTML
// =====================================================

function stripHTML(
    html
) {

    return String(
        html || ""
    )
        .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        )
        .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        )
        .replace(
            /<[^>]+>/g,
            " "
        );

}


// =====================================================
// LIMPIAR ESPACIOS
// =====================================================

function limpiarEspacios(
    texto
) {

    return String(
        texto || ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// =====================================================
// DECODE HTML
// =====================================================

function decodeHTML(
    texto
) {

    return String(
        texto || ""
    )
        .replace(
            /&amp;/gi,
            "&"
        )
        .replace(
            /&quot;/gi,
            '"'
        )
        .replace(
            /&#39;/gi,
            "'"
        )
        .replace(
            /&nbsp;/gi,
            " "
        );

}


// =====================================================
// CONVERTIR URL
// =====================================================

function convertirURL(
    href
) {

    if (
        !href
    ) {

        return "";

    }


    if (
        /^https?:\/\//i.test(
            href
        )
    ) {

        return href;

    }


    if (
        href.startsWith(
            "//"
        )
    ) {

        return "https:" +
            href;

    }


    if (
        href.startsWith("/")
    ) {

        return SAG_DOMINIO +
            href;

    }


    return SAG_DOMINIO +
        "/" +
        href.replace(
            /^\/+/,
            ""
        );

}


// =====================================================
// DUPLICADOS
// =====================================================

function eliminarDuplicados(
    resultados
) {

    const vistos =
        new Set();


    return resultados.filter(
        item => {

            const clave =
                item.url +
                "|" +
                item.titulo;


            if (
                vistos.has(
                    clave
                )
            ) {

                return false;

            }


            vistos.add(
                clave
            );


            return true;

        }
    );

}


// =====================================================
// OPENROUTER
// =====================================================

async function llamarOpenRouter(
    prompt,
    elementos
) {

    const content =
        [
            {
                type:
                    "text",
                text:
                    prompt
            }
        ];


    if (
        Array.isArray(
            elementos
        )
    ) {

        content.push(
            ...elementos
        );

    }


    const payload =
        {

            model:
                MODELO,

            temperature:
                0.1,

            response_format:
                {
                    type:
                        "json_object"
                },

            messages:
                [

                    {

                        role:
                            "user",

                        content:
                            content

                    }

                ]

        };


    const response =
        await fetch(
            OPENROUTER_URL,
            {

                method:
                    "POST",

                headers:
                {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${API_KEY}`,

                    "HTTP-Referer":
                        "https://bio-ia-2026.netlify.app",

                    "X-Title":
                        "BÍO IA"

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(
                text
            );

    } catch {

        data =
            {
                raw:
                    text
            };

    }


    console.log(
        "OpenRouter HTTP:",
        response.status
    );


    console.log(
        "OpenRouter modelo:",
        data?.model ||
            "No informado"
    );


    if (
        !response.ok
    ) {

        throw new Error(
            data?.error?.message ||
            `OpenRouter HTTP ${response.status}`
        );

    }


    return data;

}


// =====================================================
// EXTRAER TEXTO
// =====================================================

function extraerTexto(
    data
) {

    const content =
        data?.choices?.[0]
            ?.message
            ?.content;


    if (
        typeof content ===
        "string"
    ) {

        return content;

    }


    if (
        Array.isArray(
            content
        )
    ) {

        return content
            .map(
                part =>
                    part?.text ||
                    ""
            )
            .filter(
                Boolean
            )
            .join(
                "\n"
            );

    }


    return "";

}


// =====================================================
// PARSEAR JSON
// =====================================================

function parsearJSON(
    texto
) {

    if (
        !texto
    ) {

        throw new Error(
            "La IA no devolvió contenido."
        );

    }


    let limpio =
        String(
            texto
        ).trim();


    if (
        limpio.startsWith(
            "```json"
        )
    ) {

        limpio =
            limpio.slice(
                7
            );

    }


    if (
        limpio.startsWith(
            "```"
        )
    ) {

        limpio =
            limpio.slice(
                3
            );

    }


    if (
        limpio.endsWith(
            "```"
        )
    ) {

        limpio =
            limpio.slice(
                0,
                -3
            );

    }


    limpio =
        limpio.trim();


    try {

        return JSON.parse(
            limpio
        );

    } catch {


        const inicio =
            limpio.indexOf(
                "{"
            );


        const fin =
            limpio.lastIndexOf(
                "}"
            );


        if (
            inicio !== -1 &&
            fin !== -1 &&
            fin > inicio
        ) {

            return JSON.parse(
                limpio.slice(
                    inicio,
                    fin + 1
                )
            );

        }


        throw new Error(
            "La respuesta de la IA no es JSON válido."
        );

    }

}


// =====================================================
// AGREGAR FUENTE
// =====================================================

function agregarFuente(
    observaciones,
    sag,
    documentoURL
) {

    let resultado =
        normalizarTexto(
            observaciones
        ) ===
        "no encontrado"
            ? ""
            : String(
                observaciones
            );


    if (
        sag.encontrado
    ) {

        resultado +=
            " Fuente oficial consultada: SAG Chile.";

    }


    if (
        documentoURL
    ) {

        resultado +=
            ` Documento consultado: ${documentoURL}`;

    }


    if (
        !resultado.trim()
    ) {

        resultado =
            "No encontrado";

    }


    return resultado.trim();

}


// =====================================================
// RESPONDER
// =====================================================

function responder(
    statusCode,
    body
) {

    return {

        statusCode:
            statusCode,

        headers:
        {

            "Content-Type":
                "application/json; charset=utf-8",

            "Cache-Control":
                "no-store",

            "Access-Control-Allow-Origin":
                "*"

        },

        body:
            JSON.stringify(
                body
            )

    };

}


// =====================================================
// FETCH CON TIMEOUT
// =====================================================

async function fetchText(
    url
) {

    const controller =
        new AbortController();


    const timer =
        setTimeout(
            () =>
                controller.abort(),
            REQUEST_TIMEOUT
        );


    try {

        const response =
            await fetch(
                url,
                {

                    method:
                        "GET",

                    headers:
                    {

                        "User-Agent":
                            "Mozilla/5.0 BÍO-IA",

                        "Accept":
                            "text/html,application/xhtml+xml,text/plain,application/pdf"

                    },

                    signal:
                        controller.signal

                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status} al consultar ${url}`
            );

        }


        return await response.text();

    } finally {

        clearTimeout(
            timer
        );

    }

}
