const { GoogleGenAI } = require("@google/genai");

const API_KEY = process.env.GEMINI_API_KEY;

// Modelos disponibles para intentar
const MODELOS = [
    "gemini-2.5-flash",
    "gemini-3.6-flash"
];

exports.handler = async (event) => {

    // =========================================
    // MÉTODO HTTP
    // =========================================

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ok: false,
                mensaje: "Método no permitido."
            })
        };
    }

    try {

        // =========================================
        // VERIFICAR API KEY
        // =========================================

        if (!API_KEY) {
            throw new Error(
                "No está configurada la variable GEMINI_API_KEY en Netlify."
            );
        }

        // =========================================
        // LEER DATOS RECIBIDOS
        // =========================================

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
                    mensaje: "El cuerpo de la solicitud no es JSON válido."
                })
            };
        }

        let imageBase64 = body.image || body.imageBase64;
        const promptOriginal = body.prompt || "";

        if (!imageBase64) {
            throw new Error("No se recibió ninguna imagen.");
        }

        // =========================================
        // LIMPIAR DATA URL SI VIENE COMPLETA
        // =========================================

        if (typeof imageBase64 === "string" &&
            imageBase64.includes(",")) {

            imageBase64 = imageBase64.split(",")[1];
        }

        // =========================================
        // CLIENTE GEMINI
        // =========================================

        const ai = new GoogleGenAI({
            apiKey: API_KEY
        });

        // =========================================
        // PROMPT
        // =========================================

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

Si existen varias combinaciones, conserva todas.

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
confiable, escribe:

"No encontrado"

=========================================
FORMATO DE RESPUESTA
=========================================

Devuelve EXCLUSIVAMENTE JSON válido.

NO utilices Markdown.
NO utilices bloques \`\`\`json.
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

Si hay varias dosis, cultivos o plagas, conserva toda
la información relevante dentro de los campos correspondientes.

=========================================
INFORMACIÓN ADICIONAL DE LA APLICACIÓN
=========================================

${promptOriginal}
`;

        // =========================================
        // LOG INICIAL
        // =========================================

        console.log("=================================");
        console.log("ANALIZANDO ETIQUETA");
        console.log("Imagen recibida: SI");
        console.log("Google Search: ACTIVADO");
        console.log("Fuente prioritaria: SAG Chile");
        console.log("=================================");

        // =========================================
        // FUNCIÓN PARA LLAMAR A GEMINI
        // =========================================

        async function consultarGemini(modelo) {

            console.log("Intentando modelo:", modelo);

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
                                    mimeType: "image/jpeg",
                                    data: imageBase64
                                }
                            }
                        ]
                    }
                ],

                config: {

                    // ================================
                    // GOOGLE SEARCH
                    // ================================

                    tools: [
                        {
                            googleSearch: {}
                        }
                    ],

                    // ================================
                    // RESPUESTA JSON
                    // ================================

                    responseMimeType: "application/json"
                }
            });
        }

        // =========================================
        // INTENTAR MODELOS
        // =========================================

        let result = null;
        let modeloUsado = null;
        let ultimoError = null;

        for (const modelo of MODELOS) {

            try {

                result = await consultarGemini(modelo);

                modeloUsado = modelo;

                console.log(
                    "Modelo utilizado correctamente:",
                    modelo
                );

                break;

            } catch (errorGemini) {

                ultimoError = errorGemini;

                const mensajeError =
                    errorGemini?.message ||
                    String(errorGemini);

                const statusError =
                    errorGemini?.status ||
                    errorGemini?.code ||
                    "";

                console.error(
                    "Error con modelo",
                    modelo,
                    ":",
                    mensajeError
                );

                // =====================================
                // SI ES 429, PROBAR SIGUIENTE MODELO
                // =====================================

                if (
                    statusError === 429 ||
                    mensajeError.includes("429") ||
                    mensajeError.includes("RESOURCE_EXHAUSTED") ||
                    mensajeError.includes("quota")
                ) {

                    console.log(
                        "Cuota agotada en",
                        modelo,
                        "- probando siguiente modelo..."
                    );

                    continue;
                }

                // =====================================
                // OTROS ERRORES
                // =====================================

                throw errorGemini;
            }
        }

        // =========================================
        // NINGÚN MODELO FUNCIONÓ
        // =========================================

        if (!result) {

            console.error(
                "TODOS LOS MODELOS GEMINI FALLARON."
            );

            return {
                statusCode: 429,

                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                },

                body: JSON.stringify({
                    ok: false,
                    mensaje:
                        "Se alcanzó el límite de uso de Gemini. " +
                        "Espera unos minutos y vuelve a intentarlo.",
                    proveedor: "Google Gemini",
                    modelos_intentados: MODELOS,
                    detalle:
                        ultimoError?.message ||
                        "RESOURCE_EXHAUSTED"
                })
            };
        }

        // =========================================
        // OBTENER RESPUESTA
        // =========================================

        const texto = result.text;

        if (!texto) {
            throw new Error(
                "Gemini no devolvió ninguna respuesta."
            );
        }

        console.log(
            "Respuesta recibida desde Gemini."
        );

        console.log(
            "Modelo utilizado:",
            modeloUsado
        );

        console.log(
            "Respuesta Gemini:",
            texto
        );

        // =========================================
        // CONVERTIR RESPUESTA A JSON
        // =========================================

        let datos;

        try {

            datos = JSON.parse(texto);

        } catch (errorJSON) {

            console.error(
                "ERROR CONVIRTIENDO RESPUESTA A JSON:"
            );

            console.error(texto);

            throw new Error(
                "Gemini devolvió una respuesta que no es JSON válido."
            );
        }

        // =========================================
        // VERIFICAR DATOS
        // =========================================

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

        // =========================================
        // RESPUESTA EXITOSA
        // =========================================

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

        // =========================================
        // MANEJO GENERAL DE ERRORES
        // =========================================

        console.error(
            "================================="
        );

        console.error(
            "ERROR EN analizarEtiqueta:"
        );

        console.error(error);

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
            mensaje.includes("quota");

        // =========================================
        // ERROR DE CUOTA
        // =========================================

        if (esCuota) {

            return {

                statusCode: 429,

                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                },

                body: JSON.stringify({

                    ok: false,

                    mensaje:
                        "Se alcanzó el límite de uso de Gemini. " +
                        "Espera unos minutos y vuelve a intentarlo.",

                    proveedor: "Google Gemini",

                    codigo: 429,

                    detalle: mensaje
                })
            };
        }

        // =========================================
        // ERROR NORMAL
        // =========================================

        return {

            statusCode: 500,

            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            },

            body: JSON.stringify({

                ok: false,

                mensaje: mensaje,

                proveedor: "Google Gemini",

                modelo: "gemini-2.5-flash / gemini-3.6-flash"
            })
        };
    }
};
