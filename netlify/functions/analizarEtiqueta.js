const { GoogleGenAI } = require("@google/genai");

const API_KEY = process.env.GEMINI_API_KEY;

// =====================================================
// MODELOS ACTUALES
// =====================================================
// Primero usamos Flash-Lite por ser más económico.
// Si falla por cuota, intentamos Gemini 3.6 Flash.
const MODELOS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash"
];

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
        // API KEY
        // =====================================================

        if (!API_KEY) {
            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ok: false,
                    mensaje:
                        "No está configurada la variable GEMINI_API_KEY en Netlify."
                })
            };
        }

        // =====================================================
        // LEER SOLICITUD
        // =====================================================

        let body;

        try {
            body = JSON.parse(event.body || "{}");
        } catch (error) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ok: false,
                    mensaje:
                        "El cuerpo de la solicitud no contiene JSON válido."
                })
            };
        }

        let imageBase64 = body.image || body.imageBase64;
        const promptOriginal = body.prompt || "";

        if (!imageBase64) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ok: false,
                    mensaje: "No se recibió ninguna imagen."
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
            imageBase64 = imageBase64.split(",")[1];
        }

        // =====================================================
        // VALIDAR BASE64
        // =====================================================

        if (
            typeof imageBase64 !== "string" ||
            imageBase64.length < 100
        ) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ok: false,
                    mensaje: "La imagen recibida no es válida."
                })
            };
        }

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

Tu trabajo consiste en analizar una fotografía de una etiqueta
de un producto agrícola y posteriormente investigar información
técnica y regulatoria actualizada.

=================================================
ETAPA 1 — IDENTIFICAR EL PRODUCTO
=================================================

Analiza cuidadosamente la fotografía.

Identifica, cuando sea posible:

- nombre comercial
- ingrediente activo
- concentración
- formulación
- empresa o fabricante
- número de registro SAG
- contenido

No inventes ningún dato.

Si un dato no puede determinarse de forma confiable,
utiliza exactamente:

"No encontrado"

=================================================
ETAPA 2 — INVESTIGACIÓN
=================================================

Una vez identificado el producto, utiliza Google Search para
buscar información técnica y regulatoria actualizada.

Para productos fitosanitarios comercializados en Chile,
utiliza esta prioridad:

1. SAG Chile
2. Registro oficial SAG
3. Etiqueta oficial registrada en Chile
4. Fabricante oficial
5. Documentación técnica confiable

Si existe información oficial del SAG, debes preferirla
sobre páginas comerciales.

Si existen diferencias entre fuentes, prioriza la información
oficial chilena correspondiente al registro SAG.

=================================================
DATOS A INVESTIGAR
=================================================

Debes intentar obtener:

- dosis
- unidad de dosis
- mojamiento
- volumen de agua
- cultivos autorizados
- plagas objetivo
- enfermedades
- malezas
- modo de acción
- clasificación IRAC
- clasificación FRAC
- clasificación HRAC
- días de carencia
- horas de reentrada
- compatibilidad
- observaciones

No inventes clasificaciones.

Si una clasificación no está respaldada por información
confiable, escribe:

"No encontrado"

=================================================
DOSIS Y MOJAMIENTO
=================================================

Busca específicamente las tablas oficiales de aplicación.

Para cada combinación disponible identifica:

- cultivo
- plaga
- dosis
- unidad
- volumen de agua
- mojamiento
- número de aplicaciones
- intervalo entre aplicaciones

IMPORTANTE:

No entregues una dosis genérica si la etiqueta establece
diferentes dosis dependiendo del cultivo o de la plaga.

Si existen varias combinaciones, conserva TODAS.

=================================================
CARENCIA
=================================================

Busca específicamente el período de carencia.

Si cambia según el cultivo, conserva cada valor.

No confundas carencia con reentrada.

=================================================
REENTRADA
=================================================

Busca específicamente el período de reentrada o reingreso.

Si no existe información confiable:

"No encontrado"

=================================================
REGLA FUNDAMENTAL
=================================================

NO INVENTES NINGÚN DATO.

Si después de realizar la búsqueda no encuentras información
confiable para un campo, escribe:

"No encontrado"

=================================================
FORMATO DE RESPUESTA
=================================================

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

Si existen varias dosis, cultivos, plagas, carencias o
mojamientos, conserva toda la información relevante.

=================================================
INFORMACIÓN ADICIONAL DE LA APLICACIÓN
=================================================

