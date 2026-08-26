const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Modelo gratuito de visión que ya estás utilizando en functions/index.js
const MODELO = "qwen/qwen2.5-vl-72b-instruct:free";

// =====================================================
// FUNCIÓN PRINCIPAL NETLIFY
// =====================================================

exports.handler = async (event) => {

    // -------------------------------------------------
    // MÉTODO HTTP
    // -------------------------------------------------

    if (event.httpMethod !== "POST") {
        return json(405, {
            ok: false,
            mensaje: "Método no permitido."
        });
    }

    try {

        // -------------------------------------------------
        // API KEY
        // -------------------------------------------------

        if (!API_KEY) {

            console.error(
                "ERROR: OPENROUTER_API_KEY no está configurada."
            );

            return json(500, {
                ok: false,
                mensaje:
                    "No está configurada la variable OPENROUTER_API_KEY en Netlify.",
                proveedor: "OpenRouter",
                modelo: MODELO
            });
        }

        // -------------------------------------------------
        // BODY
        // -------------------------------------------------

        let body;

        try {
            body = JSON.parse(event.body || "{}");
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

        // -------------------------------------------------
        // IMAGEN
        // -------------------------------------------------

        let imageBase64 =
            body.image ||
            body.imageBase64 ||
            "";

        const promptOriginal =
            body.prompt ||
            "";

        if (!imageBase64) {
            return json(400, {
                ok: false,
                mensaje: "No se recibió ninguna imagen."
            });
        }

        // -------------------------------------------------
        // MIME TYPE
        // -------------------------------------------------

        let mimeType = "image/jpeg";

        if (
            typeof imageBase64 === "string" &&
            imageBase64.startsWith("data:")
        ) {

            const match =
                imageBase64.match(
                    /^data:([^;]+);base64,/
                );

            if (match && match[1]) {
                mimeType = match[1];
            }
        }

        // -------------------------------------------------
        // LIMPIAR DATA URL
        // -------------------------------------------------

        if (
            typeof imageBase64 === "string" &&
            imageBase64.includes(",")
        ) {
            imageBase64 =
                imageBase64.split(",")[1];
        }

        // -------------------------------------------------
        // VALIDAR IMAGEN
        // -------------------------------------------------

        if (!mimeType.startsWith("image/")) {

            return json(400, {
                ok: false,
                mensaje:
                    `Tipo de imagen no soportado: ${mimeType}`
            });
        }

        // -------------------------------------------------
        // LOG INICIAL
        // -------------------------------------------------

        console.log("=================================");
        console.log("INICIO analizarEtiqueta");
        console.log("=================================");
        console.log("Proveedor: OpenRouter");
        console.log("Modelo:", MODELO);
        console.log("Imagen:", mimeType);
        console.log(
            "Tamaño Base64:",
            imageBase64.length
        );
        console.log(
            "Google Search: DESACTIVADO"
        );
        console.log(
            "Prueba: Qwen Vision + JSON object"
        );
        console.log("=================================");

        // -------------------------------------------------
        // PROMPT
        // -------------------------------------------------

        const prompt = `
Eres BIO IA, un asistente especializado en productos
fitosanitarios agrícolas utilizados en Chile.

Analiza cuidadosamente la fotografía proporcionada.

IMPORTANTE:
NO INVENTES NINGÚN DATO.

Si un dato no puede determinarse con suficiente confianza
a partir de la imagen, utiliza:

"No encontrado"

=========================================
IDENTIFICACIÓN DEL PRODUCTO
=========================================

Identifica, si es posible:

- nombre comercial
- ingrediente activo
- concentración
- formulación
- empresa fabricante
- registro SAG
- contenido

=========================================
TIPO DE PRODUCTO
=========================================

Determina si corresponde a:

- Insecticida
- Fungicida
- Herbicida
- Acaricida
- Nematicida
- Bactericida
- Molusquicida
- Fertilizante
- Fertilizante Foliar
- Bioestimulante
- Corrector Nutricional
- Coadyuvante
- Regulador de Crecimiento
- Inoculante
- Producto Biológico
- Enmienda
- Otro

=========================================
TIPO DE REGISTRO
=========================================

Devuelve:

"quimico"

o

"biologico"

=========================================
INFORMACIÓN TÉCNICA
=========================================

Extrae de la imagen, cuando sea legible:

- dosis
- unidad de dosis
- mojamiento / volumen de agua
- cultivos autorizados
- plagas objetivo
- enfermedades
- malezas
- modo de acción
- carencia
- reentrada
- compatibilidad
- observaciones

=========================================
DOSIS
=========================================

Si aparecen tablas de aplicación,
mantén la relación:

cultivo + plaga + dosis + unidad + agua.

No inventes una dosis genérica.

=========================================
MODO DE ACCIÓN
=========================================

Si aparece información sobre:

- Contacto
- Sistémico
- Ingestión
- Translaminar
- Fumigante
- Preventivo
- Curativo
- Erradicante
- Residual
- IRAC
- FRAC
- HRAC

consérvala.

No inventes ninguna clasificación.

=========================================
RESPUESTA
=========================================

Devuelve EXCLUSIVAMENTE un objeto JSON válido.

NO Markdown.
NO comentarios.
NO explicaciones.

Utiliza exactamente esta estructura:

{
  "tipo_registro": "",
  "nombre": "",
  "fabricante": "",
  "registro": "",
  "funcion": [],
  "ingrediente_activo": "",
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

Todos los campos deben existir.

Cuando no haya información suficiente:

- texto: "No encontrado"
- arreglo: []

=========================================
INFORMACIÓN ADICIONAL
=========================================

${promptOriginal}
`;

        // -------------------------------------------------
        // PETICIÓN OPENROUTER
        // -------------------------------------------------

        const payload = {

            model: MODELO,

            temperature: 0.1,

            response_format: {
                type: "json_object"
            },

            messages: [
                {
                    role: "user",

                    content: [
                        {
                            type: "text",
                            text: prompt
                        },

                        {
                            type: "image_url",

                            image_url: {
                                url:
                                    `data:${mimeType};base64,${imageBase64}`
                            }
                        }
                    ]
                }
            ]
        };

        console.log(
            "Enviando solicitud a OpenRouter..."
        );

        const inicio = Date.now();

        const response = await fetch(
            API_URL,
            {
                method: "POST",

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
                    JSON.stringify(payload)
            }
        );

        const duracion =
            Date.now() - inicio;

        // -------------------------------------------------
        // RESPUESTA DEL PROVEEDOR
        // -------------------------------------------------

        const responseText =
            await response.text();

        let data;

        try {
            data =
                JSON.parse(responseText);
        } catch {
            data = {
                raw: responseText
            };
        }

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

        // -------------------------------------------------
        // ERROR DE OPENROUTER
        // -------------------------------------------------

        if (!response.ok) {

            const errorCode =
                data?.error?.code ||
                response.status;

            const errorMessage =
                data?.error?.message ||
                "OpenRouter rechazó la solicitud.";

            if (response.status === 401) {

                return json(401, {
                    ok: false,
                    mensaje:
                        "OpenRouter rechazó la API Key.",
                    proveedor:
                        "OpenRouter",
                    modelo:
                        MODELO,
                    codigo:
                        401,
                    detalle:
                        errorMessage
                });
            }

            if (response.status === 402) {

                return json(402, {
                    ok: false,
                    mensaje:
                        "OpenRouter requiere saldo o créditos para esta solicitud.",
                    proveedor:
                        "OpenRouter",
                    modelo:
                        MODELO,
                    codigo:
                        402,
                    detalle:
                        errorMessage
                });
            }

            if (response.status === 429) {

                return json(429, {
                    ok: false,
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
                });
            }

            if (response.status === 400) {

                return json(400, {
                    ok: false,
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
                });
            }

            return json(502, {
                ok: false,
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
            });
        }

        // -------------------------------------------------
        // EXTRAER TEXTO
        // -------------------------------------------------

        const texto =
            extractText(data);

        if (!texto) {

            throw new Error(
                "OpenRouter no devolvió ninguna respuesta."
            );
        }

        console.log(
            "Respuesta recibida correctamente."
        );

        // -------------------------------------------------
        // CONVERTIR JSON
        // -------------------------------------------------

        let datos;

        try {

            datos =
                JSON.parse(
                    cleanJsonText(texto)
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

        // -------------------------------------------------
        // VALIDAR OBJETO
        // -------------------------------------------------

        if (
            !datos ||
            typeof datos !== "object" ||
            Array.isArray(datos)
        ) {

            throw new Error(
                "OpenRouter devolvió datos inválidos."
            );
        }

        // -------------------------------------------------
        // CAMPOS DE TEXTO
        // -------------------------------------------------

        const camposString = [

            "tipo_registro",
            "nombre",
            "fabricante",
            "registro",
            "ingrediente_activo",
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

        // -------------------------------------------------
        // CAMPOS ARRAY
        // -------------------------------------------------

        const camposArray = [

            "funcion",
            "cultivos",
            "plagas_objetivo",
            "enfermedades",
            "malezas",
            "modo_accion"
        ];

        // -------------------------------------------------
        // NORMALIZAR TEXTOS
        // -------------------------------------------------

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
                        ? "No encontrado"
                        : String(
                            datos[campo]
                        );
            }
        }

        // -------------------------------------------------
        // NORMALIZAR ARRAYS
        // -------------------------------------------------

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

                    datos[campo] = [];

                } else {

                    datos[campo] = [
                        String(
                            datos[campo]
                        )
                    ];
                }
            }
        }

        // -------------------------------------------------
        // LOG FINAL
        // -------------------------------------------------

        console.log(
            "================================="
        );

        console.log(
            "JSON CONVERTIDO CORRECTAMENTE"
        );

        console.log(
            JSON.stringify(
                datos
            )
        );

        console.log(
            "================================="
        );

        // -------------------------------------------------
        // RESPUESTA
        // -------------------------------------------------

        return json(
            200,
            {
                ok: true,

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

        console.error(
            "================================="
        );

        console.error(
            "ERROR GENERAL EN analizarEtiqueta"
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
                ok: false,

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
// EXTRAER TEXTO
// =====================================================

function extractText(data) {

    const content =
        data?.choices?.[0]?.message?.content;

    if (
        typeof content === "string"
    ) {
        return content;
    }

    if (
        Array.isArray(content)
    ) {

        return content

            .map(
                part =>
                    part?.text || ""
            )

            .filter(Boolean)

            .join("\n");
    }

    return "";
}


// =====================================================
// LIMPIAR JSON
// =====================================================

function cleanJsonText(text) {

    if (
        typeof text !== "string"
    ) {
        return "";
    }

    let limpio =
        text.trim();

    if (
        limpio.startsWith("```json")
    ) {

        limpio =
            limpio.slice(7);
    }

    if (
        limpio.startsWith("```")
    ) {

        limpio =
            limpio.slice(3);
    }

    if (
        limpio.endsWith("```")
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
