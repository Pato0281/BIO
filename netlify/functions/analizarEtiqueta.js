const { GoogleGenAI } = require("@google/genai");

const API_KEY = process.env.GEMINI_API_KEY;

// =====================================================
// MODELO
// =====================================================
// Gemini 2.5 Flash
// - Imagen: SI
// - Google Search: SI
// - JSON: SI
// - Disponible en Free Tier
// =====================================================

const MODELO = "gemini-2.5-flash";

exports.handler = async (event) => {

    // =====================================================
    // MÉTODO HTTP
    // =====================================================

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            },
            body: JSON.stringify({
                ok: false,
                mensaje: "Método no permitido."
            })
        };
    }

    try {

        // =====================================================
        // VERIFICAR API KEY
        // =====================================================

        if (!API_KEY) {
            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                },
                body: JSON.stringify({
                    ok: false,
                    mensaje:
                        "No está configurada la variable GEMINI_API_KEY en Netlify."
                })
            };
        }

        // =====================================================
        // LEER BODY
        // =====================================================

        let body;

        try {
            body = JSON.parse(event.body || "{}");
        } catch (error) {

            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                },
                body: JSON.stringify({
                    ok: false,
                    mensaje:
                        "El cuerpo de la solicitud no es JSON válido."
                })
            };
        }

        // =====================================================
        // OBTENER IMAGEN
        // =====================================================

        let imageBase64 =
            body.image ||
            body.imageBase64;

        const promptOriginal =
            body.prompt || "";

        if (!imageBase64) {

            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                },
                body: JSON.stringify({
                    ok: false,
                    mensaje:
                        "No se recibió ninguna imagen."
                })
            };
        }

        // =====================================================
        // LIMPIAR DATA URL
        // =====================================================

        if (
            typeof imageBase64 === "string" &&
            imageBase64.includes(",")
        ) {
            imageBase64 =
                imageBase64.split(",")[1];
        }

        console.log("=================================");
        console.log("INICIO analizarEtiqueta");
        console.log("=================================");
        console.log(
            "Imagen recibida:",
            imageBase64 ? "SI" : "NO"
        );
        console.log(
            "Tamaño Base64:",
            imageBase64.length
        );
        console.log(
            "Modelo:",
            MODELO
        );
        console.log(
            "Google Search: ACTIVADO"
        );
        console.log(
            "Fuente prioritaria: SAG Chile"
        );
        console.log("=================================");

        // =====================================================
        // CLIENTE GEMINI
        // =====================================================

        const ai = new GoogleGenAI({
            apiKey: API_KEY
        });

        // =====================================================
        // PROMPT PRINCIPAL
        // =====================================================

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
ETAPA 2 — INVESTIGAR EL PRODUCTO
=========================================

Una vez identificado el producto, utiliza Google Search
para buscar información técnica y regulatoria actualizada.

Para productos fitosanitarios en Chile utiliza esta prioridad:

1. SAG Chile
2. Registro oficial SAG
3. Etiqueta oficial registrada en Chile
4. Fabricante oficial
5. Documentación técnica confiable

No utilices una página comercial como fuente principal
si existe información oficial del SAG.

Si existen diferencias entre fuentes, prioriza la
información oficial chilena correspondiente al registro SAG.

=========================================
DATOS A INVESTIGAR
=========================================

Debes intentar completar:

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

Busca específicamente las tablas oficiales de aplicación.

Debes identificar:

- cultivo
- plaga
- dosis
- unidad
- volumen de agua
- mojamiento
- número de aplicaciones
- intervalo entre aplicaciones

NO entregues una dosis genérica si existen diferentes
dosis según cultivo o plaga.

Si existen varias combinaciones, conserva toda
la información relevante.

=========================================
MODO DE ACCIÓN
=========================================

Identifica el mecanismo de acción oficial.

Si corresponde, incluye:

- mecanismo
- IRAC
- FRAC
- HRAC
- otra clasificación oficial

NO inventes clasificaciones.

=========================================
CARENCIA
=========================================

Busca específicamente el período de carencia.

Si cambia según cultivo, conserva cada valor.

=========================================
REENTRADA
=========================================

Busca específicamente el período de reentrada o reingreso.

NO confundas carencia con reentrada.

=========================================
REGLA FUNDAMENTAL
=========================================

NO INVENTES NINGÚN DATO.

Si después de buscar no encuentras información confiable,
escribe exactamente:

"No encontrado"

=========================================
FORMATO DE RESPUESTA
=========================================

Devuelve EXCLUSIVAMENTE JSON válido.

NO utilices Markdown.

NO utilices bloques de código.

NO agregues explicaciones fuera del JSON.

La estructura obligatoria es:

{
  "tipo_registro": "",
  "nombre": "",
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
  "empresa": "",
  "registro": "",
  "contenido": "",
  "compatibilidad": "",
  "observaciones": ""
}

Si hay varias dosis, cultivos o plagas,
conserva toda la información relevante dentro
de los campos correspondientes.

=========================================
INFORMACIÓN ADICIONAL DE LA APLICACIÓN
=========================================

