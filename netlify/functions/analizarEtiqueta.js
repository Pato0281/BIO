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

        const model = "gemini-3.6-flash";

        console.log("=================================");
        console.log("ANALIZANDO ETIQUETA");
        console.log("Modelo:", model);
        console.log("Imagen recibida: SI");
        console.log("=================================");

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
            ],

            // =====================================
            // SOLICITAR RESPUESTA JSON
            // =====================================

            config: {
                responseMimeType: "application/json"
            }
        });

        // =========================================
        // OBTENER RESPUESTA DE GEMINI
        // =========================================

        const texto = result.text;

        if (!texto) {
            throw new Error(
                "Gemini no devolvió ninguna respuesta."
            );
        }

        console.log("Respuesta recibida correctamente.");
        console.log("Respuesta Gemini:", texto);

        // =========================================
        // CONVERTIR RESPUESTA A JSON
        // =========================================

        let datos;

        try {

            datos = JSON.parse(texto);

        } catch (errorJSON) {

            console.error(
                "ERROR CONVIRTIENDO RESPUESTA A JSON:",
                texto
            );

            throw new Error(
                "Gemini devolvió una respuesta que no es JSON válido."
            );
        }

        // =========================================
        // VERIFICAR DATOS
        // =========================================

        if (!datos || typeof datos !== "object") {
            throw new Error(
                "Gemini devolvió datos vacíos o inválidos."
            );
        }

        console.log("JSON convertido correctamente.");
        console.log("Datos:", JSON.stringify(datos));

        // =========================================
        // RESPUESTA FINAL PARA IA.JS
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
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            },

            body: JSON.stringify({

                ok: false,

                mensaje: error.message,

                proveedor: "Google Gemini",

                modelo: "gemini-3.6-flash"

            })
        };
    }
};
