// ======================================================
// BÍO IA V10.1
// analizarEtiqueta.js
// ======================================================
//
// FUNCIÓN ÚNICA:
//
// FOTO
//   ↓
// OpenRouter
//   ↓
// MiniMax M3 Free
//   ↓
// Identificación de producto
//   ↓
// JSON
//
// LA IA SOLO RELLENA:
//
// ✅ Nombre comercial
// ✅ Ingrediente activo
// ✅ Concentración
// ✅ Modo de acción
// ✅ Función técnica
// ✅ Plagas / enfermedades
//
// NO RELLENA:
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

const MODELO =
    "minimax/minimax-m3:free";

const TIMEOUT_MS =
    20000;


// ======================================================
// HANDLER PRINCIPAL
// ======================================================

exports.handler = async (event) => {

    console.log(
        "=========================================="
    );

    console.log(
        "BÍO IA V10.1 - INICIO"
    );

    console.log(
        "=========================================="
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


    try {

        // ------------------------------------------------
        // API KEY
        // ------------------------------------------------

        if (!API_KEY) {

            console.error(
                "ERROR: OPENROUTER_API_KEY no configurada."
            );

            return responder(
                500,
                {

                    ok:
                        false,

                    mensaje:
                        "OPENROUTER_API_KEY no está configurada en Netlify."

                }
            );

        }


        // ------------------------------------------------
        // BODY
        // ------------------------------------------------

        let body;


        try {

            body =
                JSON.parse(
                    event.body ||
                    "{}"
                );

        } catch {

            return responder(
                400,
                {

                    ok:
                        false,

                    mensaje:
                        "El cuerpo de la solicitud no contiene JSON válido."

                }
            );

        }


        let imageBase64 =
            body.image ||
            body.imageBase64 ||
            "";


        if (!imageBase64) {

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


        // ------------------------------------------------
        // MIME TYPE
        // ------------------------------------------------

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


            imageBase64 =
                imageBase64.substring(
                    imageBase64.indexOf(",") + 1
                );

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
                        `Tipo de archivo no soportado: ${mimeType}`

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
        // PROMPT
        // =================================================

        const prompt = `

Eres BÍO IA, especialista en identificación
de productos fitosanitarios agrícolas.

Analiza cuidadosamente la fotografía de la
etiqueta o envase.

Tu objetivo es identificar el producto con
la mayor precisión posible.

IMPORTANTE:

NO INVENTES información.

Si un dato no aparece o no puede identificarse
con suficiente seguridad, devuelve "No encontrado"
o un arreglo vacío.

=========================================
DATOS QUE SÍ DEBES IDENTIFICAR
=========================================

1. Nombre comercial del producto.

2. Ingrediente activo.

3. Concentración.

4. Modo de acción.

5. Función técnica.

6. Plagas o enfermedades objetivo.

=========================================
MODO DE ACCIÓN
=========================================

Busca expresamente información como:

- Sistémico
- Contacto
- Ingestión
- Digestivo

Si la etiqueta indica más de uno,
devuelve todos.

Ejemplos:

"acción sistémica" → "sistemico"

"acción de contacto" → "contacto"

"acción por ingestión" → "digestivo"

=========================================
FUNCIÓN TÉCNICA
=========================================

Identifica cuando corresponda:

- insecticida
- fungicida
- herbicida
- estimulante

Si aparecen varias funciones,
devuélvelas todas.

=========================================
PLAGAS / ENFERMEDADES
=========================================

Extrae las plagas o enfermedades
que aparezcan claramente en la etiqueta.

No inventes nombres.

=========================================
IMPORTANTE
=========================================

NO debes entregar:

- dosis
- dosis baja
- dosis alta
- carencia
- reingreso
- fabricante
- formulación
- grupo químico

Esos datos serán manejados por la aplicación.

=========================================
REGISTRO DE OTRO PAÍS
=========================================

Si aparece un registro como:

SENASA
Perú
Argentina
Brasil
etc.

NO lo interpretes como registro SAG Chile.

No necesitamos registrar ese dato.

=========================================
RESPUESTA
=========================================

Devuelve EXCLUSIVAMENTE un objeto JSON.

NO uses Markdown.

NO uses ```json.

NO agregues explicaciones.

Usa exactamente esta estructura:

{
  "tipo_registro": "quimico",
  "nombre": "",
  "ingrediente_activo": "",
  "concentracion": "",
  "modo_accion": [],
  "funcion": [],
  "plagas_objetivo": []
}

Si no puedes identificar un dato:

texto:
"No encontrado"

array:
[]

`;



        // =================================================
        // OPENROUTER
        // =================================================

        console.log(
            "Enviando imagen a OpenRouter..."
        );

        console.log(
            "Modelo:",
            MODELO
        );


        const resultado =
            await llamarOpenRouter(
                prompt,
                imageBase64,
                mimeType
            );


        console.log(
            "=========================================="
        );

        console.log(
            "RESPUESTA RAW OPENROUTER"
        );

        console.log(
            "=========================================="
        );

        console.log(
            resultado.texto
        );

        console.log(
            "=========================================="
        );


        // =================================================
        // JSON
        // =================================================

        const datos =
            parsearJSON(
                resultado.texto
            );


        const datosFinales =
            normalizarDatos(
                datos
            );


        console.log(
            "=========================================="
        );

        console.log(
            "DATOS IDENTIFICADOS"
        );

        console.log(
            JSON.stringify(
                datosFinales,
                null,
                2
            )
        );

        console.log(
            "=========================================="
        );


        return responder(
            200,
            {

                ok:
                    true,

                proveedor:
                    "OpenRouter",

                modelo:
                    resultado.modelo ||
                    MODELO,

                datos:
                    datosFinales

            }
        );


    } catch (
        error
    ) {

        console.error(
            "=========================================="
        );

        console.error(
            "ERROR BÍO IA V10.1"
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
                    "Error inesperado al procesar la imagen.",

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO

            }
        );

    }

};


// ======================================================
// OPENROUTER
// ======================================================

async function llamarOpenRouter(
    prompt,
    imageBase64,
    mimeType
) {

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
                    [

                        {

                            type:
                                "text",

                            text:
                                prompt

                        },

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

        const inicio =
            Date.now();


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
                            "SanidadApp BIO IA"

                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    signal:
                        controller.signal

                }
            );


        const duracion =
            Date.now() -
            inicio;


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
            "OpenRouter tiempo:",
            duracion,
            "ms"
        );


        console.log(
            "OpenRouter modelo utilizado:",
            data?.model ||
                "No informado"
        );


        if (
            !response.ok
        ) {

            console.error(
                "OpenRouter error:",
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


        const texto =
            extraerTexto(
                data
            );


        if (
            !texto
        ) {

            throw new Error(
                "OpenRouter respondió correctamente pero no devolvió texto."
            );

        }


        return {

            texto:
                texto,

            modelo:
                data?.model ||
                MODELO,

            data:
                data

        };

    } catch (
        error
    ) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                `OpenRouter superó el tiempo máximo de ${TIMEOUT_MS / 1000} segundos.`
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
                part =>
                    part?.text ||
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

function parsearJSON(
    texto
) {

    if (
        !texto
    ) {

        throw new Error(
            "La IA no devolvió información."
        );

    }


    let limpio =
        String(
            texto
        )
        .trim();


    // --------------------------------------------------
    // QUITAR MARKDOWN SI EL MODELO LO ENVÍA
    // --------------------------------------------------

    limpio =
        limpio.replace(
            /^```json\s*/i,
            ""
        );


    limpio =
        limpio.replace(
            /^```\s*/i,
            ""
        );


    limpio =
        limpio.replace(
            /\s*```$/i,
            ""
        );


    limpio =
        limpio.trim();


    // --------------------------------------------------
    // JSON DIRECTO
    // --------------------------------------------------

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

    } catch {
        // continuar
    }


    // --------------------------------------------------
    // BUSCAR OBJETO DENTRO DE LA RESPUESTA
    // --------------------------------------------------

    const inicio =
        limpio.indexOf(
            "{"
        );


    if (
        inicio ===
        -1
    ) {

        throw new Error(
            "No se encontró un objeto JSON en la respuesta de la IA."
        );

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
            limpio.length;

        i++
    ) {

        const c =
            limpio[i];


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
                c ===
                "\\"
            ) {

                escape =
                    true;

                continue;

            }


            if (
                c ===
                '"'
            ) {

                dentroString =
                    false;

            }


            continue;

        }


        if (
            c ===
            '"'
        ) {

            dentroString =
                true;

            continue;

        }


        if (
            c ===
            "{"
        ) {

            profundidad++;

        } else if (
            c ===
            "}"
        ) {

            profundidad--;


            if (
                profundidad ===
                0
            ) {

                const posible =
                    limpio.slice(
                        inicio,
                        i + 1
                    );


                try {

                    const resultado =
                        JSON.parse(
                            posible
                        );


                    if (
                        resultado &&
                        typeof resultado ===
                            "object"
                    ) {

                        return resultado;

                    }

                } catch {
                    // continuar
                }


                break;

            }

        }

    }


    console.error(
        "Respuesta JSON inválida:"
    );

    console.error(
        texto
    );


    throw new Error(
        "La respuesta de la IA no tiene un formato JSON válido."
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
        Array.isArray(datos)
    ) {

        datos =
            {};

    }


    // --------------------------------------------------
    // TIPO
    // --------------------------------------------------

    datos.tipo_registro =
        "quimico";


    // --------------------------------------------------
    // TEXTOS
    // --------------------------------------------------

    const textos =
        [

            "nombre",

            "ingrediente_activo",

            "concentracion"

        ];


    for (
        const campo
        of textos
    ) {

        if (
            typeof datos[campo] !==
                "string" ||
            !datos[campo].trim()
        ) {

            datos[campo] =
                "No encontrado";

        } else {

            datos[campo] =
                datos[campo].trim();

        }

    }


    // --------------------------------------------------
    // ARRAYS
    // --------------------------------------------------

    const arrays =
        [

            "modo_accion",

            "funcion",

            "plagas_objetivo"

        ];


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


        datos[campo] =
            datos[campo]
                .map(
                    valor =>
                        String(
                            valor
                        ).trim()
                )
                .filter(
                    Boolean
                );

    }


    // --------------------------------------------------
    // NORMALIZAR MODO DE ACCIÓN
    // --------------------------------------------------

    datos.modo_accion =
        datos.modo_accion.map(
            modo => {

                const m =
                    String(
                        modo
                    )
                    .toLowerCase();


                if (
                    m.includes(
                        "sistem"
                    )
                ) {

                    return "sistemico";

                }


                if (
                    m.includes(
                        "contact"
                    )
                ) {

                    return "contacto";

                }


                if (
                    m.includes(
                        "ingest"
                    ) ||
                    m.includes(
                        "digest"
                    )
                ) {

                    return "digestivo";

                }


                return modo;

            }
        );


    // --------------------------------------------------
    // NORMALIZAR FUNCIÓN
    // --------------------------------------------------

    datos.funcion =
        datos.funcion.map(
            funcion => {

                const f =
                    String(
                        funcion
                    )
                    .toLowerCase()
                    .trim();


                if (
                    f.includes(
                        "insect"
                    )
                ) {

                    return "insecticida";

                }


                if (
                    f.includes(
                        "fung"
                    )
                ) {

                    return "fungicida";

                }


                if (
                    f.includes(
                        "herbic"
                    )
                ) {

                    return "herbicida";

                }


                if (
                    f.includes(
                        "estimul"
                    )
                ) {

                    return "estimulante";

                }


                return funcion;

            }
        );


    // --------------------------------------------------
    // ELIMINAR DUPLICADOS
    // --------------------------------------------------

    datos.modo_accion =
        [...new Set(
            datos.modo_accion
        )];


    datos.funcion =
        [...new Set(
            datos.funcion
        )];


    datos.plagas_objetivo =
        [...new Set(
            datos.plagas_objetivo
        )];


    return datos;

}


// ======================================================
// RESPUESTA NETLIFY
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
