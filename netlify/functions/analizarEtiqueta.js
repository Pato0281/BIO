const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {

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

        const body = JSON.parse(event.body);

        const imageBase64 = body.image || body.imageBase64;
        const prompt = body.prompt || "";

        if (!imageBase64) {
            throw new Error("No se recibió ninguna imagen.");
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const result = await model.generateContent([
            {
                text: prompt
            },
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64
                }
            }
        ]);

        const response = await result.response;
        let texto = response.text();

        // Elimina posibles bloques ```json ... ```
        texto = texto
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let datos;

        try {
            datos = JSON.parse(texto);
        } catch (e) {
            throw new Error("Gemini no devolvió un JSON válido.");
        }

        return {

            statusCode: 200,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                proveedor: "Google Gemini",

                modelo: "gemini-2.5-flash",

                confianza: 95,

                datos: datos

            })

        };

    } catch (error) {

        console.error(error);

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