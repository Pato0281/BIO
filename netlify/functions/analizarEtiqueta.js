// ======================================================
// BÍO IA V11
// analizarEtiqueta.js
// ======================================================
//
// FLUJO:
//
// FOTO
//   ↓
// OpenRouter / MiniMax M3 Free
//   ↓
// Identificación inicial
//   ↓
// SAG Chile
//   ↓
// Página oficial
//   ↓
// PDF oficial
//   ↓
// OpenRouter / MiniMax M3 Free
//   ↓
// Interpretación del PDF
//   ↓
// app.js
//
// LA IA SOLO ENTREGA:
//
// ✅ Nombre comercial
// ✅ Ingrediente activo
// ✅ Concentración
// ✅ Modo de acción
// ✅ Función técnica
// ✅ Plagas / enfermedades
//
// NO ENTREGA:
//
// ❌ Dosis
// ❌ Carencia
// ❌ Reingreso
// ❌ Fabricante
// ❌ Formulación
// ❌ Grupo químico
//
// ======================================================


// ======================================================
// CONFIGURACIÓN
// ======================================================

const API_KEY =
    process.env.OPENROUTER_API_KEY;

const OPENROUTER_URL =
    "https://openrouter.ai/api/v1/chat/completions";

const MODEL =
    "minimax/minimax-m3:free";

const SAG_PUBLICATIONS_URL =
    "https://www.sag.gob.cl/ambitos-de-accion/autorizacion-y-evaluacion-de-plaguicidas/publicaciones";

const SAG_CONTENT_URL =
    "https://www.sag.gob.cl/content";

const SAG_DOMAIN =
    "https://www.sag.gob.cl";

const JINA_PREFIX =
    "https://r.jina.ai/";

const AI_TIMEOUT_MS =
    25000;

const WEB_TIMEOUT_MS =
    12000;

const MAX_DOCUMENT_CHARS =
    90000;


// ======================================================
// HANDLER
// ======================================================

