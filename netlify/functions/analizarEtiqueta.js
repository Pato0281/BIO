const { GoogleGenAI } = require("@google/genai");

const API_KEY = process.env.GEMINI_API_KEY;

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

        const body = JSON.parse(event.body || "{}");

        const imageBase64 = body.image || body.imageBase64;
        const prompt = body.prompt || "";

        if (!imageBase64) {
            throw new Error("No se recibió ninguna imagen.");
        }

        // =========================================
        // CLIENTE GEMINI
        // =========================================

        const ai = new GoogleGenAI({
            apiKey: API_KEY
        });

        // =========================================
        // MODELO
        // =========================================

        const model = "gemini-2.5-flash";

        // =========================================
        // ENVIAR IMAGEN + PROMPT A GEMINI
        // =========================================

        const result = await ai.models.generateContent({
            model: model,

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
            ]
        });

        // =========================================
        // OBTENER RESPUESTA
        // =========================================

        let texto = result.text;

        if (!texto) {
            throw new Error(
                "Gemini no devolvió ninguna respuesta."
            );
        }

        // =========================================
        // LIMPIAR JSON
        // =========================================

        texto = texto
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        // =========================================
        // CONVERTIR RESPUESTA A JSON
        // =========================================

        let datos;

        try {

            datos = JSON.parse(texto);

        } catch (e) {

            console.error(
                "Respuesta recibida desde Gemini:",
                texto
            );

            throw new Error(
                "Gemini no devolvió un JSON válido."
            );
        }

        // =========================================
        // RESPUESTA FINAL
        // =========================================

        return {

            statusCode: 200,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                ok: true,

                proveedor: "Google Gemini",

                modelo: model,

                confianza: 95,

                datos: datos

            })

        };

    } catch (error) {

        // =========================================
        // MANEJO DE ERRORES
        // =========================================

        console.error(
            "ERROR EN analizarEtiqueta:",
            error
        );

        return {

            statusCode: 500,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                ok: false,

                mensaje: error.message,

                proveedor: "Google Gemini",

                modelo: "gemini-2.5-flash"

            })

        };
    }
};