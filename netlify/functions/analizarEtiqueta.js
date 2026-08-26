const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELO = "openrouter/free";

/*
 * =====================================================
 * BIO IA - analizarEtiqueta.js V2
 * =====================================================
 *
 * Migración:
 *
 * ANTES:
 * Google Gemini
 *
 * AHORA:
 * OpenRouter
 *
 * Esta V2 mantiene:
 * - recepción de imagen Base64
 * - prompt de BIO IA
 * - estructura JSON
 * - validación de campos
 * - respuesta compatible con la aplicación
 *
 * TEMPORALMENTE:
 * Google Search / SAG NO está activo.
 *
 * La búsqueda oficial SAG se incorporará posteriormente.
 */

// =====================================================
// ESQUEMA JSON
// =====================================================

const RESPONSE_SCHEMA = {
    type: "object",
    additionalProperties: false,

    properties: {

        tipo_registro: {
            type: "string"
        },

        nombre: {
            type: "string"
        },

        funcion: {
            type: "array",
            items: {
                type: "string"
            }
        },

        ingrediente_activo: {
            type: "string"
        },

        concentracion: {
            type: "string"
        },

        formulacion: {
            type: "string"
        },

        dosis: {
            type: "string"
        },

        unidad_dosis: {
            type: "string"
        },

        mojamiento: {
            type: "string"
        },

        cultivos: {
            type: "array",
            items: {
                type: "string"
            }
        },

        plagas_objetivo: {
            type: "array",
            items: {
                type: "string"
            }
        },

        enfermedades: {
            type: "array",
            items: {
                type: "string"
            }
        },

        malezas: {
            type: "array",
            items: {
                type: "string"
            }
        },

        modo_accion: {
            type: "array",
            items: {
                type: "string"
            }
        },

        carencia: {
            type: "string"
        },

        reentrada: {
            type: "string"
        },

        empresa: {
            type: "string"
        },

        registro: {
            type: "string"
        },

        contenido: {
            type: "string"
        },

        compatibilidad: {
            type: "string"
        },

        observaciones: {
            type: "string"
        }
    },

    required: [
        "tipo_registro",
        "nombre",
        "funcion",
        "ingrediente_activo",
        "concentracion",
        "formulacion",
        "dosis",
        "unidad_dosis",
        "mojamiento",
        "cultivos",
        "plagas_objetivo",
        "enfermedades",
        "malezas",
        "modo_accion",
        "carencia",
        "reentrada",
        "empresa",
        "registro",
        "contenido",
        "compatibilidad",
        "observaciones"
    ]
};


// =====================================================
// FUNCIÓN PRINCIPAL NETLIFY
// =====================================================