exports.handler = async (event) => {

    const inicio =
        Date.now();


    console.log(
        "=============================================="
    );

    console.log(
        "BÍO IA V11 - INICIO"
    );

    console.log(
        "=============================================="
    );


    // --------------------------------------------------
    // MÉTODO
    // --------------------------------------------------

    if (
        event.httpMethod !== "POST"
    ) {

        return responder(
            405,
            {
                ok:
                    false,

                mensaje:
                    "Método no permitido. Use POST."
            }
        );

    }


    // --------------------------------------------------
    // API KEY
    // --------------------------------------------------

    if (
        !API_KEY
    ) {

        console.error(
            "ERROR: OPENROUTER_API_KEY no configurada."
        );

        return responder(
            500,
            {
                ok:
                    false,

                mensaje:
                    "OPENROUTER_API_KEY no está configurada en Netlify.",

                proveedor:
                    "OpenRouter",

                modelo:
                    MODEL

            }
        );

    }


    try {

        // ==================================================
        // BODY
        // ==================================================

        const body =
            parsearBody(
                event.body
            );


        let imageBase64 =
            body.image ||
            body.imageBase64 ||
            "";


        if (
            !imageBase64
        ) {

            return responder(
                400,
                {

                    ok:
                        false,

                    mensaje:
                        "No se recibió ninguna imagen."

                }
            );

        }


        // ==================================================
        // MIME
        // ==================================================

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
                match
            ) {

                mimeType =
                    match[1];

            }


            const separador =
                imageBase64.indexOf(
                    ","
                );


            if (
                separador !== -1
            ) {

                imageBase64 =
                    imageBase64.substring(
                        separador + 1
                    );

            }

        }


        if (
            !mimeType.startsWith(
                "image/"
            )
        ) {

            return responder(
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
            "Tamaño Base64:",
            imageBase64.length
        );


        // ==================================================
        // ETAPA 1
        // IDENTIFICACIÓN VISUAL
        // ==================================================

        console.log(
            "----------------------------------------------"
        );

        console.log(
            "ETAPA 1: IDENTIFICACIÓN VISUAL"
        );

        console.log(
            "----------------------------------------------"
        );


        const identificacion =
            await identificarDesdeImagen(
                imageBase64,
                mimeType
            );


        console.log(
            "IDENTIFICACIÓN INICIAL:"
        );

        console.log(
            JSON.stringify(
                identificacion,
                null,
                2
            )
        );


        // ==================================================
        // ETAPA 2
        // BÚSQUEDA SAG
        // ==================================================

        console.log(
            "----------------------------------------------"
        );

        console.log(
            "ETAPA 2: BÚSQUEDA SAG"
        );

        console.log(
            "----------------------------------------------"
        );


        const sag =
            await buscarSAG(
                identificacion
            );


        console.log(
            "RESULTADO SAG:"
        );

        console.log(
            JSON.stringify(
                sag,
                null,
                2
            )
        );


        // ==================================================
        // ETAPA 3
        // PDF
        // ==================================================

        let documento =
            "";

        let fuenteURL =
            sag.pdfUrl ||
            sag.productUrl ||
            "";


        if (
            sag.pdfUrl
        ) {

            console.log(
                "----------------------------------------------"
            );

            console.log(
                "ETAPA 3: LECTURA PDF OFICIAL SAG"
            );

            console.log(
                "----------------------------------------------"
            );


            documento =
                await leerDocumento(
                    sag.pdfUrl
                );

        }


        // --------------------------------------------------
        // FALLBACK: página SAG
        // --------------------------------------------------

        if (
            !documento &&
            sag.productUrl
        ) {

            console.log(
                "PDF no pudo leerse."
            );

            console.log(
                "Intentando página SAG."
            );


            fuenteURL =
                sag.productUrl;


            documento =
                await leerDocumento(
                    sag.productUrl
                );

        }


        console.log(
            "Caracteres del documento:",
            documento.length
        );


        // ==================================================
        // ETAPA 4
        // INTERPRETACIÓN PDF
        // ==================================================

        let datosFinales =
            identificacion;


        if (
            documento &&
            documento.length >
                100
        ) {

            console.log(
                "----------------------------------------------"
            );

            console.log(
                "ETAPA 4: INTERPRETACIÓN DEL PDF"
            );

            console.log(
                "----------------------------------------------"
            );


            try {

                datosFinales =
                    await interpretarPDF(
                        identificacion,
                        documento
                    );

            } catch (
                error
            ) {

                console.error(
                    "Error interpretando PDF:",
                    error.message
                );


                console.log(
                    "Se conservará identificación inicial."
                );


                datosFinales =
                    identificacion;

            }

        } else {

            console.log(
                "No existe suficiente información documental."
            );

        }


        // ==================================================
        // NORMALIZAR
        // ==================================================

        datosFinales =
            normalizarDatos(
                datosFinales
            );


        // ==================================================
        // RESULTADO
        // ==================================================

        const resultado = {

            ok:
                true,

            proveedor:
                "OpenRouter",

            modelo:
                MODEL,

            fuente:
                documento
                    ? "SAG Chile"
                    : "Imagen",

            fuente_url:
                fuenteURL ||
                null,

            sag:
            {

                encontrado:
                    !!sag.encontrado,

                titulo:
                    sag.titulo ||
                    null,

                productUrl:
                    sag.productUrl ||
                    null,

                pdfUrl:
                    sag.pdfUrl ||
                    null

            },

            datos:
                datosFinales,

            duracion_ms:
                Date.now() -
                inicio

        };


        console.log(
            "=============================================="
        );

        console.log(
            "BÍO IA V11 - FINAL"
        );

        console.log(
            JSON.stringify(
                resultado,
                null,
                2
            )
        );

        console.log(
            "=============================================="
        );


        return responder(
            200,
            resultado
        );


    } catch (
        error
    ) {

        console.error(
            "=============================================="
        );

        console.error(
            "ERROR GENERAL BÍO IA V11"
        );

        console.error(
            error
        );

        console.error(
            "=============================================="
        );


        return responder(
            500,
            {

                ok:
                    false,

                mensaje:
                    error?.message ||
                    "Error inesperado.",

                proveedor:
                    "OpenRouter",

                modelo:
                    MODEL

            }
        );

    }

};


// ======================================================
// ETAPA 1
// IDENTIFICACIÓN DESDE IMAGEN
// ======================================================

