const { GoogleGenAI } = require("@google/genai");

const API_KEY = process.env.GEMINI_API_KEY;
const MODELO = "gemini-3.5-flash-lite";

exports.handler = async (event) => {

    // =====================================================
    // MÉTODO HTTP
    // =====================================================

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

        // =====================================================
        // VERIFICAR API KEY
        // =====================================================

        if (!API_KEY) {
            throw new Error(
                "No está configurada la variable GEMINI_API_KEY en Netlify."
            );
        }

        // =====================================================
        // LEER DATOS
        // =====================================================

        let body;

        try {
            body = JSON.parse(event.body || "{}");
        } catch (error) {
            throw new Error(
                "El cuerpo recibido no contiene JSON válido."
            );
        }

        let imageBase64 = body.image || body.imageBase64;
        const promptUsuario = body.prompt || "";

        if (!imageBase64) {
            throw new Error(
                "No se recibió ninguna imagen."
            );
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

        if (
            typeof imageBase64 !== "string" ||
            imageBase64.length < 100
        ) {
            throw new Error(
                "La imagen recibida no es válida."
            );
        }

        // =====================================================
        // LOG
        // =====================================================

        console.log("=================================");
        console.log("INICIO analizarEtiqueta");
        console.log("=================================");
        console.log("Modelo:", MODELO);
        console.log("Imagen recibida: SI");
        console.log(
            "Tamaño Base64:",
            imageBase64.length
        );
        console.log("Google Search: DESACTIVADO");
        console.log("=================================");

        // =====================================================
        // CLIENTE GEMINI
        // =====================================================

        const ai = new GoogleGenAI({
            apiKey: API_KEY
        });

        // =====================================================
        // PROMPT
        // =====================================================

        const prompt = `
Eres BIO IA, especialista en productos fitosanitarios
agrícolas utilizados en Chile.

Analiza la imagen de la etiqueta recibida.

Primero identifica el producto con la mayor precisión posible.

Extrae de la imagen toda la información disponible sobre:

- nombre comercial
- función
- ingrediente activo
- concentración
- formulación
- dosis
- unidad de dosis
- mojamiento
- cultivos autorizados
- plagas objetivo
- enfermedades
- malezas
- modo de acción
- días de carencia
- horas de reentrada
- empresa
- registro SAG
- contenido
- compatibilidad
- observaciones

IMPORTANTE:

No inventes información.

Si un campo no aparece claramente en la etiqueta,
escribe "No encontrado".

Si aparecen varias dosis, cultivos o plagas,
conserva todas las combinaciones disponibles.

Para dosis, intenta identificar:

- dosis por hectárea
- dosis por volumen de agua
- unidad utilizada
- mojamiento o volumen de agua
- cultivo
- plaga
- número de aplicaciones
- intervalo entre aplicaciones

Para carencia identifica los días correspondientes
a cada cultivo cuando estén disponibles.

Para reentrada identifica las horas correspondientes
cuando estén disponibles.

El objetivo principal es entregar información
estructurada y confiable a partir de la etiqueta.

${promptUsuario}

DEVUELVE EXCLUSIVAMENTE JSON VÁLIDO.

NO utilices Markdown.
NO utilices ```json.
NO agregues explicaciones fuera del JSON.

Utiliza exactamente esta estructura:

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
`;

        // =====================================================
        // SOLICITUD A GEMINI
        // =====================================================

        console.log("Enviando solicitud a Gemini...");

        const result = await ai.models.generateContent({

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
                                mimeType: "image/jpeg",
                                data: imageBase64
                            }
                        }
                    ]
                }
            ],

            config: {
                responseMimeType: "application/json",
                maxOutputTokens: 4000
            }
        });

        // =====================================================
        // RESPUESTA
        // =====================================================

        const texto = result?.text;

        if (!texto) {
            throw new Error(
                "Gemini no devolvió ninguna respuesta."
            );
        }

        console.log("=================================");
        console.log("RESPUESTA RECIBIDA");
        console.log("Modelo:", MODELO);
        console.log("=================================");

        console.log(
            "Respuesta Gemini:",
            texto
        );

        // =====================================================
        // CONVERTIR JSON
        // =====================================================

        let datos;

        try {

            datos = JSON.parse(texto);

        } catch (errorJSON) {

            console.error(
                "ERROR: Gemini no devolvió JSON válido."
            );

            console.error(
                "Respuesta:",
                texto
            );

            throw new Error(
                "Gemini respondió, pero la respuesta no es JSON válido."
            );
        }

        // =====================================================
        // VALIDAR RESPUESTA
        // =====================================================

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

                modelo: MODELO,

                confianza: null,

                datos: datos

            })
        };

    } catch (error) {

        // =====================================================
        // ERROR
        // =====================================================

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
                    ? "La cuota de Gemini está agotada o limitada temporalmente."
                    : "Error al analizar la etiqueta.",

                proveedor: "Google Gemini",

                modelo: MODELO,

                codigo: esCuota ? 429 : 500,

                detalle: mensaje

            })
        };
    }
};