${promptOriginal}
`;

        // =====================================================
        // LOG INICIAL
        // =====================================================

        console.log("=================================");
        console.log("INICIO analizarEtiqueta");
        console.log("=================================");
        console.log("Imagen recibida: SI");
        console.log("Tamaño Base64:", imageBase64.length);
        console.log("Modelos disponibles:", MODELOS.join(", "));
        console.log("Google Search: ACTIVADO");
        console.log("Fuente prioritaria: SAG Chile");
        console.log("=================================");

        // =====================================================
        // FUNCIÓN GEMINI
        // =====================================================

        async function consultarGemini(modelo) {

            console.log("---------------------------------");
            console.log("INTENTANDO MODELO:", modelo);
            console.log("Google Search: ACTIVADO");
            console.log("---------------------------------");

            const result = await ai.models.generateContent({

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
                                    mimeType: "image/jpeg",
                                    data: imageBase64
                                }
                            }
                        ]
                    }
                ],

                config: {

                    // Reducimos razonamiento innecesario
                    // para disminuir consumo y latencia.
                    thinkingConfig: {
                        thinkingLevel: "minimal"
                    },

                    // Limita la cantidad de salida.
                    maxOutputTokens: 4000,

                    // Respuesta estructurada.
                    responseMimeType: "application/json",

                    // Búsqueda Google.
                    tools: [
                        {
                            googleSearch: {}
                        }
                    ]
                }
            });

            return result;
        }

        // =====================================================
        // INTENTAR MODELOS
        // =====================================================

        let result = null;
        let modeloUsado = null;
        let ultimoError = null;

        for (const modelo of MODELOS) {

            try {

                result = await consultarGemini(modelo);

                modeloUsado = modelo;

                console.log("---------------------------------");
                console.log(
                    "MODELO FUNCIONÓ CORRECTAMENTE:",
                    modelo
                );
                console.log("---------------------------------");

                break;

            } catch (errorGemini) {

                ultimoError = errorGemini;

                const mensajeError =
                    errorGemini?.message ||
                    String(errorGemini);

                const statusError =
                    Number(
                        errorGemini?.status ||
                        errorGemini?.code ||
                        0
                    );

                console.error("---------------------------------");
                console.error(
                    "ERROR CON MODELO:",
                    modelo
                );
                console.error(
                    "STATUS:",
                    statusError
                );
                console.error(
                    "MENSAJE:",
                    mensajeError
                );
                console.error("---------------------------------");

                // =================================================
                // 404 = MODELO NO DISPONIBLE
                // =================================================

                if (
                    statusError === 404 ||
                    mensajeError.includes("404") ||
                    mensajeError.includes("NOT_FOUND")
                ) {

                    console.log(
                        "Modelo no disponible:",
                        modelo
                    );

                    continue;
                }

                // =================================================
                // 429 = CUOTA
                // =================================================

                if (
                    statusError === 429 ||
                    mensajeError.includes("429") ||
                    mensajeError.includes("RESOURCE_EXHAUSTED") ||
                    mensajeError.toLowerCase().includes("quota")
                ) {

                    console.log(
                        "CUOTA AGOTADA EN:",
                        modelo
                    );

                    // Intentamos el siguiente modelo.
                    continue;
                }

                // =================================================
                // OTRO ERROR
                // =================================================

                console.error(
                    "Error no recuperable."
                );

                break;
            }
        }

        // =====================================================
        // NINGÚN MODELO FUNCIONÓ
        // =====================================================

        if (!result) {

            const detalle =
                ultimoError?.message ||
                String(ultimoError || "Error desconocido.");

            const esCuota =
                detalle.includes("429") ||
                detalle.includes("RESOURCE_EXHAUSTED") ||
                detalle.toLowerCase().includes("quota");

            console.error("=================================");
            console.error("NINGÚN MODELO GEMINI FUNCIONÓ");
            console.error("=================================");
            console.error(detalle);

            return {
                statusCode: esCuota ? 429 : 502,

                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                },

                body: JSON.stringify({

                    ok: false,

                    mensaje: esCuota
                        ? "Gemini informó que la cuota disponible está agotada. El código y los modelos son válidos, pero Google está rechazando la solicitud por cuota."
                        : "No fue posible obtener respuesta de Gemini.",

                    proveedor: "Google Gemini",

                    modelos_intentados: MODELOS,

                    codigo: esCuota ? 429 : 502,

                    detalle: detalle
                })
            };
        }

        // =====================================================
        // OBTENER TEXTO
        // =====================================================

        const texto = result?.text;

        if (!texto) {

            console.error(
                "Gemini no devolvió texto."
            );

            throw new Error(
                "Gemini no devolvió ninguna respuesta de texto."
            );
        }

        console.log("=================================");
        console.log("RESPUESTA RECIBIDA");
        console.log("Modelo utilizado:", modeloUsado);
        console.log("=================================");

        console.log(
            "Respuesta Gemini:",
            texto
        );

        // =====================================================
        // CONVERTIR A JSON
        // =====================================================

        let datos;

        try {

            datos = JSON.parse(texto);

        } catch (errorJSON) {

            console.error(
                "================================="
            );

            console.error(
                "ERROR CONVIRTIENDO RESPUESTA A JSON"
            );

            console.error(
                texto
            );

            console.error(
                "================================="
            );

            throw new Error(
                "Gemini respondió, pero la respuesta no es JSON válido."
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
            "JSON convertido correctamente."
        );

        console.log(
            "Datos:",
            JSON.stringify(datos)
        );

        // =====================================================
        // RESPUESTA EXITOSA
        // =====================================================

        return {

            statusCode: 200,

            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            },

            body: JSON.stringify({

                ok: true,

                proveedor: "Google Gemini",

                modelo: modeloUsado,

                confianza: null,

                datos: datos

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
            "ERROR GENERAL analizarEtiqueta"
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );

        const mensaje =
            error?.message ||
            String(error);

        const esCuota =
            error?.status === 429 ||
            error?.code === 429 ||
            mensaje.includes("429") ||
            mensaje.includes("RESOURCE_EXHAUSTED") ||
            mensaje.toLowerCase().includes("quota");

        return {

            statusCode: esCuota ? 429 : 500,

            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            },

            body: JSON.stringify({

                ok: false,

                mensaje: esCuota
                    ? "La API de Gemini rechazó la solicitud por límite de cuota."
                    : "Error al analizar la etiqueta.",

                proveedor: "Google Gemini",

                codigo: esCuota ? 429 : 500,

                detalle: mensaje

            })
        };
    }
};