async function identificarDesdeImagen(
    imageBase64,
    mimeType
) {

    const prompt = `

Eres BÍO IA.

Analiza la fotografía de una etiqueta o envase
de un producto fitosanitario agrícola.

Tu objetivo es identificar el producto.

NO INVENTES información.

Debes identificar solamente:

- nombre comercial
- ingrediente activo
- concentración
- modo de acción si aparece
- función técnica
- plagas o enfermedades visibles

IMPORTANTE:

La fotografía puede contener información
de otro país.

Si aparece SENASA, Perú, Argentina,
Brasil u otro organismo, NO lo conviertas
en información SAG Chile.

NO debes entregar:

- dosis
- carencia
- reingreso
- fabricante
- formulación
- grupo químico

Esos datos NO forman parte de esta etapa.

MODO DE ACCIÓN:

Si aparece evidencia de:

sistémico
contacto
ingestión
digestivo

puedes incluirla.

FUNCIÓN:

Cuando exista evidencia:

insecticida
fungicida
herbicida
estimulante

inclúyela.

PLAGAS:

Extrae todas las plagas o enfermedades
que sean realmente legibles en la fotografía.

No te limites arbitrariamente a dos o tres.

Devuelve solamente JSON con esta estructura:

{
  "tipo_registro": "quimico",
  "nombre": "",
  "ingrediente_activo": "",
  "concentracion": "",
  "modo_accion": [],
  "funcion": [],
  "plagas_objetivo": []
}

Si no puedes identificar algo:

texto = "No encontrado"

lista = []

`;


    const resultado =
        await llamarOpenRouter(
            prompt,
            imageBase64,
            mimeType
        );


    console.log(
        "OpenRouter imagen HTTP:",
        resultado.status
    );


    console.log(
        "OpenRouter modelo:",
        resultado.model
    );


    console.log(
        "RAW IMAGEN:"
    );

    console.log(
        resultado.text
    );


    return normalizarDatos(
        parseJSON(
            resultado.text
        )
    );

}


// ======================================================
// ETAPA 2
// BÚSQUEDA SAG
// ======================================================

async function buscarSAG(
    identificacion
) {

    const nombre =
        String(
            identificacion.nombre ||
            ""
        )
        .trim();


    if (
        !nombre ||
        normalize(
            nombre
        ) ===
        "no encontrado"
    ) {

        return {

            encontrado:
                false,

            mensaje:
                "No se pudo obtener el nombre comercial."

        };

    }


    const consultas =
        generarConsultasSAG(
            nombre
        );


    console.log(
        "CONSULTAS SAG:"
    );

    console.log(
        JSON.stringify(
            consultas
        )
    );


    const candidatos =
        [];


    // --------------------------------------------------
    // Buscar en publicaciones SAG
    // --------------------------------------------------

    for (
        const consulta
        of consultas
    ) {

        try {

            const url =
                SAG_PUBLICATIONS_URL +
                "?field_fecha_otros_value=" +
                "&field_tema_otros_documentos_target_id=All" +
                "&field_tipo_de_publicacion_target_id=All" +
                "&order=field_fecha_otros" +
                "&sort=desc" +
                "&page=0" +
                "&title=" +
                encodeURIComponent(
                    consulta
                );


            console.log(
                "URL SAG:",
                url
            );


            const html =
                await fetchText(
                    url,
                    WEB_TIMEOUT_MS
                );


            const resultados =
                extraerLinksSAG(
                    html
                );


            console.log(
                "Resultados:",
                resultados.length
            );


            candidatos.push(
                ...resultados
            );

        } catch (
            error
        ) {

            console.error(
                "Error buscando SAG:",
                consulta,
                error.message
            );

        }

    }


    const unicos =
        eliminarDuplicados(
            candidatos
        );


    console.log(
        "Candidatos SAG:",
        unicos.length
    );


    // --------------------------------------------------
    // Elegir mejor coincidencia
    // --------------------------------------------------

    let mejor =
        elegirMejorSAG(
            unicos,
            nombre
        );


    // --------------------------------------------------
    // Fallback por slug
    // --------------------------------------------------

    if (
        !mejor
    ) {

        console.log(
            "No hubo coincidencia suficiente."
        );

        console.log(
            "Intentando búsqueda por URL de contenido."
        );


        mejor =
            await buscarPorSlugs(
                nombre
            );

    }


    if (
        !mejor
    ) {

        return {

            encontrado:
                false,

            productoBuscado:
                nombre,

            mensaje:
                "No se encontró una coincidencia confiable en SAG Chile."

        };

    }


    console.log(
        "SAG SELECCIONADO:"
    );

    console.log(
        mejor.titulo
    );

    console.log(
        mejor.url
    );

    console.log(
        "Puntaje:",
        mejor.score ||
            "slug"
    );


    // --------------------------------------------------
    // Abrir página
    // --------------------------------------------------

    let pagina =
        "";


    try {

        pagina =
            await fetchText(
                mejor.url,
                WEB_TIMEOUT_MS
            );

    } catch (
        error
    ) {

        console.error(
            "Error abriendo página SAG:",
            error.message
        );

    }


    // --------------------------------------------------
    // Encontrar PDF
    // --------------------------------------------------

    let pdfUrl =
        encontrarPDF(
            pagina
        );


    // --------------------------------------------------
    // Fallback Jina
    // --------------------------------------------------

    if (
        !pdfUrl
    ) {

        try {

            console.log(
                "PDF no encontrado en HTML."
            );

            console.log(
                "Intentando Jina."
            );


            const jinaPage =
                await fetchText(
                    JINA_PREFIX +
                    mejor.url,
                    WEB_TIMEOUT_MS
                );


            pdfUrl =
                encontrarPDF(
                    jinaPage
                );

        } catch (
            error
        ) {

            console.error(
                "Error Jina:",
                error.message
            );

        }

    }


    return {

        encontrado:
            true,

        titulo:
            mejor.titulo,

        productUrl:
            mejor.url,

        pdfUrl:
            pdfUrl ||
            "",

        fuente:
            "SAG Chile"

    };

}


