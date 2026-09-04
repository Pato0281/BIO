// ======================================================
// BÍO IA V12
// analizarEtiqueta.js
// ======================================================
//
// FOTO
//   ↓
// IA - identificación inicial
//   ↓
// SAG Chile - verificación
//   ↓
// PDF SAG - si existe
//   ↓
// IA - confirmación técnica
//   ↓
// app.js
//
// LA IA ENTREGA:
//
// ✅ Nombre comercial
// ✅ Ingrediente activo
// ✅ Concentración
// ✅ Modo de acción
// ✅ Función
//
// EL USUARIO INGRESA:
//
// ✅ Plaga / Enfermedad 1
// ✅ Plaga / Enfermedad 2
// ✅ Plaga / Enfermedad 3
// ✅ Plaga / Enfermedad 4
// ✅ Dosis baja
// ✅ Dosis alta
// ✅ Unidad
// ✅ Carencia
// ✅ Reingreso
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

const SAG_SEARCH_URL =
    "https://www.sag.gob.cl/buscador-general";

const SAG_DOMAIN =
    "https://www.sag.gob.cl";

const JINA_PREFIX =
    "https://r.jina.ai/";

const AI_TIMEOUT_MS =
    20000;

const WEB_TIMEOUT_MS =
    10000;

const MAX_DOCUMENT_CHARS =
    80000;


// ======================================================
// HANDLER
// ======================================================

