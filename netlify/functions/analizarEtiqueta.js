// =====================================================
// BÍO IA V8
// netlify/functions/analizarEtiqueta.js
// =====================================================
//
// OBJETIVO V8
//
// 1. Recibir fotografía
// 2. Identificar producto con OpenRouter
// 3. Buscar producto en SAG Chile
// 4. Encontrar página oficial
// 5. Encontrar PDF oficial
// 6. Leer documentación
// 7. Interpretar documentación
// 8. Aplicar reglas BIO
// 9. Calcular dosis 1 / 15 / 100 / 160 L
// 10. 1X = preventivo / 2X = curativo
// 11. Devolver JSON compatible con BIO
//
// MEJORA PRINCIPAL V8:
//
// - Registrar respuesta RAW de OpenRouter
// - Parser JSON mucho más tolerante
// - Extraer JSON aunque el modelo agregue texto
// - Intentar recuperar JSON doblemente serializado
//
// NO UTILIZA GEMINI.
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

const TIMEOUT_MS =
    30000;

const MAX_DOCUMENT_CHARS =
    90000;


// =====================================================
// HANDLER
// =====================================================

exports.handler = async (event) => {

    console.log(
        "=============================================="
    );

    console.log(
        "BÍO IA V8 - INICIO"
    );

    console.log(
        "=============================================="
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
                "ERROR: falta OPENROUTER_API_KEY"
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
        // MIME TYPE
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
            imageBase64.includes(
                ","
            )
        ) {

            imageBase64 =
                imageBase64.split(
                    ","
                )[1];

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
            "Imagen recibida:",
            mimeType
        );

        console.log(
            "Tamaño Base64:",
            imageBase64.length
        );


        // =================================================
        // ETAPA 1
        // IDENTIFICACIÓN VISUAL
        // =================================================

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
            await identificarProducto(
                imageBase64,
                mimeType,
                promptOriginal
            );


        console.log(
            "Producto:",
            identificacion.nombre
        );

        console.log(
            "Fabricante:",
            identificacion.fabricante
        );

        console.log(
            "Ingrediente:",
            identificacion.ingrediente_activo
        );

        console.log(
            "Registro:",
            identificacion.registro
        );

        console.log(
            "Modo acción:",
            JSON.stringify(
                identificacion.modo_accion
            )
        );


        // =================================================
        // ETAPA 2
        // SAG
        // =================================================

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
            "SAG encontrado:",
            sag.encontrado
        );

        console.log(
            "SAG producto:",
            sag.productUrl ||
                ""
        );

        console.log(
            "SAG PDF:",
            sag.pdfUrl ||
                ""
        );


        // =================================================
        // ETAPA 3
        // DOCUMENTACIÓN
        // =================================================

        console.log(
            "----------------------------------------------"
        );

        console.log(
            "ETAPA 3: DOCUMENTACIÓN"
        );

        console.log(
            "----------------------------------------------"
        );


        let documento =
            "";

        let documentoURL =
            "";


        if (
            sag.pdfUrl
        ) {

            documentoURL =
                sag.pdfUrl;


            console.log(
                "Intentando leer PDF oficial..."
            );


            documento =
                await leerDocumento(
                    sag.pdfUrl
                );

        }


        if (
            !documento &&
            sag.productUrl
        ) {

            console.log(
                "No se obtuvo PDF."
            );

            console.log(
                "Intentando leer página oficial SAG..."
            );


            documentoURL =
                sag.productUrl;


            documento =
                await leerDocumento(
                    sag.productUrl
                );

        }


        console.log(
            "Caracteres documento:",
            documento.length
        );


        // =================================================
        // ETAPA 4
        // INTERPRETACIÓN DOCUMENTAL
        // =================================================

        console.log(
            "----------------------------------------------"
        );

        console.log(
            "ETAPA 4: INTERPRETACIÓN DOCUMENTAL"
        );

        console.log(
            "----------------------------------------------"
        );


        let datos;


        if (
            documento.length > 0
        ) {

            datos =
                await interpretarDocumento(
                    identificacion,
                    documento,
                    promptOriginal
                );

        } else {

            console.log(
                "No existe documento para interpretar."
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
            "----------------------------------------------"
        );

        console.log(
            "ETAPA 5: REGLAS BIO"
        );

        console.log(
            "----------------------------------------------"
        );


        datos =
            aplicarReglasBIO(
                datos,
                documento
            );


        // =================================================
        // ETAPA 6
        // DOSIS
        // =================================================

        console.log(
            "----------------------------------------------"
        );

        console.log(
            "ETAPA 6: CÁLCULO DE DOSIS"
        );

        console.log(
            "----------------------------------------------"
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
            "=============================================="
        );

        console.log(
            "BÍO IA V8 - RESULTADO FINAL"
        );

        console.log(
            "=============================================="
        );

        console.log(
            JSON.stringify(
                datos,
                null,
                2
            )
        );

        console.log(
            "=============================================="
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
                    datos.modelo_utilizado ||
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
            "=============================================="
        );

        console.error(
            "ERROR GENERAL BÍO IA V8"
        );

        console.error(
            error
        );

        console.error(
            "=============================================="
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
// IDENTIFICAR PRODUCTO
// =====================================================

async function identificarProducto(
    imageBase64,
    mimeType,
    promptOriginal
) {

    const prompt = `

Eres BÍO IA, especialista en protección vegetal
y productos agrícolas en Chile.

Analiza cuidadosamente la fotografía.

Tu objetivo principal es identificar correctamente
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
- función
- plagas
- cultivos
- modo de acción

IMPORTANTE SOBRE MODO DE ACCIÓN:

Si la etiqueta dice:

"actividad sistémica"

debes incluir:

"Sistémico"

Si dice:

"acción de contacto"

debes incluir:

"Contacto"

Si dice:

"acción de ingestión"

debes incluir:

"Ingestión"

Si aparecen varias acciones:
inclúyelas todas.

NO inventes dosis, carencia o reingreso
si no están disponibles en la imagen.

Devuelve exclusivamente un objeto JSON.

ESTRUCTURA EXACTA:

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

Cuando no haya evidencia:

campo de texto:
"No encontrado"

campo array:
[]

No agregues explicaciones.

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


    console.log(
        "----------------------------------------------"
    );

    console.log(
        "RESPUESTA RAW - IDENTIFICACIÓN"
    );

    console.log(
        "----------------------------------------------"
    );

    console.log(
        texto
    );

    console.log(
        "----------------------------------------------"
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
        normalizarTexto(
            nombre
        ) ===
        "no encontrado"
    ) {

        return {

            encontrado:
                false,

            mensaje:
                "No se identificó nombre comercial."

        };

    }


    const consultas =
        [];


    consultas.push(
        nombre
    );


    // -------------------------------------------------
    // Nombre base
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
        normalizarTexto(
            registro
        ) !==
        "no encontrado"
    ) {

        consultas.push(
            registro
        );

    }


    // -------------------------------------------------
    // Nombre + ingrediente
    // -------------------------------------------------

    if (
        ingrediente &&
        normalizarTexto(
            ingrediente
        ) !==
        "no encontrado"
    ) {

        consultas.push(
            `${nombre} ${ingrediente}`
        );

    }


    // -------------------------------------------------
    // Ejecutar consultas
    // -------------------------------------------------

    for (
        const termino
        of consultas
    ) {

        console.log(
            "SAG consulta:",
            termino
        );


        const resultados =
            await consultarSAG(
                termino
            );


        console.log(
            "SAG resultados:",
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
            !mejor
        ) {

            continue;

        }


        console.log(
            "SAG mejor resultado:",
            mejor.titulo
        );


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
                "Error abriendo página SAG:",
                error
            );

        }


        let pdfUrl =
            encontrarPDF(
                pagina
            );


        // -------------------------------------------------
        // Segundo intento:
        // Jina sobre la página SAG
        // -------------------------------------------------

        if (
            !pdfUrl
        ) {

            try {

                console.log(
                    "PDF no encontrado en HTML directo."
                );

                console.log(
                    "Intentando Jina sobre página SAG..."
                );


                const jina =
                    await fetchText(
                        construirJinaURL(
                            mejor.url
                        )
                    );


                pdfUrl =
                    encontrarPDF(
                        jina
                    );

            } catch (
                error
            ) {

                console.error(
                    "Error Jina SAG:",
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
// CONSULTAR SAG
// =====================================================

async function consultarSAG(
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
                construirURLSAG(
                    baseURL,
                    termino
                );


            console.log(
                "Consultando URL SAG:",
                url
            );


            const html =
                await fetchText(
                    url
                );


            const lista =
                extraerResultadosSAG(
                    html
                );


            resultados.push(
                ...lista
            );

        } catch (
            error
        ) {

            console.error(
                "Error consultando SAG:",
                error
            );

        }

    }


    return eliminarDuplicadosSAG(
        resultados
    );

}


// =====================================================
// URL BÚSQUEDA SAG
// =====================================================

function construirURLSAG(
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
// ELEGIR MEJOR RESULTADO
// =====================================================

function elegirResultadoSAG(
    resultados,
    nombre,
    registro,
    ingrediente
) {

    if (
        !resultados.length
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


    let mayor =
        0;


    for (
        const resultado
        of resultados
    ) {

        const tituloN =
            normalizarTexto(
                resultado.titulo
            );


        let puntos =
            0;


        if (
            tituloN ===
            nombreN
        ) {

            puntos +=
                100;

        }


        if (
            tituloN.includes(
                nombreN
            )
        ) {

            puntos +=
                60;

        }


        if (
            nombreN.includes(
                tituloN
            )
        ) {

            puntos +=
                40;

        }


        if (
            registroN &&
            registroN !==
                "no encontrado" &&
            tituloN.includes(
                registroN
            )
        ) {

            puntos +=
                50;

        }


        if (
            ingredienteN &&
            ingredienteN !==
                "no encontrado" &&
            tituloN.includes(
                ingredienteN
            )
        ) {

            puntos +=
                20;

        }


        if (
            puntos >
            mayor
        ) {

            mayor =
                puntos;

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


    const regexURL =
        /https?:\/\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?/gi;


    const urls =
        html.match(
            regexURL
        );


    if (
        urls &&
        urls[0]
    ) {

        return decodeHTML(
            urls[0]
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
            "Leyendo:",
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

            const jina =
                construirJinaURL(
                    url
                );


            console.log(
                "PDF mediante Jina:",
                jina
            );


            const texto =
                await fetchText(
                    jina
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


        return limpiarEspacios(
            stripHTML(
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

    // Jina acepta:
    // https://r.jina.ai/http://URL
    //
    // Si URL ya viene con https:// se conserva
    // como parte del destino.

    return (
        "https://r.jina.ai/http://" +
        url.replace(
            /^https?:\/\//i,
            ""
        )
    );

}


// =====================================================
// INTERPRETACIÓN DOCUMENTAL
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

Eres BÍO IA, especialista en fitosanidad,
protección vegetal y productos agrícolas en Chile.

Debes interpretar exclusivamente la documentación
entregada a continuación.

La documentación proviene de una publicación SAG
o documento asociado.

NO INVENTES DATOS.

=========================================
PRIORIDAD
=========================================

1. Etiqueta oficial SAG
2. Ficha técnica/HDS oficial
3. Imagen original

=========================================
MODO DE ACCIÓN
=========================================

Busca expresamente:

- Sistémico
- Contacto
- Ingestión
- Translaminar
- Fumigante
- Preventivo
- Curativo
- Erradicante
- Residual

Si aparece "actividad sistémica":
"Sistémico"

Si aparece "acción de contacto":
"Contacto"

Si aparece "acción de ingestión":
"Ingestión"

Busca también:

- IRAC
- FRAC
- HRAC

=========================================
CRISANTEMO
=========================================

Cuando se necesite información para CRISANTEMO:

1. Buscar crisantemo.
2. Buscar flores/ornamentales.
3. Si no existe recomendación específica,
   utilizar HORTALIZAS/VERDURAS como referencia
   agronómica BIO.
4. Nunca utilizar árboles ni vides.

IMPORTANTE:

La referencia de hortalizas NO debe presentarse
como autorización SAG para crisantemo.

Debe quedar indicado en observaciones:

"Referencia agronómica BIO tomada de hortalizas
por ausencia de recomendación específica para
crisantemo/flores."

=========================================
CARENCIA
=========================================

Buscar específicamente carencia.

Prioridad:

1. cultivo específico
2. flores/ornamentales
3. invernadero
4. general

No confundir con reingreso.

=========================================
REINGRESO
=========================================

Buscar específicamente:

- reingreso
- reentrada
- ingreso al área tratada

Prioridad:

1. invernadero
2. cultivo
3. general

=========================================
DOSIS
=========================================

Extraer exactamente la dosis oficial.

Puede estar expresada en:

g/100 L
kg/100 L
mL/100 L
L/100 L
g/ha
kg/ha
mL/ha
L/ha

NO cambiar unidades.

=========================================
REGLA BIO 1X / 2X
=========================================

1X = Preventivo = presión baja

2X = Curativo = presión alta

Si el documento indica:

1X–2X

interpretar:

1X → Preventivo
2X → Curativo

Si indica que la dosis mayor corresponde
a alta presión de la plaga:

dosis menor → presión baja / preventivo
dosis mayor → presión alta / curativo

No inventar esta relación si no existe
en el documento.

=========================================
DOSIS BIO
=========================================

Cuando exista una dosis por 100 L:

calcular también:

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

Si es un rango, conservar el rango.

Si la dosis está por hectárea,
no hacer una conversión a litros
sin disponer del mojamiento oficial.

=========================================
RESULTADO
=========================================

Devuelve exclusivamente JSON válido.

NO Markdown.

NO comentarios.

NO explicaciones.

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

Si el documento no contiene un dato:

texto:
"No encontrado"

array:
[]

=========================================
PRODUCTO
=========================================

${JSON.stringify(
    identificacion
)}

=========================================
DOCUMENTACIÓN
=========================================

${texto}

=========================================
INSTRUCCIONES DE LA APLICACIÓN
=========================================

${promptOriginal}

`;


    const resultado =
        await llamarOpenRouter(
            prompt,
            []
        );


    const respuesta =
        extraerTexto(
            resultado.data
        );


    console.log(
        "----------------------------------------------"
    );

    console.log(
        "RESPUESTA RAW - DOCUMENTACIÓN"
    );

    console.log(
        "----------------------------------------------"
    );

    console.log(
        respuesta
    );

    console.log(
        "----------------------------------------------"
    );


    const datos =
        parsearJSON(
            respuesta
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

    const dosisTexto =
        String(
            datos.dosis ||
            ""
        );


    if (
        /1\s*x/i.test(
            dosisTexto
        ) ||
        /2\s*x/i.test(
            dosisTexto
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

        const obs =
            normalizarTexto(
                datos.observaciones
            );


        if (
            !obs.includes(
                "presion alta"
            )
        ) {

            datos.observaciones +=
                " La documentación relaciona la dosis mayor con alta presión de la plaga cuando corresponde.";

        }

    }


    // -------------------------------------------------
    // CRISANTEMO
    // -------------------------------------------------

    const cultivos =
        normalizarTexto(
            datos.cultivos.join(
                " "
            )
        );


    const tieneCrisantemo =
        cultivos.includes(
            "crisantemo"
        );


    const tieneFlores =
        cultivos.includes(
            "flor"
        ) ||
        cultivos.includes(
            "ornamental"
        );


    const tieneHortalizas =
        cultivos.includes(
            "hortal"
        ) ||
        cultivos.includes(
            "verdura"
        );


    if (
        !tieneCrisantemo &&
        !tieneFlores &&
        tieneHortalizas
    ) {

        const obs =
            normalizarTexto(
                datos.observaciones
            );


        if (
            !obs.includes(
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
// DOSIS BIO
// =====================================================

function construirDosisBIO(
    dosis,
    mojamiento
) {

    if (
        !dosis
    ) {

        return
            "No encontrado";

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


        let resultado =
            original +
            "\n\nCálculo BIO por volumen de agua:";


        resultado +=
            calcularVolumenes(
                a,
                b,
                unidad
            );


        return resultado;

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


        let resultado =
            original +
            "\n\nCálculo BIO por volumen de agua:";


        resultado +=
            calcularVolumenes(
                valor,
                null,
                unidad
            );


        return resultado;

    }


    // -------------------------------------------------
    // DOSIS POR HA
    // -------------------------------------------------

    if (
        /\/\s*ha\b/i.test(
            original
        ) ||
        /por\s+hect[aá]rea/i.test(
            original
        )
    ) {

        const moj =
            extraerMojamiento(
                mojamiento
            );


        if (
            moj
        ) {

            const calculado =
                calcularDesdeHectarea(
                    original,
                    moj
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
            "\n\nCálculo BIO para 1 / 15 / 100 / 160 L: requiere mojamiento oficial para convertir una dosis por hectárea.";

    }


    return original;

}


// =====================================================
// CALCULAR VOLUMENES
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

function extraerMojamiento(
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

        return {

            min:
                parseFloat(
                    match[1].replace(
                        ",",
                        "."
                    )
                ),

            max:
                parseFloat(
                    match[2].replace(
                        ",",
                        "."
                    )
                )

        };

    }


    const simple =
        String(
            texto
        ).match(
            /(\d+(?:[.,]\d+)?)\s*L\s*\/\s*ha/i
        );


    if (
        simple
    ) {

        const valor =
            parseFloat(
                simple[1].replace(
                    ",",
                    "."
                )
            );


        return {

            min:
                valor,

            max:
                valor

        };

    }


    return null;

}


// =====================================================
// CALCULAR DESDE HECTÁREA
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


    const aguaPorHa =
        (
            mojamiento.min +
            mojamiento.max
        ) /
        2;


    if (
        aguaPorHa <=
        0
    ) {

        return "";

    }


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

        const cantidadPorLitro =
            cantidad /
            aguaPorHa;


        const cantidadCalculada =
            cantidadPorLitro *
            L;


        resultado +=
            `\n${L} L = ${formatearNumero(cantidadCalculada)} ${unidad}`;

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
        typeof datos !==
            "object" ||
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
                            "BÍO IA V8"

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
                    raw:
                        raw
                };

        }


        console.log(
            "OpenRouter HTTP:",
            response.status
        );


        console.log(
            "OpenRouter modelo solicitado:",
            MODELO
        );


        console.log(
            "OpenRouter modelo utilizado:",
            data?.model ||
                "No informado"
        );


        // -------------------------------------------------
        // NUEVO EN V8:
        // registrar error detallado
        // -------------------------------------------------

        if (
            data?.error
        ) {

            console.error(
                "OpenRouter error:",
                JSON.stringify(
                    data.error,
                    null,
                    2
                )
            );

        }


        if (
            !response.ok
        ) {

            throw new Error(
                data?.error?.message ||
                `OpenRouter HTTP ${response.status}`
            );

        }


        return {

            data:

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
// PARSER JSON V8
// =====================================================
//
// Esta es una de las modificaciones principales.
//
// Intenta:
//
// 1. JSON directo
// 2. ```json ... ```
// 3. JSON rodeado de texto
// 4. JSON doblemente serializado
// 5. Primer objeto JSON balanceado
//
// =====================================================

function parsearJSON(
    texto
) {

    if (
        texto == null
    ) {

        throw new Error(
            "La IA no devolvió contenido."
        );

    }


    let valor =
        texto;


    // -------------------------------------------------
    // Intento 1: cadena directa
    // -------------------------------------------------

    if (
        typeof valor ===
        "string"
    ) {

        valor =
            valor.trim();

    }


    // -------------------------------------------------
    // Intento 2: JSON directo
    // -------------------------------------------------

    const directo =
        intentarJSON(
            valor
        );


    if (
        directo !==
        null
    ) {

        return
            directo;

    }


    // -------------------------------------------------
    // Intento 3:
    // doble serialización
    // -------------------------------------------------

    if (
        typeof valor ===
        "string"
    ) {

        try {

            const segundo =
                JSON.parse(
                    valor
                );


            if (
                typeof segundo ===
                "string"
            ) {

                const segundoParseado =
                    intentarJSON(
                        segundo
                    );


                if (
                    segundoParseado !==
                    null
                ) {

                    return
                        segundoParseado;

                }

            }

        } catch {
            // continuar
        }

    }


    // -------------------------------------------------
    // Intento 4:
    // extraer objeto JSON
    // -------------------------------------------------

    if (
        typeof valor ===
        "string"
    ) {

        const objeto =
            extraerObjetoJSON(
                valor
            );


        if (
            objeto
        ) {

            const resultado =
                intentarJSON(
                    objeto
                );


            if (
                resultado !==
                null
            ) {

                return
                    resultado;

            }

        }

    }


    // -------------------------------------------------
    // Error
    // -------------------------------------------------

    console.error(
        "=============================================="
    );

    console.error(
        "NO SE PUDO PARSEAR JSON"
    );

    console.error(
        "RESPUESTA RECIBIDA:"
    );

    console.error(
        texto
    );

    console.error(
        "=============================================="
    );


    throw new Error(
        "La respuesta de la IA no es JSON válido."
    );

}


// =====================================================
// INTENTAR JSON
// =====================================================

function intentarJSON(
    valor
) {

    if (
        typeof valor !==
        "string"
    ) {

        if (
            valor &&
            typeof valor ===
                "object"
        ) {

            return valor;

        }


        return null;

    }


    const limpio =
        valor.trim();


    if (
        !limpio
    ) {

        return null;

    }


    try {

        const resultado =
            JSON.parse(
                limpio
            );


        if (
            resultado &&
            typeof resultado ===
                "object"
        ) {

            return resultado;

        }


        return null;

    } catch {

        return null;

    }

}


// =====================================================
// EXTRAER OBJETO JSON BALANCEADO
// =====================================================

function extraerObjetoJSON(
    texto
) {

    const inicio =
        texto.indexOf(
            "{"
        );


    if (
        inicio === -1
    ) {

        return null;

    }


    let profundidad =
        0;


    let dentroString =
        false;


    let escape =
        false;


    for (
        let i =
            inicio;

        i <
            texto.length;

        i++
    ) {

        const caracter =
            texto[i];


        if (
            dentroString
        ) {

            if (
                escape
            ) {

                escape =
                    false;

                continue;

            }


            if (
                caracter ===
                "\\"
            ) {

                escape =
                    true;

                continue;

            }


            if (
                caracter ===
                '"'
            ) {

                dentroString =
                    false;

            }


            continue;

        }


        if (
            caracter ===
            '"'
        ) {

            dentroString =
                true;

            continue;

        }


        if (
            caracter ===
            "{"
        ) {

            profundidad++;

        } else if (
            caracter ===
            "}"
        ) {

            profundidad--;


            if (
                profundidad ===
                0
            ) {

                return texto.slice(
                    inicio,
                    i + 1
                );

            }

        }

    }


    return null;

}


// =====================================================
// TEXTO NORMALIZADO
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
// URL SAG
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


// =====================================================
// HTML
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
// DUPLICADOS SAG
// =====================================================

function eliminarDuplicadosSAG(
    resultados
) {

    const vistos =
        new Set();


    return resultados.filter(
        item => {

            const clave =
                item.url +
                "|" +
                normalizarTexto(
                    item.titulo
                );


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
// UNIDAD
// =====================================================

function normalizarUnidad(
    unidad
) {

    const u =
        String(
            unidad
        )
        .toLowerCase();


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
// NÚMERO
// =====================================================

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


// =====================================================
// BODY
// =====================================================

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
// FETCH
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
                            "Mozilla/5.0 BÍO-IA V8",

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
// RESPUESTA JSON
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