// ======================================================
// CONSULTAS SAG
// ======================================================

function generarConsultasSAG(
    nombre
) {

    const original =
        limpiarNombre(
            nombre
        );


    const base =
        removeFormulation(
            original
        );


    const marca =
        removeNumbers(
            base
        );


    const consultas =
        [];


    agregarConsulta(
        consultas,
        original
    );


    agregarConsulta(
        consultas,
        base
    );


    agregarConsulta(
        consultas,
        marca
    );


    // Variaciones de formulación
    const formulaciones =
        [
            "SP",
            "PS",
            "WP",
            "PW",
            "WG",
            "SC",
            "SL",
            "EC",
            "SG"
        ];


    for (
        const f
        of formulaciones
    ) {

        agregarConsulta(
            consultas,
            `${base} ${f}`
        );

    }


    return consultas;

}


// ======================================================
// AGREGAR CONSULTA
// ======================================================

function agregarConsulta(
    lista,
    valor
) {

    if (
        !valor
    ) {

        return;

    }


    const limpio =
        valor.trim();


    if (
        !limpio
    ) {

        return;

    }


    const existe =
        lista.some(
            x =>
                normalize(
                    x
                ) ===
                normalize(
                    limpio
                )
        );


    if (
        !existe
    ) {

        lista.push(
            limpio
        );

    }

}


// ======================================================
// ELEGIR SAG
// ======================================================

function elegirMejorSAG(
    resultados,
    buscado
) {

    if (
        !resultados.length
    ) {

        return null;

    }


    const target =
        normalize(
            buscado
        );


    const base =
        normalize(
            removeFormulation(
                limpiarNombre(
                    buscado
                )
            )
        );


    const marca =
        normalize(
            removeNumbers(
                removeFormulation(
                    limpiarNombre(
                        buscado
                    )
                )
            )
        );


    let mejor =
        null;


    for (
        const item
        of resultados
    ) {

        const titulo =
            normalize(
                item.titulo
            );


        if (
            !titulo
        ) {

            continue;

        }


        let score =
            0;


        // Coincidencia exacta
        if (
            titulo ===
            target
        ) {

            score +=
                150;

        }


        // Contiene nombre completo
        if (
            titulo.includes(
                target
            )
        ) {

            score +=
                110;

        }


        // Misma base
        if (
            base &&
            titulo.includes(
                base
            )
        ) {

            score +=
                100;

        }


        // Misma marca
        if (
            marca &&
            titulo.includes(
                marca
            )
        ) {

            score +=
                45;

        }


        // Comparar palabras de la base
        const tokens =
            base.split(
                " "
            )
            .filter(
                Boolean
            );


        let hits =
            0;


        for (
            const token
            of tokens
        ) {

            if (
                titulo.includes(
                    token
                )
            ) {

                hits++;

            }

        }


        if (
            tokens.length
        ) {

            score +=
                Math.round(
                    (
                        hits /
                        tokens.length
                    ) *
                    70
                );

        }


        // Favor etiqueta
        if (
            titulo.includes(
                "etiqueta"
            )
        ) {

            score +=
                10;

        }


        if (
            !mejor ||
            score >
                mejor.score
        ) {

            mejor =
            {

                titulo:
                    item.titulo,

                url:
                    item.url,

                score:
                    score

            };

        }

    }


    if (
        !mejor ||
        mejor.score <
            70
    ) {

        return null;

    }


    return mejor;

}