exports.handler = async (event) => {

    const inicio =
        Date.now();


    console.log(
        "=========================================="
    );

    console.log(
        "BÍO IA V12 - INICIO"
    );

    console.log(
        "=========================================="
    );


    if (
        event.httpMethod !== "POST"
    ) {

        return responder(
            405,
            {
                ok: false,
                mensaje:
                    "Método no permitido. Use POST."
            }
        );

    }


    if (
        !API_KEY
    ) {

        console.error(
            "OPENROUTER_API_KEY no configurada."
        );


        return responder(
            500,
            {
                ok: false,
                mensaje:
                    "OPENROUTER_API_KEY no está configurada en Netlify."
            }
        );

    }


    try {

        // =================================================
        // BODY
        // =================================================

        const body =
            parsearBody(
                event.body
            );


        let image =
            body.image ||
            body.imageBase64 ||
            "";


        if (
            !image
        ) {

            return responder(
                400,
                {
                    ok: false,
                    mensaje:
                        "No se recibió ninguna imagen."
                }
            );

        }


        // =================================================
        // MIME
        // =================================================

        let mimeType =
            "image/jpeg";


        if (
            image.startsWith(
                "data:"
            )
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


            const coma =
                image.indexOf(
                    ","
                );


            if (
                coma !== -1
            ) {

                image =
                    image.substring(
                        coma + 1
                    );

            }

        }


        console.log(
            "Imagen recibida:",
            mimeType
        );


        console.log(
            "Tamaño Base64:",
            image.length
        );


        // =================================================
        // ETAPA 1
        // IDENTIFICACIÓN VISUAL
        // =================================================

        console.log(
            "------------------------------------------"
        );

        console.log(
            "ETAPA 1: IDENTIFICACIÓN VISUAL"
        );

        console.log(
            "------------------------------------------"
        );


        let datos =
            await identificarImagen(
                image,
                mimeType
            );


        console.log(
            "IDENTIFICACIÓN INICIAL:"
        );


        console.log(
            JSON.stringify(
                datos,
                null,
                2
            )
        );


        // =================================================
        // ETAPA 2
        // SAG
        // =================================================

        console.log(
            "------------------------------------------"
        );

        console.log(
            "ETAPA 2: BÚSQUEDA SAG"
        );

        console.log(
            "------------------------------------------"
        );


        const sag =
            await buscarSAG(
                datos.nombre
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


        // =================================================
        // ETAPA 3
        // PDF
        // =================================================

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
                "------------------------------------------"
            );

            console.log(
                "ETAPA 3: LECTURA PDF SAG"
            );

            console.log(
                "------------------------------------------"
            );


            documento =
                await leerDocumento(
                    sag.pdfUrl
                );

        }


        // =================================================
        // ETAPA 4
        // CONFIRMACIÓN DOCUMENTAL
        // =================================================

        if (
            documento &&
            documento.length >
                100
        ) {

            console.log(
                "------------------------------------------"
            );

            console.log(
                "ETAPA 4: CONFIRMACIÓN EN DOCUMENTACIÓN"
            );

            console.log(
                "------------------------------------------"
            );


            try {

                const datosDocumento =
                    await interpretarDocumento(
                        datos,
                        documento
                    );


                datos =
                    combinarDatos(
                        datos,
                        datosDocumento
                    );


            } catch (
                error
            ) {

                console.error(
                    "Error interpretando documento:",
                    error.message
                );


                console.log(
                    "Se conservará la identificación inicial."
                );

            }

        } else {

            console.log(
                "No se obtuvo PDF SAG utilizable."
            );

        }


        // =================================================
        // RESULTADO FINAL
        // =================================================

        datos =
            normalizarDatos(
                datos
            );


        const resultado = {

            ok:
                true,

            proveedor:
                "OpenRouter",

            modelo:
                MODEL,

            fuente:
                sag.encontrado
                    ? "SAG Chile"
                    : "Imagen",

            fuente_url:
                fuenteURL ||
                null,

            sag:
            {

                encontrado:
                    Boolean(
                        sag.encontrado
                    ),

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
                datos,

            duracion_ms:
                Date.now() -
                inicio

        };


        console.log(
            "=========================================="
        );

        console.log(
            "BÍO IA V12 - FINAL"
        );

        console.log(
            JSON.stringify(
                resultado,
                null,
                2
            )
        );

        console.log(
            "=========================================="
        );


        return responder(
            200,
            resultado
        );


    } catch (
        error
    ) {

        console.error(
            "=========================================="
        );

        console.error(
            "ERROR GENERAL BÍO IA V12"
        );

        console.error(
            error
        );

        console.error(
            "=========================================="
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
// IDENTIFICACIÓN DE IMAGEN
// ======================================================

async function identificarImagen(
    image,
    mimeType
) {

    const prompt = `

Eres BÍO IA.

Analiza esta fotografía de un producto
fitosanitario agrícola.

Identifica únicamente información que pueda
verse o leerse razonablemente.

NO INVENTES.

DATOS REQUERIDOS:

1. Nombre comercial
2. Ingrediente activo
3. Concentración
4. Modo de acción
5. Función técnica

IMPORTANTE:

NO necesitas identificar plagas o enfermedades.
NO necesitas identificar dosis.
NO necesitas identificar carencia.
NO necesitas identificar reingreso.

Esos datos serán ingresados manualmente
por el usuario.

MODO DE ACCIÓN:

Si existe evidencia de:

- sistémico
- contacto
- ingestión
- digestivo

inclúyelos.

FUNCIÓN:

- insecticida
- fungicida
- herbicida
- acaricida
- nematicida
- estimulante

Si hay más de una, inclúyelas.

Si aparece un registro de SENASA u otro
país, no lo conviertas en registro SAG.

RESPONDE SOLO CON JSON.

Estructura:

{
  "tipo_registro": "quimico",
  "nombre": "",
  "ingrediente_activo": "",
  "concentracion": "",
  "modo_accion": [],
  "funcion": []
}

Cuando no puedas identificar algo:

texto = "No encontrado"

lista = []

`;


    const resultado =
        await llamarOpenRouterImagen(
            prompt,
            image,
            mimeType
        );


    console.log(
        "OpenRouter imagen HTTP:",
        resultado.status
    );


    console.log(
        "Modelo:",
        resultado.model
    );


    console.log(
        "RAW IDENTIFICACIÓN:"
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
// BÚSQUEDA SAG
// ======================================================

async function buscarSAG(
    nombre
) {

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
                "No se identificó producto."

        };

    }


    const consultas =
        generarConsultas(
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


    for (
        const consulta
        of consultas
    ) {

        try {

            const url =
                SAG_SEARCH_URL +
                "?search_api_fulltext=" +
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
                extraerResultadosSAG(
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
                "Error consultando SAG:",
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
        "Candidatos únicos:",
        unicos.length
    );


    const mejor =
        elegirMejorResultado(
            unicos,
            nombre
        );


    if (
        !mejor
    ) {

        return {

            encontrado:
                false,

            productoBuscado:
                nombre,

            mensaje:
                "No se encontró coincidencia confiable en SAG Chile."

        };

    }


    console.log(
        "SAG ELEGIDO:"
    );


    console.log(
        mejor.titulo
    );


    console.log(
        mejor.url
    );


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


    let pdfUrl =
        encontrarPDF(
            pagina
        );


    // --------------------------------------------------
    // Jina como segundo intento
    // --------------------------------------------------

    if (
        !pdfUrl
    ) {

        try {

            const jina =
                await fetchText(
                    JINA_PREFIX +
                    mejor.url,
                    WEB_TIMEOUT_MS
                );


            pdfUrl =
                encontrarPDF(
                    jina
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

        score:
            mejor.score

    };

}


// ======================================================
// CONSULTAS
// ======================================================

function generarConsultas(
    nombre
) {

    const consultas =
        [];


    const original =
        limpiarNombre(
            nombre
        );


    const base =
        quitarFormulacion(
            original
        );


    const marca =
        quitarNumeros(
            base
        );


    agregarUnico(
        consultas,
        original
    );


    agregarUnico(
        consultas,
        base
    );


    agregarUnico(
        consultas,
        marca
    );


    return consultas;

}


// ======================================================
// MEJOR RESULTADO
// ======================================================

function elegirMejorResultado(
    resultados,
    nombre
) {

    if (
        !resultados.length
    ) {

        return null;

    }


    const target =
        normalize(
            nombre
        );


    const base =
        normalize(
            quitarFormulacion(
                nombre
            )
        );


    const marca =
        normalize(
            quitarNumeros(
                quitarFormulacion(
                    nombre
                )
            )
        );


    let mejor =
        null;


    let mayor =
        0;


    for (
        const item
        of resultados
    ) {

        const titulo =
            normalize(
                item.titulo
            );


        let score =
            0;


        if (
            titulo ===
            target
        ) {

            score +=
                150;

        }


        if (
            titulo.includes(
                target
            )
        ) {

            score +=
                110;

        }


        if (
            base &&
            titulo.includes(
                base
            )
        ) {

            score +=
                100;

        }


        if (
            marca &&
            titulo.includes(
                marca
            )
        ) {

            score +=
                50;

        }


        const tokens =
            base.split(
                " "
            )
            .filter(
                Boolean
            );


        let coincidencias =
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

                coincidencias++;

            }

        }


        if (
            tokens.length
        ) {

            score +=
                Math.round(
                    coincidencias /
                    tokens.length *
                    60
                );

        }


        if (
            score >
            mayor
        ) {

            mayor =
                score;


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
        mayor <
            60
    ) {

        return null;

    }


    return mejor;

}


// ======================================================
// EXTRAER RESULTADOS SAG
// ======================================================

function extraerResultadosSAG(
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

        const href =
            convertirURL(
                match[1]
            );


        const titulo =
            limpiarEspacios(
                stripHTML(
                    match[2]
                )
            );


        if (
            titulo &&
            href.includes(
                "/content/"
            )
        ) {

            resultados.push(
                {

                    titulo:
                        titulo,

                    url:
                        href

                }
            );

        }

    }


    return resultados;

}


// ======================================================
// PDF
// ======================================================

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
        (
            match =
                regex.exec(
                    html
                )
        ) !== null
    ) {

        return convertirURL(
            match[1]
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

        return urls[0];

    }


    return "";

}


// ======================================================
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


    if (
        /\.pdf(?:\?|$)/i.test(
            url
        )
    ) {

        const jinaURL =
            JINA_PREFIX +
            url;


        console.log(
            "Jina PDF:",
            jinaURL
        );


        try {

            const texto =
                await fetchText(
                    jinaURL,
                    WEB_TIMEOUT_MS
                );


            return String(
                texto || ""
            )
                .slice(
                    0,
                    MAX_DOCUMENT_CHARS
                );

        } catch (
            error
        ) {

            console.error(
                "Error leyendo PDF:",
                error.message
            );


            return "";

        }

    }


    try {

        const html =
            await fetchText(
                url,
                WEB_TIMEOUT_MS
            );


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
            "Error leyendo página:",
            error.message
        );


        return "";

    }

}


// ======================================================
// INTERPRETAR PDF
// ======================================================

async function interpretarDocumento(
    identificacion,
    documento
) {

    const prompt = `

Eres BÍO IA.

Analiza la documentación oficial obtenida
desde SAG Chile.

La fotografía identificó inicialmente:

${JSON.stringify(
    identificacion
)}

Tu tarea es CONFIRMAR y corregir solamente:

- nombre comercial
- ingrediente activo
- concentración
- modo de acción
- función técnica

NO debes extraer:

- plagas
- dosis
- carencia
- reingreso
- fabricante
- formulación
- grupo químico

Esos datos serán gestionados fuera de esta etapa.

MODO DE ACCIÓN:

Busca evidencia de:

- sistémico
- contacto
- ingestión
- digestivo

FUNCIÓN:

Busca evidencia de:

- insecticida
- fungicida
- herbicida
- acaricida
- nematicida
- estimulante

Devuelve exclusivamente JSON con:

{
  "tipo_registro": "quimico",
  "nombre": "",
  "ingrediente_activo": "",
  "concentracion": "",
  "modo_accion": [],
  "funcion": []
}

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
        "RAW DOCUMENTO:"
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
// COMBINAR DATOS
// ======================================================

function combinarDatos(
    inicial,
    documental
) {

    const resultado =
        normalizarDatos(
            inicial
        );


    const doc =
        normalizarDatos(
            documental
        );


    // Si el documento tiene un dato válido,
    // tiene prioridad.

    if (
        doc.nombre !==
            "No encontrado"
    ) {

        resultado.nombre =
            doc.nombre;

    }


    if (
        doc.ingrediente_activo !==
            "No encontrado"
    ) {

        resultado.ingrediente_activo =
            doc.ingrediente_activo;

    }


    if (
        doc.concentracion !==
            "No encontrado"
    ) {

        resultado.concentracion =
            doc.concentracion;

    }


    if (
        doc.modo_accion.length
    ) {

        resultado.modo_accion =
            doc.modo_accion;

    }


    if (
        doc.funcion.length
    ) {

        resultado.funcion =
            doc.funcion;

    }


    return resultado;

}


// ======================================================
// OPENROUTER IMAGEN
// ======================================================

async function llamarOpenRouterImagen(
    prompt,
    image,
    mimeType
) {

    return llamarOpenRouter(
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

}


// ======================================================
// OPENROUTER TEXTO
// ======================================================

async function llamarOpenRouterTexto(
    prompt
) {

    return llamarOpenRouter(
        prompt,
        []
    );

}


// ======================================================
// OPENROUTER
// ======================================================

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
                            "BÍO IA V12"

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


        if (
            !response.ok
        ) {

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
                "OpenRouter no devolvió contenido."
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
                "OpenRouter superó el tiempo máximo de espera."
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
// EXTRAER TEXTO
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
// PARSEAR JSON
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
        ).trim();


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

        return JSON.parse(
            clean.slice(
                inicio,
                fin + 1
            )
        );

    }


    throw new Error(
        "La respuesta de la IA no contiene JSON válido."
    );

}


// ======================================================
// NORMALIZAR
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
        valor =>
            typeof valor ===
                "string" &&
            valor.trim()
                ? valor.trim()
                : "No encontrado";


    const lista =
        valor => {

            if (
                Array.isArray(
                    valor
                )
            ) {

                return [
                    ...new Set(
                        valor
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


            return [];

        };


    return {

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
            )

    };

}


// ======================================================
// NORMALIZAR MODOS
// ======================================================

function normalizarModos(
    lista
) {

    const resultado =
        [];


    for (
        const valor
        of lista
    ) {

        const t =
            normalize(
                valor
            );


        let nuevo =
            valor;


        if (
            t.includes(
                "sistem"
            )
        ) {

            nuevo =
                "sistemico";

        } else if (
            t.includes(
                "contact"
            )
        ) {

            nuevo =
                "contacto";

        } else if (
            t.includes(
                "ingest"
            ) ||
            t.includes(
                "digest"
            )
        ) {

            nuevo =
                "digestivo";

        }


        if (
            !resultado.includes(
                nuevo
            )
        ) {

            resultado.push(
                nuevo
            );

        }

    }


    return resultado;

}


// ======================================================
// NORMALIZAR FUNCIONES
// ======================================================

function normalizarFunciones(
    lista
) {

    const resultado =
        [];


    for (
        const valor
        of lista
    ) {

        const t =
            normalize(
                valor
            );


        let nuevo =
            valor;


        if (
            t.includes(
                "insect"
            )
        ) {

            nuevo =
                "insecticida";

        } else if (
            t.includes(
                "fung"
            )
        ) {

            nuevo =
                "fungicida";

        } else if (
            t.includes(
                "herbic"
            )
        ) {

            nuevo =
                "herbicida";

        } else if (
            t.includes(
                "acar"
            )
        ) {

            nuevo =
                "acaricida";

        } else if (
            t.includes(
                "nemat"
            )
        ) {

            nuevo =
                "nematicida";

        } else if (
            t.includes(
                "estimul"
            )
        ) {

            nuevo =
                "estimulante";

        }


        if (
            !resultado.includes(
                nuevo
            )
        ) {

            resultado.push(
                nuevo
            );

        }

    }


    return resultado;

}


// ======================================================
// FETCH TEXT
// ======================================================

async function fetchText(
    url,
    timeoutMs
) {

    const controller =
        new AbortController();


    const timer =
        setTimeout(
            () =>
                controller.abort(),
            timeoutMs
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
                            "Mozilla/5.0 BÍO IA V12",

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
                `HTTP ${response.status}`
            );

        }


        return await response.text();

    } finally {

        clearTimeout(
            timer
        );

    }

}


// ======================================================
// UTILIDADES
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


function quitarFormulacion(
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


function quitarNumeros(
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


function agregarUnico(
    lista,
    valor
) {

    if (
        !valor
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
                    valor
                )
        );


    if (
        !existe
    ) {

        lista.push(
            valor.trim()
        );

    }

}


function eliminarDuplicados(
    items
) {

    const vistos =
        new Set();


    return items.filter(
        item => {

            const clave =
                item.url +
                "|" +
                normalize(
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


function convertirURL(
    href
) {

    const valor =
        String(
            href ||
            ""
        );


    if (
        /^https?:\/\//i.test(
            valor
        )
    ) {

        return valor;

    }


    if (
        valor.startsWith(
            "//"
        )
    ) {

        return "https:" +
            valor;

    }


    if (
        valor.startsWith(
            "/"
        )
    ) {

        return SAG_DOMAIN +
            valor;

    }


    return SAG_DOMAIN +
        "/" +
        valor.replace(
            /^\/+/,
            ""
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
            "El cuerpo recibido no contiene JSON válido."
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