exports.handler = async (event) => {

    // =================================================
    // MÉTODO HTTP
    // =================================================

    if (event.httpMethod !== "POST") {

        return json(405, {
            ok: false,
            mensaje: "Método no permitido."
        });

    }


    try {

        // =================================================
        // VERIFICAR API KEY
        // =================================================

        if (!API_KEY) {

            console.error(
                "ERROR: OPENROUTER_API_KEY no está configurada."
            );

            return json(500, {

                ok: false,

                mensaje:
                    "No está configurada la variable OPENROUTER_API_KEY en Netlify.",

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO

            });

        }


        // =================================================
        // LEER BODY
        // =================================================

        let body;

        try {

            body =
                JSON.parse(
                    event.body || "{}"
                );

        } catch (error) {

            console.error(
                "ERROR: Body no contiene JSON válido."
            );

            return json(400, {

                ok: false,

                mensaje:
                    "El cuerpo de la solicitud no es JSON válido."

            });

        }


        // =================================================
        // OBTENER IMAGEN
        // =================================================

        let imageBase64 =
            body.image ||
            body.imageBase64 ||
            "";

        const promptOriginal =
            body.prompt ||
            "";


        // =================================================
        // VERIFICAR IMAGEN
        // =================================================

        if (!imageBase64) {

            return json(400, {

                ok: false,

                mensaje:
                    "No se recibió ninguna imagen."

            });

        }


        // =================================================
        // IDENTIFICAR MIME TYPE
        // =================================================

        let mimeType =
            "image/jpeg";


        if (
            typeof imageBase64 === "string" &&
            imageBase64.startsWith("data:")
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


        // =================================================
        // LIMPIAR DATA URL
        // =================================================

        if (
            typeof imageBase64 === "string" &&
            imageBase64.includes(",")
        ) {

            imageBase64 =
                imageBase64.split(",")[1];

        }


        // =================================================
        // VALIDAR MIME TYPE
        // =================================================

        if (
            !mimeType.startsWith("image/")
        ) {

            return json(400, {

                ok: false,

                mensaje:
                    `Tipo de imagen no soportado: ${mimeType}`

            });

        }


        // =================================================
        // LOG DIAGNÓSTICO
        // =================================================

        console.log(
            "================================="
        );

        console.log(
            "INICIO analizarEtiqueta V2"
        );

        console.log(
            "================================="
        );

        console.log(
            "Imagen recibida: SI"
        );

        console.log(
            "Tipo imagen:",
            mimeType
        );

        console.log(
            "Tamaño Base64:",
            imageBase64.length
        );

        console.log(
            "Proveedor:",
            "OpenRouter"
        );

        console.log(
            "Modelo:",
            MODELO
        );

        console.log(
            "Google Search:",
            "DESACTIVADO"
        );

        console.log(
            "SAG/Web:",
            "DESACTIVADO EN V2"
        );

        console.log(
            "================================="
        );


        // =================================================
        // PROMPT PRINCIPAL
        // =================================================

        const prompt = `
Eres BIO IA, un asistente especializado en productos
fitosanitarios agrícolas utilizados en Chile.

Tu trabajo tiene DOS ETAPAS.

=========================================
ETAPA 1 — IDENTIFICAR EL PRODUCTO
=========================================

Analiza cuidadosamente la fotografía de la etiqueta.

Identifica, si es posible:

- nombre comercial
- ingrediente activo
- concentración
- formulación
- empresa o fabricante
- número de registro SAG
- contenido


=========================================
ETAPA 2 — INFORMACIÓN TÉCNICA
=========================================

En esta versión NO tienes acceso a Google Search
ni a navegación web.

Por lo tanto:

- utiliza solamente información visible en la imagen
- no inventes información
- no supongas dosis
- no supongas cultivos
- no supongas plagas
- no supongas carencia
- no supongas reentrada

Cuando un dato no pueda determinarse de forma confiable
a partir de la imagen, utiliza exactamente:

"No encontrado"


=========================================
DATOS A IDENTIFICAR
=========================================

Intenta completar:

- dosis
- unidad de dosis
- mojamiento / volumen de agua
- cultivos autorizados
- plagas objetivo
- enfermedades
- malezas
- modo de acción
- días de carencia
- horas de reentrada
- compatibilidad
- observaciones


=========================================
DOSIS Y MOJAMIENTO
=========================================

Si la etiqueta contiene tablas:

identifica:

- cultivo
- plaga
- dosis
- unidad
- volumen de agua
- mojamiento
- número de aplicaciones
- intervalo entre aplicaciones

NO entregues una dosis genérica.

Si aparecen diferentes combinaciones,
conserva todas las combinaciones relevantes.


=========================================
MODO DE ACCIÓN
=========================================

Identifica el mecanismo solamente si existe evidencia
suficiente en la imagen.

Si aparecen:

- IRAC
- FRAC
- HRAC
- otra clasificación

consérvalos.

NO inventes clasificaciones.


=========================================
CARENCIA
=========================================

Busca específicamente el período de carencia.

Si cambia según cultivo,
conserva cada valor visible.


=========================================
REENTRADA
=========================================

Busca específicamente el período de reentrada
o reingreso.

NO confundas carencia con reentrada.


=========================================
REGLA FUNDAMENTAL
=========================================

NO INVENTES NINGÚN DATO.

Si un dato no puede encontrarse
de forma confiable en la imagen:

"No encontrado"


=========================================
FORMATO
=========================================

Devuelve EXCLUSIVAMENTE JSON válido.

No utilices Markdown.

No utilices bloques de código.

No agregues explicaciones fuera del JSON.

Todos los campos deben existir.

Los campos de texto deben contener:

"No encontrado"

cuando no exista evidencia suficiente.

Los campos de tipo array deben utilizar:

[]

cuando no exista información suficiente.


=========================================
INFORMACIÓN ADICIONAL DE LA APLICACIÓN
=========================================

${promptOriginal}
`;


        // =================================================
        // PAYLOAD OPENROUTER
        // =================================================

        const payload = {

            model:
                MODELO,


            messages: [

                {
                    role:
                        "user",

                    content: [

                        {
                            type:
                                "text",

                            text:
                                prompt
                        },

                        {
                            type:
                                "image_url",

                            image_url: {

                                url:
                                    `data:${mimeType};base64,${imageBase64}`

                            }

                        }

                    ]

                }

            ],


            // Solamente endpoints compatibles
            provider: {

                require_parameters:
                    true

            },


            // JSON estructurado
            response_format: {

                type:
                    "json_schema",

                json_schema: {

                    name:
                        "bio_ia_respuesta",

                    strict:
                        true,

                    schema:
                        RESPONSE_SCHEMA

                }

            }

        };


        // =================================================
        // LLAMADA A OPENROUTER
        // =================================================

        console.log(
            "---------------------------------"
        );

        console.log(
            "Enviando solicitud a OpenRouter..."
        );

        console.log(
            "Modelo:",
            MODELO
        );

        console.log(
            "Imagen:",
            mimeType
        );

        console.log(
            "---------------------------------"
        );


        const inicio =
            Date.now();


        const response =
            await fetch(

                API_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${API_KEY}`,

                        "HTTP-Referer":
                            "https://bio-ia-2026.netlify.app",

                        "X-Title":
                            "BIO IA"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }

            );


        const duracion =
            Date.now() -
            inicio;


        // =================================================
        // LEER RESPUESTA
        // =================================================

        const responseText =
            await response.text();


        let data;


        try {

            data =
                JSON.parse(
                    responseText
                );

        } catch {

            data = {

                raw:
                    responseText

            };

        }


        // =================================================
        // LOG RESPUESTA
        // =================================================

        console.log(
            "================================="
        );

        console.log(
            "RESPUESTA OPENROUTER"
        );

        console.log(
            "================================="
        );

        console.log(
            "HTTP:",
            response.status
        );

        console.log(
            "Modelo solicitado:",
            MODELO
        );

        console.log(
            "Modelo utilizado:",
            data?.model ||
            "No informado"
        );

        console.log(
            "Duración:",
            `${duracion} ms`
        );

        console.log(
            "Error:",
            data?.error?.message ||
            "Ninguno"
        );

        console.log(
            "================================="
        );


        // =================================================
        // ERROR DE API
        // =================================================

        if (!response.ok) {

            const errorCode =
                data?.error?.code ||
                response.status;

            const errorMessage =
                data?.error?.message ||
                "OpenRouter rechazó la solicitud.";


            // =============================================
            // 401
            // =============================================

            if (
                response.status === 401
            ) {

                return json(
                    401,
                    {

                        ok:
                            false,

                        mensaje:
                            "OpenRouter rechazó la API Key. Verifica OPENROUTER_API_KEY en Netlify.",

                        proveedor:
                            "OpenRouter",

                        modelo:
                            MODELO,

                        codigo:
                            401,

                        detalle:
                            errorMessage

                    }
                );

            }


            // =============================================
            // 402
            // =============================================

            if (
                response.status === 402
            ) {

                return json(
                    402,
                    {

                        ok:
                            false,

                        mensaje:
                            "OpenRouter requiere saldo/créditos para esta solicitud.",

                        proveedor:
                            "OpenRouter",

                        modelo:
                            MODELO,

                        codigo:
                            402,

                        detalle:
                            errorMessage

                    }
                );

            }


            // =============================================
            // 429
            // =============================================

            if (
                response.status === 429
            ) {

                return json(
                    429,
                    {

                        ok:
                            false,

                        mensaje:
                            "OpenRouter rechazó la solicitud por límite de uso.",

                        proveedor:
                            "OpenRouter",

                        modelo:
                            MODELO,

                        codigo:
                            429,

                        detalle:
                            errorMessage

                    }
                );

            }


            // =============================================
            // 400
            // =============================================

            if (
                response.status === 400
            ) {

                return json(
                    400,
                    {

                        ok:
                            false,

                        mensaje:
                            "OpenRouter rechazó la solicitud por parámetros no válidos.",

                        proveedor:
                            "OpenRouter",

                        modelo:
                            MODELO,

                        codigo:
                            400,

                        detalle:
                            errorMessage

                    }
                );

            }


            // =============================================
            // ERROR GENERAL OPENROUTER
            // =============================================

            return json(
                502,
                {

                    ok:
                        false,

                    mensaje:
                        "OpenRouter no pudo procesar la solicitud.",

                    proveedor:
                        "OpenRouter",

                    modelo:
                        MODELO,

                    codigo:
                        errorCode,

                    detalle:
                        errorMessage

                }
            );

        }


        // =================================================
        // OBTENER TEXTO
        // =================================================

        const texto =
            extractText(
                data
            );


        if (!texto) {

            console.error(
                "OpenRouter no devolvió texto."
            );

            throw new Error(
                "OpenRouter no devolvió ninguna respuesta."
            );

        }


        console.log(
            "================================="
        );

        console.log(
            "RESPUESTA RECIBIDA"
        );

        console.log(
            "================================="
        );

        console.log(
            "Modelo utilizado:",
            data?.model ||
            "No informado"
        );


        // =================================================
        // CONVERTIR JSON
        // =================================================

        let datos;


        try {

            datos =
                JSON.parse(
                    cleanJsonText(
                        texto
                    )
                );

        } catch (errorJSON) {

            console.error(
                "ERROR CONVIRTIENDO RESPUESTA A JSON"
            );

            console.error(
                texto
            );

            throw new Error(
                "OpenRouter devolvió una respuesta que no es JSON válido."
            );

        }


        // =================================================
        // VALIDAR OBJETO
        // =================================================

        if (

            !datos ||

            typeof datos !== "object" ||

            Array.isArray(
                datos
            )

        ) {

            throw new Error(
                "OpenRouter devolvió datos vacíos o inválidos."
            );

        }


        // =================================================
        // ASEGURAR CAMPOS STRING
        // =================================================

        const camposString = [

            "tipo_registro",
            "nombre",
            "ingrediente_activo",
            "concentracion",
            "formulacion",
            "dosis",
            "unidad_dosis",
            "mojamiento",
            "carencia",
            "reentrada",
            "empresa",
            "registro",
            "contenido",
            "compatibilidad",
            "observaciones"

        ];


        // =================================================
        // ASEGURAR CAMPOS ARRAY
        // =================================================

        const camposArray = [

            "funcion",
            "cultivos",
            "plagas_objetivo",
            "enfermedades",
            "malezas",
            "modo_accion"

        ];


        // =================================================
        // NORMALIZAR STRINGS
        // =================================================

        for (
            const campo
            of camposString
        ) {

            if (
                typeof datos[campo] !==
                "string"
            ) {

                datos[campo] =

                    datos[campo] == null

                        ?

                        "No encontrado"

                        :

                        String(
                            datos[campo]
                        );

            }

        }


        // =================================================
        // NORMALIZAR ARRAYS
        // =================================================

        for (
            const campo
            of camposArray
        ) {

            if (
                !Array.isArray(
                    datos[campo]
                )
            ) {

                if (

                    datos[campo] == null ||

                    datos[campo] === ""

                ) {

                    datos[campo] =
                        [];

                } else {

                    datos[campo] = [

                        String(
                            datos[campo]
                        )

                    ];

                }

            }

        }


        // =================================================
        // LOG FINAL
        // =================================================

        console.log(
            "================================="
        );

        console.log(
            "JSON CONVERTIDO CORRECTAMENTE"
        );

        console.log(
            "================================="
        );

        console.log(
            JSON.stringify(
                datos
            )
        );


        // =================================================
        // RESPUESTA EXITOSA
        // =================================================

        return json(
            200,
            {

                ok:
                    true,

                proveedor:
                    "OpenRouter",

                modelo_solicitado:
                    MODELO,

                modelo_utilizado:
                    data?.model ||
                    null,

                confianza:
                    null,

                datos:
                    datos

            }
        );


    } catch (error) {

        // =================================================
        // ERROR GENERAL
        // =================================================

        console.error(
            "================================="
        );

        console.error(
            "ERROR GENERAL EN analizarEtiqueta V2"
        );

        console.error(
            "================================="
        );

        console.error(
            error
        );


        const mensaje =
            error?.message ||
            String(error);


        return json(
            500,
            {

                ok:
                    false,

                mensaje:
                    mensaje,

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO

            }
        );

    }

};


// =====================================================
// EXTRAER TEXTO DE OPENROUTER
// =====================================================

function extractText(data) {

    const content =
        data?.choices?.[0]?.message?.content;


    if (
        typeof content ===
        "string"
    ) {

        return content;

    }


    if (
        Array.isArray(content)
    ) {

        return content

            .map(
                (part) =>
                    part?.text ||
                    ""
            )

            .filter(
                Boolean
            )

            .join("\n");

    }


    return "";

}


// =====================================================
// LIMPIAR JSON
// =====================================================

function cleanJsonText(text) {

    if (
        typeof text !==
        "string"
    ) {

        return "";

    }


    let limpio =
        text.trim();


    // Eliminar ```json
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


    // Eliminar ```
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


    return limpio.trim();

}


// =====================================================
// RESPUESTA JSON NETLIFY
// =====================================================

function json(
    statusCode,
    body
) {

    return {

        statusCode:

            statusCode,

        headers: {

            "Content-Type":
                "application/json; charset=utf-8",

            "Cache-Control":
                "no-store"

        },

        body:

            JSON.stringify(
                body
            )

    };

}