// ======================================================
// BUSCAR POR SLUG
// ======================================================

async function buscarPorSlugs(
    nombre
) {

    const base =
        removeFormulation(
            limpiarNombre(
                nombre
            )
        );


    const marca =
        removeNumbers(
            base
        );


    const posibilidades =
        [];


    agregarSlug(
        posibilidades,
        base
    );


    agregarSlug(
        posibilidades,
        `${base}-sp`
    );


    agregarSlug(
        posibilidades,
        `${base}-ps`
    );


    agregarSlug(
        posibilidades,
        `${marca}-sp`
    );


    agregarSlug(
        posibilidades,
        `${marca}-ps`
    );


    agregarSlug(
        posibilidades,
        `${marca}-75-sp`
    );


    agregarSlug(
        posibilidades,
        `${marca}-75-ps`
    );


    console.log(
        "SLUGS:",
        JSON.stringify(
            posibilidades
        )
    );


    for (
        const slug
        of posibilidades
    ) {

        const url =
            `${SAG_CONTENT_URL}/${slug}`;


        try {

            const html =
                await fetchText(
                    url,
                    WEB_TIMEOUT_MS
                );


            const texto =
                normalize(
                    stripHtml(
                        html
                    )
                );


            const marcaN =
                normalize(
                    marca
                );


            if (
                texto.includes(
                    marcaN
                )
            ) {

                return {

                    titulo:
                        extraerTitulo(
                            html
                        ) ||
                        slug.replace(
                            /-/g,
                            " "
                        ),

                    url:
                        url,

                    score:
                        100

                };

            }

        } catch (
            error
        ) {

            console.log(
                "Slug no disponible:",
                slug
            );

        }

    }


    return null;

}


// ======================================================
// SLUG
// ======================================================

function agregarSlug(
    lista,
    texto
) {

    if (
        !texto
    ) {

        return;

    }


    const slug =
        normalize(
            texto
        )
        .replace(
            /\s+/g,
            "-"
        );


    if (
        slug &&
        !lista.includes(
            slug
        )
    ) {

        lista.push(
            slug
        );

    }

}


// ======================================================
// ETAPA 3
// LEER DOCUMENTO
// ======================================================

async function leerDocumento(
    url
) {

    if (
        !url
    ) {

        return "";

    }


    console.log(
        "DOCUMENTO:",
        url
    );


    // --------------------------------------------------
    // PDF
    // --------------------------------------------------

    if (
        /\.pdf(?:\?|$)/i.test(
            url
        )
    ) {

        const jinaURL =
            JINA_PREFIX +
            url;


        console.log(
            "JINA PDF:",
            jinaURL
        );


        try {

            const texto =
                await fetchText(
                    jinaURL,
                    WEB_TIMEOUT_MS
                );


            if (
                texto &&
                texto.length >
                    100
            ) {

                return texto.slice(
                    0,
                    MAX_DOCUMENT_CHARS
                );

            }

        } catch (
            error
        ) {

            console.error(
                "Error leyendo PDF:",
                error.message
            );

        }


        return "";

    }


    // --------------------------------------------------
    // HTML
    // --------------------------------------------------

    try {

        const html =
            await fetchText(
                url,
                WEB_TIMEOUT_MS
            );


        return cleanText(
            stripHtml(
                html
            )
        ).slice(
            0,
            MAX_DOCUMENT_CHARS
        );

    } catch (
        error
    ) {

        console.error(
            "Error HTML:",
            error.message
        );

        return "";

    }

}


// ======================================================
// ETAPA 4
// INTERPRETAR PDF
// ======================================================

