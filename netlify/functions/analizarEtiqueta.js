const { GoogleGenAI } = require("@google/genai");

const API_KEY = process.env.GEMINI_API_KEY;

/*
=========================================================
MODELOS
=========================================================

1) Gemini 2.5 Flash-Lite:
   - Imagen
   - Google Search
   - Nivel gratuito
   - Ideal para esta función

2) Gemini 3.6 Flash:
   - Imagen
   - Sin Google Search en nivel gratuito
   - Se utiliza como respaldo
*/

const MODELO_PRINCIPAL = "gemini-2.5-flash-lite";
const MODELO_RESPALDO = "gemini-3.6-flash";

exports.handler = async (event) => {

    console.log("=================================");
    console.log("INICIO analizarEtiqueta");
    console.log("=================================");

    // =====================================================
    // MÉTODO HTTP
    // =====================================================

    if (event.httpMethod !== "POST") {
        return respuestaJSON(
            405,
            {
                ok: false,
                mensaje: "Método no permitido."
            }
        );
    }

    try {

        // =================================================
        // API KEY
        // =================================================

        if (!API_KEY) {
            return respuestaJSON(
                500,
                {
                    ok: false,
                    mensaje:
                        "No está configurada GEMINI_API_KEY en Netlify."
                }
            );
        }

        // =================================================
        // LEER BODY
        // =================================================

        let body;

        try {
            body = JSON.parse(event.body || "{}");
        } catch (error) {

            return respuestaJSON(
                400,
                {
                    ok: false,
                    mensaje:
                        "El cuerpo recibido no es JSON válido."
                }
            );
        }

        // =================================================
        // IMAGEN
        // =================================================

        let imageBase64 =
            body.image ||
            body.imageBase64 ||
            "";

        const promptOriginal =
            body.prompt ||
            "";

        if (!imageBase64) {

            return respuestaJSON(
                400,
                {
                    ok: false,
                    mensaje:
                        "No se recibió ninguna imagen."
                }
            );
        }

        // =================================================
        // DETECTAR MIME TYPE
        // =================================================

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

            imageBase64 =
                imageBase64.split(",")[1];
        }

        // =================================================
        // VALIDAR BASE64
        // =================================================

        if (
            typeof imageBase64 !== "string" ||
            imageBase64.length < 100
        ) {

            return respuestaJSON(
                400,
                {
                    ok: false,
                    mensaje:
                        "La imagen recibida no parece válida."
                }
            );
        }

        console.log(
            "Imagen recibida:",
            mimeType
        );

        // =================================================
        // CLIENTE GEMINI
        // =================================================

        const ai = new GoogleGenAI({
            apiKey: API_KEY
        });

        // =================================================
        // PROMPT
        // =================================================

        const prompt = `
Eres BIO IA, un asistente especializado en productos
fitosanitarios agrícolas utilizados en Chile.

Tu trabajo consiste en analizar una fotografía de una
etiqueta agrícola y obtener la información técnica
correspondiente.

=========================================================
ETAPA 1 — IDENTIFICAR EL PRODUCTO
=========================================================

Analiza cuidadosamente la fotografía.

Identifica cuando sea posible:

- nombre comercial
- ingrediente activo
- concentración
- formulación
- empresa o fabricante
- número de registro SAG
- contenido

=========================================================
ETAPA 2 — INFORMACIÓN TÉCNICA
=========================================================

Busca información técnica confiable.

Para productos fitosanitarios utilizados en Chile,
la prioridad es:

1. SAG Chile
2. Registro oficial SAG
3. Etiqueta oficial registrada en Chile
4. Fabricante oficial
5. Documentación técnica confiable

No inventes información.

Si existe información oficial del SAG,
debe tener prioridad sobre páginas comerciales.

=========================================================
DATOS A OBTENER
=========================================================

Intenta obtener:

- dosis
- unidad de dosis
- mojamiento / volumen de agua
- cultivos autorizados
- plagas objetivo
- enfermedades
- malezas
- modo de acción
- IRAC
- FRAC
- HRAC
- días de carencia
- horas de reentrada
- compatibilidad
- observaciones

=========================================================
DOSIS
=========================================================

Busca específicamente las tablas de aplicación.

Cuando corresponda identifica:

- cultivo
- plaga
- dosis
- unidad
- volumen de agua
- mojamiento
- número de aplicaciones
- intervalo entre aplicaciones

Si existen varias dosis según cultivo o plaga,
conserva todas.

NO entregues una dosis genérica si existen
diferentes dosis oficiales.

=========================================================
MODO DE ACCIÓN
=========================================================

Identifica el mecanismo de acción cuando esté disponible.

Incluye IRAC, FRAC, HRAC u otra clasificación
solamente si existe información confiable.

NO inventes clasificaciones.

=========================================================
CARENCIA
=========================================================

Busca específicamente el período de carencia.

Si cambia según cultivo,
conserva cada valor.

=========================================================
REENTRADA
=========================================================

Busca específicamente el período de reentrada
o reingreso.

NO confundas carencia con reentrada.

=========================================================
REGLA FUNDAMENTAL
=========================================================

NO INVENTES NINGÚN DATO.

Si una información no puede ser confirmada,
escribe:

"No encontrado"

=========================================================
FORMATO
=========================================================

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

=========================================================
INFORMACIÓN ADICIONAL
=========================================================

${promptOriginal}
`;

        // =================================================
        // FUNCIÓN GEMINI
        // =================================================

        async function consultarGemini(
            modelo,
            usarGoogleSearch
        ) {

            console.log(
                "Intentando modelo:",
                modelo
            );

            console.log(
                "Google Search:",
                usarGoogleSearch
                    ? "ACTIVADO"
                    : "DESACTIVADO"
            );

            const config = {

                responseMimeType:
                    "application/json"

            };

            // -------------------------------------------------
            // GOOGLE SEARCH
            // -------------------------------------------------

            if (usarGoogleSearch) {

                config.tools = [
                    {
                        googleSearch: {}
                    }
                ];

            }

            return await ai.models.generateContent({

                model: modelo,

                contents: [
                    {
                        role: "user",

                        parts: [

                            {
                                text: prompt
                            },

                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: imageBase64
                                }
                            }

                        ]
                    }
                ],

                config: config

            });
        }

        // =================================================
        // INTENTO 1
        // GEMINI 2.5 FLASH-LITE + SEARCH
        // =================================================

        let result = null;
        let modeloUsado = null;

        let primerError = null;

        try {

            console.log(
                "---------------------------------"
            );

            console.log(
                "INTENTO 1:"
            );

            console.log(
                MODELO_PRINCIPAL,
                "+ Google Search"
            );

            console.log(
                "---------------------------------"
            );

            result =
                await consultarGemini(
                    MODELO_PRINCIPAL,
                    true
                );

            modeloUsado =
                MODELO_PRINCIPAL;

            console.log(
                "ÉXITO:",
                MODELO_PRINCIPAL
            );

        } catch (error1) {

            primerError = error1;

            console.error(
                "FALLÓ:",
                MODELO_PRINCIPAL
            );

            console.error(
                obtenerMensajeError(error1)
            );

        }

        // =================================================
        // INTENTO 2
        // GEMINI 3.6 SIN SEARCH
        // =================================================

        if (!result) {

            try {

                console.log(
                    "---------------------------------"
                );

                console.log(
                    "INTENTO 2:"
                );

                console.log(
                    MODELO_RESPALDO,
                    "SIN Google Search"
                );

                console.log(
                    "---------------------------------"
                );

                result =
                    await consultarGemini(
                        MODELO_RESPALDO,
                        false
                    );

                modeloUsado =
                    MODELO_RESPALDO;

                console.log(
                    "ÉXITO:",
                    MODELO_RESPALDO
                );

            } catch (error2) {

                console.error(
                    "FALLÓ:",
                    MODELO_RESPALDO
                );

                console.error(
                    obtenerMensajeError(error2)
                );

                // =========================================
                // NINGÚN MODELO FUNCIONÓ
                // =========================================

                const mensaje1 =
                    obtenerMensajeError(
                        primerError
                    );

                const mensaje2 =
                    obtenerMensajeError(
                        error2
                    );

                const es429 =
                    esError429(primerError) ||
                    esError429(error2);

                console.error(
                    "================================="
                );

                console.error(
                    "NINGÚN MODELO FUNCIONÓ"
                );

                console.error(
                    "================================="
                );

                if (es429) {

                    return respuestaJSON(
                        429,
                        {
                            ok: false,

                            mensaje:
                                "Gemini informó un límite de uso. " +
                                "La función intentó automáticamente " +
                                "el modelo de respaldo.",

                            proveedor:
                                "Google Gemini",

                            codigo:
                                429,

                            detalle:
                                mensaje2 ||
                                mensaje1 ||
                                "RESOURCE_EXHAUSTED",

                            modelos_intentados: [
                                MODELO_PRINCIPAL,
                                MODELO_RESPALDO
                            ]
                        }
                    );
                }

                return respuestaJSON(
                    500,
                    {
                        ok: false,

                        mensaje:
                            "No fue posible analizar la etiqueta.",

                        proveedor:
                            "Google Gemini",

                        detalle:
                            mensaje2 ||
                            mensaje1 ||
                            "Error desconocido",

                        modelos_intentados: [
                            MODELO_PRINCIPAL,
                            MODELO_RESPALDO
                        ]
                    }
                );
            }
        }

        // =================================================
        // VERIFICAR RESPUESTA
        // =================================================

        if (!result) {

            throw new Error(
                "Gemini no devolvió resultado."
            );
        }

        // =================================================
        // OBTENER TEXTO
        // =================================================

        const texto =
            result.text;

        if (!texto) {

            throw new Error(
                "Gemini no devolvió ninguna respuesta."
            );
        }

        console.log(
            "Respuesta recibida."
        );

        console.log(
            "Modelo utilizado:",
            modeloUsado
        );

        // =================================================
        // CONVERTIR A JSON
        // =================================================

        let datos;

        try {

            datos =
                JSON.parse(texto);

        } catch (errorJSON) {

            console.error(
                "================================="
            );

            console.error(
                "ERROR JSON"
            );

            console.error(
                texto
            );

            console.error(
                "================================="
            );

            throw new Error(
                "Gemini devolvió una respuesta que no es JSON válido."
            );
        }

        // =================================================
        // VALIDAR
        // =================================================

        if (
            !datos ||
            typeof datos !== "object" ||
            Array.isArray(datos)
        ) {

            throw new Error(
                "Gemini devolvió datos inválidos."
            );
        }

        console.log(
            "JSON convertido correctamente."
        );

        console.log(
            "Producto:",
            datos.nombre || "No encontrado"
        );

        console.log(
            "Registro SAG:",
            datos.registro || "No encontrado"
        );

        // =================================================
        // RESPUESTA EXITOSA
        // =================================================

        return respuestaJSON(
            200,
            {

                ok: true,

                proveedor:
                    "Google Gemini",

                modelo:
                    modeloUsado,

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
            "ERROR EN analizarEtiqueta"
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );

        const mensaje =
            obtenerMensajeError(error);

        // =================================================
        // ERROR 429
        // =================================================

        if (esError429(error)) {

            return respuestaJSON(
                429,
                {

                    ok: false,

                    mensaje:
                        "Se alcanzó el límite de uso de Gemini.",

                    proveedor:
                        "Google Gemini",

                    codigo:
                        429,

                    detalle:
                        mensaje

                }
            );
        }

        // =================================================
        // ERROR GENERAL
        // =================================================

        return respuestaJSON(
            500,
            {

                ok: false,

                mensaje:
                    "No se pudo analizar la etiqueta.",

                proveedor:
                    "Google Gemini",

                detalle:
                    mensaje

            }
        );
    }
};


// =========================================================
// FUNCIONES AUXILIARES
// =========================================================

function obtenerMensajeError(error) {

    if (!error) {
        return "";
    }

    if (error.message) {
        return error.message;
    }

    return String(error);
}


function esError429(error) {

    if (!error) {
        return false;
    }

    const mensaje =
        obtenerMensajeError(error);

    return (

        error.status === 429 ||

        error.code === 429 ||

        mensaje.includes("429") ||

        mensaje.includes(
            "RESOURCE_EXHAUSTED"
        ) ||

        mensaje.toLowerCase().includes(
            "quota"
        ) ||

        mensaje.toLowerCase().includes(
            "rate limit"
        )

    );
}


function respuestaJSON(
    statusCode,
    datos
) {

    return {

        statusCode,

        headers: {

            "Content-Type":
                "application/json",

            "Cache-Control":
                "no-store",

            "Access-Control-Allow-Origin":
                "*",

            "Access-Control-Allow-Headers":
                "Content-Type",

            "Access-Control-Allow-Methods":
                "POST, OPTIONS"

        },

        body:
            JSON.stringify(datos)

    };
}
