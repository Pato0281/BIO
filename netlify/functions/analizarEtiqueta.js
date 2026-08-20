const { GoogleGenAI } = require("@google/genai");

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_KEY = process.env.GEMINI_API_KEY;

// MODELO ÚNICO
// No usamos 2.5 como respaldo para evitar llamadas
// adicionales cuando existe un problema de cuota.
const MODELO = "gemini-3.6-flash";

// Google Search se mantiene activado por defecto.
// Si alguna vez quieres probar Gemini sin búsqueda,
// puedes crear en Netlify:
//
// GEMINI_USE_SEARCH = false
//
// Para BIO IA normalmente debe quedar en true.
const USAR_GOOGLE_SEARCH =
    String(process.env.GEMINI_USE_SEARCH || "true").toLowerCase() !== "false";


// =====================================================
// ESQUEMA JSON
// =====================================================

const RESPONSE_SCHEMA = {
    type: "object",

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

        // =================================================
        // VERIFICAR API KEY
        // =================================================

        if (!API_KEY) {

            console.error(
                "ERROR: GEMINI_API_KEY no está configurada."
            );

            return {
                statusCode: 500,

                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                },

                body: JSON.stringify({
                    ok: false,
                    mensaje:
                        "No está configurada la variable GEMINI_API_KEY en Netlify.",
                    proveedor: "Google Gemini",
                    modelo: MODELO
                })
            };
        }


        // =================================================
        // LEER BODY
        // =================================================

        let body;

        try {

            body = JSON.parse(event.body || "{}");

        } catch (error) {

            console.error(
                "ERROR: Body no contiene JSON válido."
            );

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


        // =================================================
        // IDENTIFICAR MIME TYPE
        // =================================================

        let mimeType = "image/jpeg";

        if (
            typeof imageBase64 === "string" &&
            imageBase64.startsWith("data:")
        ) {

            const match =
                imageBase64.match(/^data:([^;]+);base64,/);

            if (match && match[1]) {
                mimeType = match[1];
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
        // INFORMACIÓN DE DIAGNÓSTICO
        // =================================================

        console.log(
            "================================="
        );

        console.log(
            "INICIO analizarEtiqueta"
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
            "Modelo:",
            MODELO
        );

        console.log(
            "Google Search:",
            USAR_GOOGLE_SEARCH
                ? "ACTIVADO"
                : "DESACTIVADO"
        );

        console.log(
            "Fuente prioritaria: SAG Chile"
        );

        console.log(
            "================================="
        );


        // =================================================
        // CLIENTE GEMINI
        // =================================================

        const ai = new GoogleGenAI({
            apiKey: API_KEY
        });


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
ETAPA 2 — INVESTIGAR EL PRODUCTO
=========================================

Una vez identificado el producto, investiga mediante
Google Search para obtener información técnica y
regulatoria actualizada.

Para productos fitosanitarios en Chile, utiliza esta
prioridad:

1. SAG Chile
2. Registro oficial SAG
3. Etiqueta oficial registrada en Chile
4. Fabricante oficial
5. Documentación técnica confiable

No utilices una página comercial como fuente principal
si existe información oficial del SAG.

Si existen diferencias entre fuentes, prioriza la
información oficial chilena correspondiente al
registro SAG.


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

Si existen varias combinaciones, conserva TODAS
las combinaciones relevantes.


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

Si después de buscar no encuentras información
confiable, escribe exactamente:

"No encontrado"


=========================================
IMPORTANTE
=========================================

La información debe corresponder al producto
identificado en la fotografía.

Busca preferentemente por:

- nombre comercial
- ingrediente activo
- número de registro SAG
- fabricante

Cuando exista una etiqueta oficial SAG, dale
prioridad sobre páginas comerciales.


=========================================
FORMATO
=========================================

Devuelve exclusivamente un objeto JSON válido.

No utilices Markdown.

No utilices bloques de código.

No agregues explicaciones fuera del JSON.

Todos los campos deben existir.

Si un dato no puede encontrarse de forma confiable,
utiliza:

"No encontrado"


=========================================
INFORMACIÓN ADICIONAL DE LA APLICACIÓN
=========================================

${promptOriginal}
`;


        // =================================================
        // CONFIGURACIÓN DE GEMINI
        // =================================================

        const config = {

            responseMimeType:
                "application/json",

            responseSchema:
                RESPONSE_SCHEMA
        };


        // =================================================
        // GOOGLE SEARCH
        // =================================================

        if (USAR_GOOGLE_SEARCH) {

            config.tools = [
                {
                    googleSearch: {}
                }
            ];
        }


        // =================================================
        // LLAMADA ÚNICA A GEMINI
        // =================================================

        let result;

        const inicio =
            Date.now();

        try {

            console.log(
                "---------------------------------"
            );

            console.log(
                "Enviando solicitud a Gemini..."
            );

            console.log(
                "Modelo:",
                MODELO
            );

            console.log(
                "Google Search:",
                USAR_GOOGLE_SEARCH
                    ? "ACTIVADO"
                    : "DESACTIVADO"
            );

            console.log(
                "---------------------------------"
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
                                            mimeType,
                                        data:
                                            imageBase64
                                    }
                                }

                            ]
                        }

                    ],

                    config: config
                });


            const duracion =
                Date.now() - inicio;

            console.log(
                "Gemini respondió correctamente."
            );

            console.log(
                "Duración:",
                duracion,
                "ms"
            );


        } catch (errorGemini) {

            const duracion =
                Date.now() - inicio;

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
                "Modelo:",
                MODELO
            );

            console.error(
                "Duración:",
                duracion,
                "ms"
            );

            console.error(
                errorGemini
            );


            const mensaje =
                errorGemini?.message ||
                String(errorGemini);


            const status =
                Number(
                    errorGemini?.status ||
                    errorGemini?.code ||
                    0
                );


            // =============================================
            // ERROR 429 — CUOTA
            // =============================================

            if (

                status === 429 ||

                mensaje.includes("429") ||

                mensaje.includes(
                    "RESOURCE_EXHAUSTED"
                ) ||

                mensaje
                    .toLowerCase()
                    .includes("quota")

            ) {

                console.error(
                    "================================="
                );

                console.error(
                    "CUOTA GEMINI AGOTADA"
                );

                console.error(
                    "================================="
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
                            "Gemini rechazó la solicitud por límite de cuota. " +
                            "El código de la aplicación está funcionando, " +
                            "pero la API de Google no permitió esta solicitud.",

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


            // =============================================
            // ERROR 404 — MODELO NO DISPONIBLE
            // =============================================

            if (

                status === 404 ||

                mensaje.includes("404") ||

                mensaje.includes(
                    "NOT_FOUND"
                ) ||

                mensaje
                    .toLowerCase()
                    .includes("not found")

            ) {

                console.error(
                    "MODELO NO DISPONIBLE:",
                    MODELO
                );


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
                            "El modelo Gemini 3.6 Flash no está disponible para esta API o proyecto.",

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


            // =============================================
            // ERROR 400
            // =============================================

            if (status === 400) {

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
                            "Gemini rechazó la solicitud por parámetros no válidos.",

                        proveedor:
                            "Google Gemini",

                        modelo:
                            MODELO,

                        codigo:
                            400,

                        detalle:
                            mensaje
                    })
                };
            }


            // =============================================
            // ERROR GENERAL GEMINI
            // =============================================

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

                    codigo:
                        status || 500,

                    detalle:
                        mensaje
                })
            };
        }


        // =================================================
        // OBTENER TEXTO
        // =================================================

        const texto =
            result?.text;


        if (!texto) {

            console.error(
                "Gemini no devolvió texto."
            );

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
            "Modelo:",
            MODELO
        );

        console.log(
            "================================="
        );


        console.log(
            texto
        );


        // =================================================
        // CONVERTIR JSON
        // =================================================

        let datos;

        try {

            datos =
                JSON.parse(texto);

        } catch (errorJSON) {

            console.error(
                "ERROR CONVIRTIENDO RESPUESTA A JSON"
            );

            console.error(
                texto
            );

            throw new Error(
                "Gemini devolvió una respuesta que no es JSON válido."
            );
        }


        // =================================================
        // VALIDAR OBJETO
        // =================================================

        if (

            !datos ||

            typeof datos !== "object" ||

            Array.isArray(datos)

        ) {

            throw new Error(
                "Gemini devolvió datos vacíos o inválidos."
            );
        }


        // =================================================
        // ASEGURAR CAMPOS
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


        const camposArray = [

            "funcion",
            "cultivos",
            "plagas_objetivo",
            "enfermedades",
            "malezas",
            "modo_accion"

        ];


        for (const campo of camposString) {

            if (
                typeof datos[campo] !== "string"
            ) {

                datos[campo] =
                    datos[campo] == null
                        ? "No encontrado"
                        : String(datos[campo]);
            }
        }


        for (const campo of camposArray) {

            if (!Array.isArray(datos[campo])) {

                if (
                    datos[campo] == null ||
                    datos[campo] === ""
                ) {

                    datos[campo] = [];

                } else {

                    datos[campo] =
                        [String(datos[campo])];
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
            JSON.stringify(datos)
        );


        // =================================================
        // RESPUESTA EXITOSA
        // =================================================

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

        // =================================================
        // ERROR GENERAL
        // =================================================

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