async function interpretarPDF(
    identificacion,
    documento
) {

    const prompt = `

Eres BÍO IA.

Ahora dispones de un documento oficial
obtenido desde SAG Chile.

Tu tarea es extraer solamente los datos
que BIO necesita para completar el formulario.

La documentación SAG tiene prioridad sobre
la identificación realizada desde la fotografía.

PRODUCTO IDENTIFICADO EN LA FOTO:

${JSON.stringify(
    identificacion
)}

=========================================
DATOS QUE DEBES ENTREGAR
=========================================

1. Nombre comercial
2. Ingrediente activo
3. Concentración
4. Modo de acción
5. Función técnica
6. TODAS las plagas y enfermedades objetivo

=========================================
MODO DE ACCIÓN
=========================================

Busca expresamente dentro del documento:

- sistémico
- sistémica
- contacto
- acción de contacto
- ingestión
- acción de ingestión
- digestivo

Si el documento dice:

"sistémico con acción de contacto e ingestión"

devuelve:

[
  "sistemico",
  "contacto",
  "digestivo"
]

=========================================
FUNCIÓN
=========================================

Identifica:

- insecticida
- fungicida
- herbicida
- acaricida
- nematicida
- otras funciones claramente indicadas

=========================================
PLAGAS
=========================================

Este punto es MUY IMPORTANTE.

Busca dentro del CUADRO DE INSTRUCCIONES
DE USO y extrae TODAS las plagas,
enfermedades y organismos objetivo.

No limites arbitrariamente la cantidad.

Conserva nombres comunes y científicos
cuando ambos aparezcan.

Ejemplo:

[
  "Mosca blanca",
  "Trips",
  "Liriomyza sativa",
  "Pulgón verde",
  "Cuncunilla"
]

=========================================
NO DEBES ENTREGAR
=========================================

NO entregues:

- dosis
- dosis por hectárea
- dosis por 100 L
- carencia
- reingreso
- fabricante
- formulación
- grupo químico
- compatibilidad

Aunque estén presentes en el documento,
BIO NO necesita esos datos en esta etapa.

=========================================
RESPUESTA
=========================================

Devuelve SOLO JSON.

Estructura exacta:

{
  "tipo_registro": "quimico",
  "nombre": "",
  "ingrediente_activo": "",
  "concentracion": "",
  "modo_accion": [],
  "funcion": [],
  "plagas_objetivo": []
}

Si un dato no está disponible:

texto = "No encontrado"

lista = []

DOCUMENTACIÓN SAG:

${documento}

`;


    const resultado =
        await llamarOpenRouterTexto(
            prompt
        );


    console.log(
        "OpenRouter PDF HTTP:",
        resultado.status
    );


    console.log(
        "OpenRouter PDF modelo:",
        resultado.model
    );


    console.log(
        "RAW PDF:"
    );

    console.log(
        resultado.text
    );


    return parseJSON(
        resultado.text
    );

}


// ======================================================
// OPENROUTER CON IMAGEN
// ======================================================

async function llamarOpenRouter(
    prompt,
    imageBase64,
    mimeType
) {

    return llamarOpenRouterInterno(
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

}


// ======================================================
// OPENROUTER TEXTO
// ======================================================

async function llamarOpenRouterTexto(
    prompt
) {

    return llamarOpenRouterInterno(
        prompt,
        []
    );

}


// ======================================================
// OPENROUTER INTERNO
// ======================================================

async function llamarOpenRouterInterno(
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
        elementos.length
    ) {

        content.push(
            ...elementos
        );

    }


    const controller =
        new AbortController();


    const timer =
        setTimeout(
            () =>
                controller.abort(),
            AI_TIMEOUT_MS
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
                            "BÍO IA V11"

                    },

                    body:
                        JSON.stringify(
                            {

                                model:
                                    MODEL,

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

                            }
                        ),

                    signal:
                        controller.signal

                }
            );


        const raw =
            await response.text();


        const data =
            safeJSON(
                raw
            );


        console.log(
            "OpenRouter HTTP:",
            response.status
        );


        console.log(
            "OpenRouter modelo:",
            data?.model ||
                MODEL
        );


        if (
            !response.ok
        ) {

            console.error(
                "OpenRouter ERROR:"
            );

            console.error(
                JSON.stringify(
                    data?.error ||
                    data,
                    null,
                    2
                )
            );


            throw new Error(
                data?.error?.message ||
                `OpenRouter HTTP ${response.status}`
            );

        }


        const text =
            extraerTexto(
                data
            );


        if (
            !text
        ) {

            throw new Error(
                "OpenRouter respondió sin contenido."
            );

        }


        return {

            status:
                response.status,

            model:
                data?.model ||
                MODEL,

            text:
                text

        };

    } catch (
        error
    ) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                `OpenRouter superó el límite de ${AI_TIMEOUT_MS / 1000} segundos.`
            );

        }


        throw error;

    } finally {

        clearTimeout(
            timer
        );

    }

}


