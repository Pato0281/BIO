// =====================================================
// BÍO IA V7
// netlify/functions/analizarEtiqueta.js
// =====================================================
//
// FLUJO:
//
// FOTO
//  ↓
// OpenRouter / openrouter/free
//  ↓
// Identificación del producto
//  ↓
// Búsqueda en SAG Chile
//  ↓
// Página oficial del producto
//  ↓
// PDF oficial SAG
//  ↓
// Jina Reader
//  ↓
// OpenRouter interpreta la documentación
//  ↓
// Reglas BIO
//  ↓
// Cálculos 1 / 15 / 100 / 160 L
//  ↓
// JSON para BIO
//
// NO UTILIZA GEMINI
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

const SAG_LIST_URLS = [

    "https://www.sag.gob.cl/ambitos-de-accion/insumos-y-productos-silvoagricolas/publicaciones",

    "https://www.sag.gob.cl/ambitos-de-accion/autorizacion-y-evaluacion-de-plaguicidas/publicaciones"

];

const SAG_DOMAIN =
    "https://www.sag.gob.cl";

const JINA_PREFIX =
    "https://r.jina.ai/";

const TIMEOUT_MS =
    30000;

const MAX_DOCUMENT_CHARS =
    90000;


// =====================================================
// HANDLER
// =====================================================