${promptOriginal}
`;

        // =====================================================
        // LLAMADA A GEMINI
        // =====================================================

        let result;

        try {

            console.log("=================================");
            console.log("ENVIANDO SOLICITUD A GEMINI");
            console.log("=================================");
            console.log(
                "Modelo:",
                MODELO
            );
            console.log(
                "Google Search: ACTIVADO"
            );

            result =
                await ai.models.generateContent({

                    model: MODELO,

                    contents: [
                        {
                            role: "user",

                            parts: [

                                {
                                    text: prompt
                                },

                                {
                                    inlineData: {
                                        mimeType:
                                            "image/jpeg",
                                        data:
                                            imageBase64
                                    }
                                }

                            ]
                        }
                    ],

                    config: {

                        tools: [
                            {
                                googleSearch: {}
                            }
                        ],

                        responseMimeType:
                            "application/json"
                    }
                });

            console.log(
                "================================="
            );

            console.log(
                "GEMINI RESPONDIÓ CORRECTAMENTE"
            );

            console.log(
                "================================="
            );

            // =================================================
            // REGISTRO DE CONSUMO
            // =================================================

            if (result.usageMetadata) {

                console.log(
                    "Tokens entrada:",
                    result.usageMetadata.promptTokenCount || 0
                );

                console.log(
                    "Tokens salida:",
                    result.usageMetadata.candidatesTokenCount || 0
                );

                console.log(
                    "Tokens totales:",
                    result.usageMetadata.totalTokenCount || 0
                );
            }

        } catch (errorGemini) {

            console.error(
                "================================="
            );

            console.error(
                "ERROR GEMINI"
            );

            console.error(
                "================================="
            );

            console.error(
                errorGemini
            );

            const mensaje =
                errorGemini?.message ||
                String(errorGemini);

            const status =
                errorGemini?.status ||
                errorGemini?.code ||
                "";

            // =================================================
            // ERROR 429 — CUOTA
            // =================================================

            if (
                status === 429 ||
                mensaje.includes("429") ||
                mensaje.includes("RESOURCE_EXHAUSTED") ||
                mensaje.toLowerCase().includes("quota")
            ) {

                console.error(
                    "CUOTA GEMINI AGOTADA"
                );

                return {
                    statusCode: 429,

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Cache-Control":
                            "no-store"
                    },

                    body: JSON.stringify({

                        ok: false,

                        mensaje:
                            "Gemini rechazó la solicitud por límite de cuota.",

                        proveedor:
                            "Google Gemini",

                        modelo:
                            MODELO,

                        codigo:
                            429,

                        detalle:
                            mensaje
                    })
                };
            }

            // =================================================
            // ERROR 404 — MODELO
            // =================================================

            if (
                status === 404 ||
                mensaje.includes("404") ||
                mensaje.includes("NOT_FOUND") ||
                mensaje.toLowerCase().includes("not found")
            ) {

                return {
                    statusCode: 502,

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Cache-Control":
                            "no-store"
                    },

                    body: JSON.stringify({

                        ok: false,

                        mensaje:
                            "El modelo de Gemini no está disponible para esta API.",

                        proveedor:
                            "Google Gemini",

                        modelo:
                            MODELO,

                        codigo:
                            404,

                        detalle:
                            mensaje
                    })
                };
            }

            // =================================================
            // OTRO ERROR DE GEMINI
            // =================================================

            return {
                statusCode: 500,

                headers: {
                    "Content-Type":
                        "application/json",

                    "Cache-Control":
                        "no-store"
                },

                body: JSON.stringify({

                    ok: false,

                    mensaje:
                        "Error al analizar la etiqueta con Gemini.",

                    proveedor:
                        "Google Gemini",

                    modelo:
                        MODELO,

                    detalle:
                        mensaje
                })
            };
        }

        // =====================================================
        // OBTENER RESPUESTA
        // =====================================================

        let texto =
            result?.text;

        if (!texto) {

            throw new Error(
                "Gemini no devolvió ninguna respuesta."
            );
        }

        console.log(
            "================================="
        );

        console.log(
            "RESPUESTA RECIBIDA DE GEMINI"
        );

        console.log(
            "================================="
        );

        console.log(
            texto
        );

        // =====================================================
        // LIMPIAR POSIBLE MARKDOWN
        // =====================================================

        texto =
            texto.trim();

        if (
            texto.startsWith("```") &&
            texto.endsWith("```")
        ) {

            texto =
                texto
                    .replace(/^```[a-zA-Z]*\s*/, "")
                    .replace(/\s*```$/, "")
                    .trim();
        }

        // =====================================================
        // CONVERTIR RESPUESTA A JSON
        // =====================================================

        let datos;

        try {

            datos =
                JSON.parse(texto);

        } catch (errorJSON) {

            console.error(
                "================================="
            );

            console.error(
                "ERROR CONVIRTIENDO RESPUESTA A JSON"
            );

            console.error(
                "================================="
            );

            console.error(
                texto
            );

            throw new Error(
                "Gemini devolvió una respuesta que no es JSON válido."
            );
        }

        // =====================================================
        // VALIDAR JSON
        // =====================================================

        if (
            !datos ||
            typeof datos !== "object" ||
            Array.isArray(datos)
        ) {

            throw new Error(
                "Gemini devolvió datos vacíos o inválidos."
            );
        }

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
            JSON.stringify(datos)
        );

        // =====================================================
        // RESPUESTA EXITOSA
        // =====================================================

        return {

            statusCode: 200,

            headers: {

                "Content-Type":
                    "application/json",

                "Cache-Control":
                    "no-store"
            },

            body: JSON.stringify({

                ok: true,

                proveedor:
                    "Google Gemini",

                modelo:
                    MODELO,

                confianza:
                    null,

                datos:
                    datos
            })
        };

    } catch (error) {

        // =====================================================
        // ERROR GENERAL
        // =====================================================

        console.error(
            "================================="
        );

        console.error(
            "ERROR EN analizarEtiqueta"
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

        return {

            statusCode: 500,

            headers: {

                "Content-Type":
                    "application/json",

                "Cache-Control":
                    "no-store"
            },

            body: JSON.stringify({

                ok: false,

                mensaje:
                    mensaje,

                proveedor:
                    "Google Gemini",

                modelo:
                    MODELO
            })
        };
    }
};