// ======================================================
// TEXTO DE RESPUESTA
// ======================================================

function extraerTexto(
    data
) {

    const content =
        data
            ?.choices
            ?.[0]
            ?.message
            ?.content;


    if (
        typeof content ===
        "string"
    ) {

        return content.trim();

    }


    if (
        Array.isArray(
            content
        )
    ) {

        return content
            .map(
                x =>
                    x?.text ||
                    ""
            )
            .filter(
                Boolean
            )
            .join(
                "\n"
            )
            .trim();

    }


    return "";

}


// ======================================================
// JSON
// ======================================================

function parseJSON(
    text
) {

    if (
        !text
    ) {

        throw new Error(
            "La IA no devolvió información."
        );

    }


    let clean =
        String(
            text
        )
        .trim();


    clean =
        clean.replace(
            /^```json\s*/i,
            ""
        );


    clean =
        clean.replace(
            /^```\s*/i,
            ""
        );


    clean =
        clean.replace(
            /\s*```$/i,
            ""
        );


    clean =
        clean.trim();


    try {

        return JSON.parse(
            clean
        );

    } catch {
        // continuar
    }


    const inicio =
        clean.indexOf(
            "{"
        );


    const fin =
        clean.lastIndexOf(
            "}"
        );


    if (
        inicio !== -1 &&
        fin > inicio
    ) {

        try {

            return JSON.parse(
                clean.slice(
                    inicio,
                    fin + 1
                )
            );

        } catch {
            // continuar
        }

    }


    console.error(
        "JSON recibido:"
    );

    console.error(
        text
    );


    throw new Error(
        "La respuesta de la IA no contiene JSON válido."
    );

}


// ======================================================
// NORMALIZAR DATOS
// ======================================================

function normalizarDatos(
    datos
) {

    if (
        !datos ||
        typeof datos !==
            "object" ||
        Array.isArray(
            datos
        )
    ) {

        datos =
            {};

    }


    const texto =
        (value) => {

            if (
                typeof value ===
                    "string" &&
                value.trim()
            ) {

                return value.trim();

            }

            return "No encontrado";

        };


    const lista =
        (value) => {

            if (
                Array.isArray(
                    value
                )
            ) {

                return [
                    ...new Set(
                        value
                            .map(
                                x =>
                                    String(
                                        x
                                    ).trim()
                            )
                            .filter(
                                Boolean
                            )
                    )
                ];

            }


            if (
                value
            ) {

                return [
                    String(
                        value
                    ).trim()
                ];

            }


            return [];

        };


    const result =
    {

        tipo_registro:
            "quimico",

        nombre:
            texto(
                datos.nombre
            ),

        ingrediente_activo:
            texto(
                datos.ingrediente_activo
            ),

        concentracion:
            texto(
                datos.concentracion
            ),

        modo_accion:
            normalizarModos(
                lista(
                    datos.modo_accion
                )
            ),

        funcion:
            normalizarFunciones(
                lista(
                    datos.funcion
                )
            ),

        plagas_objetivo:
            lista(
                datos.plagas_objetivo
            )

    };


    return result;

}


// ======================================================
// MODOS
// ======================================================

function normalizarModos(
    lista
) {

    return [
        ...new Set(
            lista.map(
                valor => {

                    const t =
                        normalize(
                            valor
                        );


                    if (
                        t.includes(
                            "sistem"
                        )
                    ) {

                        return "sistemico";

                    }


                    if (
                        t.includes(
                            "contact"
                        )
                    ) {

                        return "contacto";

                    }


                    if (
                        t.includes(
                            "ingest"
                        ) ||
                        t.includes(
                            "digest"
                        )
                    ) {

                        return "digestivo";

                    }


                    return valor;

                }
            )
        )
    ];

}


// ======================================================
// FUNCIONES
// ======================================================

function normalizarFunciones(
    lista
) {

    return [
        ...new Set(
            lista.map(
                valor => {

                    const t =
                        normalize(
                            valor
                        );


                    if (
                        t.includes(
                            "insect"
                        )
                    ) {

                        return "insecticida";

                    }


                    if (
                        t.includes(
                            "fung"
                        )
                    ) {

                        return "fungicida";

                    }


                    if (
                        t.includes(
                            "herbic"
                        )
                    ) {

                        return "herbicida";

                    }


                    if (
                        t.includes(
                            "acar"
                        )
                    ) {

                        return "acaricida";

                    }


                    if (
                        t.includes(
                            "nemat"
                        )
                    ) {

                        return "nematicida";

                    }


                    if (
                        t.includes(
                            "estimul"
                        )
                    ) {

                        return "estimulante";

                    }


                    return valor;

                }
            )
        )
    ];

}


// ======================================================
// NOMBRES
// ======================================================

function limpiarNombre(
    nombre
) {

    return String(
        nombre || ""
    )
        .replace(
            /[®™]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// ======================================================
// FORMULACIÓN
// ======================================================

function removeFormulation(
    texto
) {

    return String(
        texto || ""
    )
        .replace(
            /\b(?:WP|SP|PS|PW|WG|SC|SL|EC|SG|SE|EW|OD|CS|GR|FS|ME)\b/gi,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// ======================================================
// NÚMEROS
// ======================================================

function removeNumbers(
    texto
) {

    return String(
        texto || ""
    )
        .replace(
            /\b\d+(?:[.,]\d+)?\b/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// ======================================================
// NORMALIZACIÓN TEXTO
// ======================================================

function normalize(
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


// ======================================================
// HTML
// ======================================================

function stripHtml(
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


function cleanText(
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


function decodeHtml(
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


// ======================================================
// LINKS SAG
// ======================================================

function extraerLinksSAG(
    html
) {

    const resultados =
        [];


    const regex =
        /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


    let match;


    while (
        (
            match =
                regex.exec(
                    html ||
                    ""
                )
        ) !== null
    ) {

        const url =
            toAbsoluteSAG(
                decodeHtml(
                    match[1]
                )
            );


        const titulo =
            cleanText(
                stripHtml(
                    match[2]
                )
            );


        if (
            url.includes(
                "/content/"
            ) &&
            titulo
        ) {

            resultados.push(
                {

                    titulo:
                        titulo,

                    url:
                        url

                }
            );

        }

    }


    return resultados;

}


// ======================================================
// DUPLICADOS
// ======================================================

function eliminarDuplicados(
    items
) {

    const vistos =
        new Set();


    return items.filter(
        item => {

            const key =
                item.url +
                "|" +
                normalize(
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


// ======================================================
// PDF
// ======================================================

function encontrarPDF(
    html
) {

    const texto =
        String(
            html || ""
        );


    const hrefRegex =
        /href\s*=\s*["']([^"']+)["']/gi;


    let match;


    while (
        (
            match =
                hrefRegex.exec(
                    texto
                )
        ) !== null
    ) {

        const href =
            decodeHtml(
                match[1]
            );


        if (
            /\.pdf(?:\?|$)/i.test(
                href
            )
        ) {

            return toAbsoluteSAG(
                href
            );

        }

    }


    const urlRegex =
        /https?:\/\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?/gi;


    const urls =
        texto.match(
            urlRegex
        );


    if (
        urls &&
        urls.length
    ) {

        return decodeHtml(
            urls[0]
        );

    }


    return "";

}


// ======================================================
// URL SAG
// ======================================================

function toAbsoluteSAG(
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
        href.startsWith(
            "/"
        )
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


// ======================================================
// TÍTULO
// ======================================================

function extraerTitulo(
    html
) {

    const match =
        String(
            html || ""
        )
        .match(
            /<title[^>]*>([\s\S]*?)<\/title>/i
        );


    if (
        match &&
        match[1]
    ) {

        return cleanText(
            stripHtml(
                match[1]
            )
        );

    }


    return "";

}


// ======================================================
// SAFE JSON
// ======================================================

function safeJSON(
    raw
) {

    try {

        return JSON.parse(
            raw
        );

    } catch {

        return {
            raw:
                raw
        };

    }

}


// ======================================================
// BODY
// ======================================================

function parsearBody(
    raw
) {

    try {

        return JSON.parse(
            raw ||
            "{}"
        );

    } catch {

        throw new Error(
            "El cuerpo recibido no es JSON válido."
        );

    }

}


// ======================================================
// RESPUESTA
// ======================================================

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