exports.handler = async (event) => {

    console.log(
        "======================================"
    );

    console.log(
        "BÍO IA V7 - INICIO"
    );

    console.log(
        "======================================"
    );


    // -------------------------------------------------
    // MÉTODO
    // -------------------------------------------------

    if (
        event.httpMethod !== "POST"
    ) {

        return responseJSON(
            405,
            {
                ok:
                    false,

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
                "Falta OPENROUTER_API_KEY."
            );

            return responseJSON(
                500,
                {

                    ok:
                        false,

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
            parseBody(
                event.body
            );


        let imageBase64 =
            body.image ||
            body.imageBase64 ||
            "";


        const promptOriginal =
            body.prompt ||
            "";


        if (
            !imageBase64
        ) {

            return responseJSON(
                400,
                {

                    ok:
                        false,

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
            imageBase64.startsWith(
                "data:"
            )
        ) {

            const match =
                imageBase64.match(
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
            imageBase64.includes(",")
        ) {

            imageBase64 =
                imageBase64.split(",")[1];

        }


        if (
            !mimeType.startsWith(
                "image/"
            )
        ) {

            return responseJSON(
                400,
                {

                    ok:
                        false,

                    mensaje:
                        `Tipo de imagen no soportado: ${mimeType}`

                }
            );

        }


        console.log(
            "Imagen:",
            mimeType
        );

        console.log(
            "Base64:",
            imageBase64.length
        );


        // =================================================
        // ETAPA 1
        // IDENTIFICACIÓN VISUAL
        // =================================================

        console.log(
            "ETAPA 1: identificación visual"
        );


        const identificacion =
            await identificarProducto(
                imageBase64,
                mimeType,
                promptOriginal
            );


        console.log(
            "Producto identificado:",
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


        // =================================================
        // ETAPA 2
        // BÚSQUEDA SAG
        // =================================================

        console.log(
            "ETAPA 2: búsqueda SAG"
        );


        const sag =
            await buscarSAG(
                identificacion
            );


        console.log(
            "SAG encontrado:",
            sag.encontrado
        );

        console.log(
            "Producto URL:",
            sag.productUrl ||
                ""
        );

        console.log(
            "PDF URL:",
            sag.pdfUrl ||
                ""
        );


        // =================================================
        // ETAPA 3
        // LEER DOCUMENTO
        // =================================================

        let documento =
            "";


        let documentoURL =
            "";


        if (
            sag.pdfUrl
        ) {

            console.log(
                "ETAPA 3: leyendo PDF oficial SAG"
            );


            documentoURL =
                sag.pdfUrl;


            documento =
                await leerDocumento(
                    sag.pdfUrl
                );

        }


        // -------------------------------------------------
        // FALLBACK: página SAG
        // -------------------------------------------------

        if (
            !documento &&
            sag.productUrl
        ) {

            console.log(
                "PDF no disponible. Leyendo página SAG."
            );


            documentoURL =
                sag.productUrl;


            documento =
                await leerDocumento(
                    sag.productUrl
                );

        }


        console.log(
            "Caracteres de documento:",
            documento.length
        );


        // =================================================
        // ETAPA 4
        // INTERPRETAR DOCUMENTACIÓN
        // =================================================

        let datos;


        if (
            documento.length > 0
        ) {

            console.log(
                "ETAPA 4: interpretación del documento"
            );


            datos =
                await interpretarDocumento(
                    identificacion,
                    documento,
                    promptOriginal
                );

        } else {

            console.log(
                "No se pudo obtener documentación."
            );


            datos =
                normalizarDatos(
                    identificacion
                );

        }


        // =================================================
        // ETAPA 5
        // REGLAS BIO
        // =================================================

        console.log(
            "ETAPA 5: reglas BIO"
        );


        datos =
            aplicarReglasBIO(
                datos,
                documento
            );


        // =================================================
        // ETAPA 6
        // CÁLCULO DOSIS
        // =================================================

        console.log(
            "ETAPA 6: cálculo dosis"
        );


        datos.dosis =
            construirDosisBIO(
                datos.dosis,
                datos.mojamiento
            );


        // =================================================
        // FUENTES
        // =================================================

        datos.observaciones =
            agregarFuentes(
                datos.observaciones,
                sag,
                documentoURL
            );


        // =================================================
        // RESULTADO
        // =================================================

        console.log(
            "======================================"
        );

        console.log(
            "BÍO IA V7 - RESULTADO"
        );

        console.log(
            JSON.stringify(
                datos
            )
        );

        console.log(
            "======================================"
        );


        return responseJSON(
            200,
            {

                ok:
                    true,

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO,

                modelo_utilizado:
                    identificacion.modelo_utilizado ||
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
            "======================================"
        );

        console.error(
            "ERROR BÍO IA V7"
        );

        console.error(
            error
        );

        console.error(
            "======================================"
        );


        return responseJSON(
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
// IDENTIFICACIÓN VISUAL
// =====================================================

async function identificarProducto(
    imageBase64,
    mimeType,
    promptOriginal
) {

    const prompt = `

Eres BÍO IA, especialista en productos
fitosanitarios agrícolas de Chile.

Analiza la imagen.

Tu objetivo principal es identificar
el producto comercial.

NO INVENTES INFORMACIÓN.

Busca:

- nombre comercial
- fabricante
- ingrediente activo
- concentración
- formulación
- registro SAG
- contenido
- tipo de producto
- función
- plagas
- cultivos
- modo de acción visible

IMPORTANTE:

Si la etiqueta dice:

"actividad sistémica"

debes devolver:

"Sistémico"

Si dice:

"acción de contacto"

debes devolver:

"Contacto"

Si dice:

"acción de ingestión"

debes devolver:

"Ingestión"

Si aparecen varias acciones,
devuelve todas.

NO inventes:

- dosis
- carencia
- reentrada

cuando no sean visibles.

Devuelve exclusivamente JSON válido.

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

Si no puedes identificar un dato:

texto = "No encontrado"

array = []

Información adicional:

${promptOriginal}

`;


    const resultado =
        await llamarOpenRouter(
            prompt,
            [
                {

                    type:
                        "image_url",

                    image_url:
                    {
                        url:
                            `data:${mimeType};base64,${imageBase64}`
                    }

                }
            ]
        );


    const texto =
        extraerTexto(
            resultado.data
        );


    const datos =
        parsearJSON(
            texto
        );


    const normalizados =
        normalizarDatos(
            datos
        );


    normalizados.modelo_utilizado =
        resultado.modelo;


    return normalizados;

}


// =====================================================
// BÚSQUEDA SAG
// =====================================================

async function buscarSAG(
    identificacion
) {

    const nombre =
        limpiar(
            identificacion.nombre
        );


    const registro =
        limpiar(
            identificacion.registro
        );


    const ingrediente =
        limpiar(
            identificacion.ingrediente_activo
        );


    if (
        !nombre ||
        normalizarTexto(nombre) ===
            "no encontrado"
    ) {

        return {

            encontrado:
                false,

            mensaje:
                "No existe nombre comercial para buscar."

        };

    }


    const consultas =
        [];


    // -------------------------------------------------
    // Nombre completo
    // -------------------------------------------------

    consultas.push(
        nombre
    );


    // -------------------------------------------------
    // Nombre sin concentración / formulación
    // Ej:
    // ORTHENE 75 SP -> ORTHENE
    // -------------------------------------------------

    const nombreBase =
        nombre
            .replace(
                /\b\d+(?:[.,]\d+)?\s*(?:%|WG|WP|SC|SL|EC|SP|SG|FS|SE|EW|OD|CS|ME|GR)\b/gi,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    if (
        nombreBase &&
        normalizarTexto(
            nombreBase
        ) !==
        normalizarTexto(
            nombre
        )
    ) {

        consultas.push(
            nombreBase
        );

    }


    // -------------------------------------------------
    // Registro
    // -------------------------------------------------

    if (
        registro &&
        normalizarTexto(registro) !==
            "no encontrado"
    ) {

        consultas.push(
            registro
        );

    }


    // -------------------------------------------------
    // Buscar cada consulta
    // -------------------------------------------------

    for (
        const termino
        of consultas
    ) {

        console.log(
            "SAG buscando:",
            termino
        );


        const resultados =
            await consultarListadosSAG(
                termino
            );


        console.log(
            "Resultados encontrados:",
            resultados.length
        );


        const mejor =
            elegirResultadoSAG(
                resultados,
                nombre,
                registro,
                ingrediente
            );


        if (
            mejor
        ) {

            console.log(
                "Mejor resultado SAG:",
                mejor.titulo
            );


            // -------------------------------------------------
            // Abrir página individual
            // -------------------------------------------------

            let pagina =
                "";


            try {

                pagina =
                    await fetchText(
                        mejor.url
                    );

            } catch (
                error
            ) {

                console.error(
                    "No se pudo abrir página SAG:",
                    error
                );

            }


            // -------------------------------------------------
            // Buscar PDF
            // -------------------------------------------------

            let pdfUrl =
                encontrarPDF(
                    pagina
                );


            // -------------------------------------------------
            // Si no aparece PDF en HTML normal,
            // leer página con Jina y buscar PDF.
            // -------------------------------------------------

            if (
                !pdfUrl
            ) {

                try {

                    const paginaJina =
                        await fetchText(
                            construirJinaURL(
                                mejor.url
                            )
                        );


                    pdfUrl =
                        encontrarPDF(
                            paginaJina
                        );

                } catch (
                    error
                ) {

                    console.error(
                        "Jina no pudo leer página SAG:",
                        error
                    );

                }

            }


            return {

                encontrado:
                    true,

                productoBuscado:
                    nombre,

                titulo:
                    mejor.titulo,

                productUrl:
                    mejor.url,

                pdfUrl:
                    pdfUrl ||
                    "",

                empresa:
                    mejor.empresa ||
                    "",

                ano:
                    mejor.ano ||
                    "",

                fuente:
                    "SAG Chile"

            };

        }

    }


    return {

        encontrado:
            false,

        productoBuscado:
            nombre,

        mensaje:
            "No se encontró una publicación coincidente en SAG Chile."

    };

}


// =====================================================
// CONSULTAR LISTADOS SAG
// =====================================================

async function consultarListadosSAG(
    termino
) {

    const resultados =
        [];


    for (
        const baseURL
        of SAG_LIST_URLS
    ) {

        try {

            const url =
                construirURLBusquedaSAG(
                    baseURL,
                    termino
                );


            console.log(
                "Consultando:",
                url
            );


            const html =
                await fetchText(
                    url
                );


            const encontrados =
                extraerResultadosSAG(
                    html
                );


            resultados.push(
                ...encontrados
            );

        } catch (
            error
        ) {

            console.error(
                "Error listado SAG:",
                error
            );

        }

    }


    return eliminarDuplicadosSAG(
        resultados
    );

}


// =====================================================
// CONSTRUIR URL DE BÚSQUEDA SAG
// =====================================================

function construirURLBusquedaSAG(
    baseURL,
    termino
) {

    const params =
        new URLSearchParams();


    params.set(
        "field_fecha_otros_value",
        ""
    );


    params.set(
        "field_tema_otros_documentos_target_id",
        "All"
    );


    params.set(
        "field_tipo_de_publicacion_target_id",
        "All"
    );


    params.set(
        "order",
        "field_fecha_otros"
    );


    params.set(
        "sort",
        "desc"
    );


    params.set(
        "page",
        "0"
    );


    params.set(
        "title",
        termino
    );


    return (
        baseURL +
        "?" +
        params.toString()
    );

}


// =====================================================
// EXTRAER RESULTADOS SAG
// =====================================================

function extraerResultadosSAG(
    html
) {

    const resultados =
        [];


    if (
        !html
    ) {

        return resultados;

    }


    // -------------------------------------------------
    // Enlaces normales
    // -------------------------------------------------

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
            convertirURLSAG(
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
                "/content/"
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


    return resultados;

}


// =====================================================
// ELEGIR MEJOR RESULTADO SAG
// =====================================================

function elegirResultadoSAG(
    resultados,
    nombre,
    registro,
    ingrediente
) {

    if (
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

    let mayorPuntaje =
        0;


    for (
        const item
        of resultados
    ) {

        const tituloN =
            normalizarTexto(
                item.titulo
            );


        let puntaje =
            0;


        // Nombre exacto
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
                40;

        }


        // Registro
        if (
            registroN &&
            registroN !==
                "no encontrado" &&
            tituloN.includes(
                registroN
            )
        ) {

            puntaje +=
                50;

        }


        // Ingrediente
        if (
            ingredienteN &&
            ingredienteN !==
                "no encontrado" &&
            tituloN.includes(
                ingredienteN
            )
        ) {

            puntaje +=
                20;

        }


        if (
            puntaje >
            mayorPuntaje
        ) {

            mayorPuntaje =
                puntaje;

            mejor =
                item;

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


    // -------------------------------------------------
    // href directo
    // -------------------------------------------------

    const regex =
        /href\s*=\s*["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi;


    let match;


    while (
        (match =
            regex.exec(
                html
            ))
    ) {

        return convertirURLSAG(
            decodeHTML(
                match[1]
            )
        );

    }


    // -------------------------------------------------
    // texto que contiene ".pdf"
    // -------------------------------------------------

    const regexTexto =
        /https?:\/\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?/gi;


    const encontradoTexto =
        html.match(
            regexTexto
        );


    if (
        encontradoTexto &&
        encontradoTexto[0]
    ) {

        return
            decodeHTML(
                encontradoTexto[0]
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
            "Leyendo documento:",
            url
        );


        // -------------------------------------------------
        // PDF → Jina Reader
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


            console.log(
                "Jina:",
                jinaURL
            );


            const texto =
                await fetchText(
                    jinaURL
                );


            if (
                texto
            ) {

                return texto.slice(
                    0,
                    MAX_DOCUMENT_CHARS
                );

            }


            return "";

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


        return stripHTML(
            html
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
            .slice(
                0,
                MAX_DOCUMENT_CHARS
            );

    } catch (
        error
    ) {

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

    return (
        JINA_PREFIX +
        url
    );

}


// =====================================================
// INTERPRETAR DOCUMENTACIÓN
// =====================================================

async function interpretarDocumento(
    identificacion,
    documento,
    promptOriginal
) {

    const texto =
        documento.slice(
            0,
            MAX_DOCUMENT_CHARS
        );


    const prompt = `

Eres BÍO IA, especialista en protección
vegetal y uso de productos agrícolas en Chile.

Has recibido:

1. Identificación inicial desde una fotografía.
2. Documento oficial obtenido desde SAG Chile.

La información del documento oficial tiene
PRIORIDAD sobre la inferencia de la imagen.

NO INVENTES.

=========================================
PRIORIDAD DE FUENTES
=========================================

1. Etiqueta oficial SAG.
2. HDS/documentación oficial SAG.
3. Imagen original.

=========================================
MODO DE ACCIÓN
=========================================

Busca explícitamente:

- sistémico
- contacto
- ingestión
- translaminar
- fumigante
- preventivo
- curativo
- erradicante
- residual

Si el documento dice:

"actividad sistémica"

→ "Sistémico"

Si dice acción de contacto:

→ "Contacto"

Si dice acción de ingestión:

→ "Ingestión"

Conserva todas las acciones encontradas.

Busca también:

- IRAC
- FRAC
- HRAC

=========================================
CRISANTEMO
=========================================

Para la aplicación BIO:

1. Buscar primero crisantemo.
2. Luego flores/ornamentales.
3. Si no existe una recomendación específica,
   utilizar HORTALIZAS/VERDURAS como referencia
   agronómica BIO.
4. NUNCA utilizar árboles o vides como referencia.

MUY IMPORTANTE:

La referencia de hortalizas no debe presentarse
como autorización SAG específica para crisantemo.

Indicar en observaciones:

"Referencia agronómica BIO tomada de hortalizas
por ausencia de recomendación específica para
crisantemo/flores."

=========================================
CARENCIA
=========================================

Buscar la carencia en el documento.

Prioridad:

1. cultivo específico
2. flores/ornamentales
3. condición de invernadero
4. recomendación general

Si no existe:

"No encontrado"

=========================================
REINGRESO
=========================================

Buscar explícitamente el tiempo de reingreso.

Prioridad:

1. invernadero
2. cultivo específico
3. general

No confundir reingreso con carencia.

=========================================
DOSIS
=========================================

Extrae exactamente la dosis oficial.

Puede estar en:

- g/100 L
- kg/100 L
- mL/100 L
- L/100 L
- g/ha
- kg/ha
- mL/ha
- L/ha

No cambies la unidad.

=========================================
1X / 2X
=========================================

REGLA BIO:

1X = Preventivo = presión baja

2X = Curativo = presión alta

Si la documentación dice:

1X–2X

interpreta:

1X → preventivo
2X → curativo

Si la documentación dice:

"utilizar la dosis mayor
con alta presión"

entonces:

dosis menor → presión baja / preventivo
dosis mayor → presión alta / curativo

No inventes la relación si el documento
no la respalda.

=========================================
DOSIS PARA BIO
=========================================

Cuando la dosis esté expresada por 100 L,
mantén la dosis oficial y prepara cálculos para:

1 L
15 L
100 L
160 L

Ejemplo:

30 g/100 L

1 L = 0,30 g
15 L = 4,50 g
100 L = 30 g
160 L = 48 g

Si existe un rango, conserva el rango.

Si la dosis es por hectárea:

NO convertir automáticamente sin disponer
del mojamiento oficial necesario.

=========================================
RESPUESTA
=========================================

Devuelve EXCLUSIVAMENTE JSON válido.

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

=========================================
IDENTIFICACIÓN
=========================================

${JSON.stringify(
    identificacion
)}

=========================================
DOCUMENTO SAG
=========================================

${texto}

=========================================
INSTRUCCIONES ADICIONALES
=========================================

${promptOriginal}

`;


    const resultado =
        await llamarOpenRouter(
            prompt,
            []
        );


    const respuestaTexto =
        extraerTexto(
            resultado.data
        );


    return parsearJSON(
        respuestaTexto
    );

}


// =====================================================
// REGLAS BIO
// =====================================================

function aplicarReglasBIO(
    datos,
    documento
) {

    datos =
        normalizarDatos(
            datos
        );


    const doc =
        normalizarTexto(
            documento
        );


    // -------------------------------------------------
    // MODO DE ACCIÓN
    // -------------------------------------------------

    const acciones =
        Array.isArray(
            datos.modo_accion
        )
            ? datos.modo_accion
            : [];


    function agregarAccion(
        accion
    ) {

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

    }


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
            "de ingestion"
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


    datos.modo_accion =
        acciones;


    // -------------------------------------------------
    // 1X / 2X
    // -------------------------------------------------

    if (
        /1\s*x/i.test(
            datos.dosis
        ) ||
        /2\s*x/i.test(
            datos.dosis
        )
    ) {

        if (
            !normalizarTexto(
                datos.dosis
            ).includes(
                "preventivo"
            )
        ) {

            datos.dosis +=
                " | 1X = Preventivo (presión baja)";

        }


        if (
            !normalizarTexto(
                datos.dosis
            ).includes(
                "curativo"
            )
        ) {

            datos.dosis +=
                " | 2X = Curativo (presión alta)";

        }

    }


    // -------------------------------------------------
    // PRESIÓN ALTA
    // -------------------------------------------------

    if (
        doc.includes(
            "alta presion"
        ) ||
        doc.includes(
            "presion alta"
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
                " La documentación indica considerar la presión de la plaga; la dosis mayor se interpreta como curativa/presión alta cuando el documento lo respalda.";

        }

    }


    // -------------------------------------------------
    // CRISANTEMO / FLORES
    // -------------------------------------------------

    const cultivosN =
        normalizarTexto(
            datos.cultivos.join(
                " "
            )
        );


    const tieneCrisantemo =
        cultivosN.includes(
            "crisantemo"
        );


    const tieneFlores =
        cultivosN.includes(
            "flor"
        ) ||
        cultivosN.includes(
            "ornamental"
        );


    const tieneHortalizas =
        cultivosN.includes(
            "hortal"
        ) ||
        cultivosN.includes(
            "verdura"
        );


    if (
        !tieneCrisantemo &&
        !tieneFlores &&
        tieneHortalizas
    ) {

        if (
            !normalizarTexto(
                datos.observaciones
            ).includes(
                "referencia agronomica bio"
            )
        ) {

            datos.observaciones +=
                " Referencia agronómica BIO tomada de hortalizas por ausencia de recomendación específica para crisantemo/flores; nunca se utilizan árboles o vides como referencia.";

        }

    }


    return datos;

}


// =====================================================
// CONSTRUIR DOSIS BIO
// =====================================================

function construirDosisBIO(
    dosis,
    mojamiento
) {

    if (
        !dosis ||
        normalizarTexto(
            dosis
        ) ===
        "no encontrado"
    ) {

        return
            "No encontrado";

    }


    let original =
        String(
            dosis
        ).trim();


    // -------------------------------------------------
    // RANGO POR 100 L
    // -------------------------------------------------

    const rango =
        original.match(
            /(\d+(?:[.,]\d+)?)\s*(?:-|a)\s*(\d+(?:[.,]\d+)?)\s*(mg|g|kg|ml|mL|cc|l|L)\s*\/\s*100\s*(?:l|L)/i
        );


    if (
        rango
    ) {

        const a =
            parseFloat(
                rango[1].replace(
                    ",",
                    "."
                )
            );


        const b =
            parseFloat(
                rango[2].replace(
                    ",",
                    "."
                )
            );


        const unidad =
            normalizarUnidad(
                rango[3]
            );


        original +=
            "\n\nCálculo BIO por volumen de agua:";


        original +=
            calcularVolumenes(
                a,
                b,
                unidad
            );


        return original;

    }


    // -------------------------------------------------
    // DOSIS ÚNICA POR 100 L
    // -------------------------------------------------

    const unica =
        original.match(
            /(\d+(?:[.,]\d+)?)\s*(mg|g|kg|ml|mL|cc|l|L)\s*\/\s*100\s*(?:l|L)/i
        );


    if (
        unica
    ) {

        const valor =
            parseFloat(
                unica[1].replace(
                    ",",
                    "."
                )
            );


        const unidad =
            normalizarUnidad(
                unica[2]
            );


        original +=
            "\n\nCálculo BIO por volumen de agua:";


        original +=
            calcularVolumenes(
                valor,
                null,
                unidad
            );


        return original;

    }


    // -------------------------------------------------
    // DOSIS POR HECTÁREA
    // -------------------------------------------------

    if (
        /\/\s*ha\b/i.test(
            original
        ) ||
        /por\s+hect[aá]rea/i.test(
            original
        )
    ) {

        const mojamientoValido =
            extraerMojamiento100L(
                mojamiento
            );


        if (
            mojamientoValido
        ) {

            const calculado =
                calcularDesdeHectarea(
                    original,
                    mojamientoValido
                );


            if (
                calculado
            ) {

                return
                    original +
                    "\n\nCálculo BIO por volumen de agua:" +
                    calculado;

            }

        }


        return
            original +
            "\n\nCálculo BIO 1 / 15 / 100 / 160 L: requiere mojamiento oficial para convertir una dosis por hectárea.";

    }


    return original;

}


// =====================================================
// CALCULAR 1 / 15 / 100 / 160
// =====================================================

function calcularVolumenes(
    a,
    b,
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

        const valorA =
            a *
            L /
            100;


        if (
            b != null
        ) {

            const valorB =
                b *
                L /
                100;


            resultado +=
                `\n${L} L = ${formatearNumero(valorA)}-${formatearNumero(valorB)} ${unidad}`;

        } else {

            resultado +=
                `\n${L} L = ${formatearNumero(valorA)} ${unidad}`;

        }

    }


    return resultado;

}


// =====================================================
// MOJAMIENTO
// =====================================================

function extraerMojamiento100L(
    texto
) {

    if (
        !texto
    ) {

        return null;

    }


    const match =
        String(
            texto
        ).match(
            /(\d+(?:[.,]\d+)?)\s*(?:-|a)\s*(\d+(?:[.,]\d+)?)\s*L\s*\/\s*ha/i
        );


    if (
        match
    ) {

        const min =
            parseFloat(
                match[1].replace(
                    ",",
                    "."
                )
            );


        const max =
            parseFloat(
                match[2].replace(
                    ",",
                    "."
                )
            );


        return {
            min,
            max
        };

    }


    return null;

}


// =====================================================
// DOSIS / HA
// =====================================================

function calcularDesdeHectarea(
    dosis,
    mojamiento
) {

    if (
        !mojamiento
    ) {

        return "";

    }


    // -------------------------------------------------
    // Solo hacemos conversión cuando encontramos
    // una dosis simple g/ha o kg/ha.
    // -------------------------------------------------

    const match =
        String(
            dosis
        ).match(
            /(\d+(?:[.,]\d+)?)\s*(g|kg|ml|mL|L)\s*\/\s*ha/i
        );


    if (
        !match
    ) {

        return "";

    }


    const cantidad =
        parseFloat(
            match[1].replace(
                ",",
                "."
            )
        );


    const unidad =
        normalizarUnidad(
            match[2]
        );


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
        const agua
        of litros
    ) {

        // Usamos el promedio solo para mostrar
        // una referencia cuando la etiqueta entrega
        // rango de mojamiento.
        const aguaPorHa =
            (
                mojamiento.min +
                mojamiento.max
            ) /
            2;


        if (
            aguaPorHa <= 0
        ) {

            continue;

        }


        const cantidadPorLitro =
            cantidad /
            aguaPorHa;


        const cantidadEnVolumen =
            cantidadPorLitro *
            agua;


        resultado +=
            `\n${agua} L = ${formatearNumero(cantidadEnVolumen)} ${unidad}`;

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


    if (
        !("modelo_utilizado"
            in datos)
    ) {

        datos.modelo_utilizado =
            null;

    }


    return datos;

}


// =====================================================
// AGREGAR FUENTES
// =====================================================

function agregarFuentes(
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
        sag.productUrl
    ) {

        resultado +=
            ` Página SAG: ${sag.productUrl}`;

    }


    if (
        documentoURL
    ) {

        resultado +=
            ` Documento: ${documentoURL}`;

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


    const controller =
        new AbortController();


    const timer =
        setTimeout(
            () =>
                controller.abort(),
            TIMEOUT_MS
        );


    try {

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
                            "BÍO IA V7"

                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    signal:
                        controller.signal

                }
            );


        const raw =
            await response.text();


        let data;


        try {

            data =
                JSON.parse(
                    raw
                );

        } catch {

            data =
                {
                    raw
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


        return {

            data,

            modelo:
                data?.model ||
                null

        };

    } finally {

        clearTimeout(
            timer
        );

    }

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
// FETCH TEXT
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
            TIMEOUT_MS
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
                            "Mozilla/5.0 BÍO-IA V7",

                        "Accept":
                            "text/html,application/xhtml+xml,text/plain,application/pdf,*/*"

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


// =====================================================
// UTILIDADES
// =====================================================

function convertirURLSAG(
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

        return SAG_DOMAIN +
            href;

    }


    return SAG_DOMAIN +
        "/" +
        href.replace(
            /^\/+/,
            ""
        );

}


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


function limpiar(
    texto
) {

    return typeof texto ===
        "string"
        ? texto.trim()
        : "";

}


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


function eliminarDuplicadosSAG(
    resultados
) {

    const vistos =
        new Set();


    return resultados.filter(
        item => {

            const key =
                item.url +
                "|" +
                normalizarTexto(
                    item.titulo
                );


            if (
                vistos.has(
                    key
                )
            ) {

                return false;

            }


            vistos.add(
                key
            );


            return true;

        }
    );

}


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


function formatearNumero(
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


function parseBody(
    body
) {

    try {

        return JSON.parse(
            body ||
            "{}"
        );

    } catch {

        throw new Error(
            "El cuerpo de la solicitud no es JSON válido."
        );

    }

}


// =====================================================
// RESPUESTA NETLIFY
// =====================================================

function responseJSON(
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
