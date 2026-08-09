//======================================================
// Firebase Cloud Function
// functions/index.js
//======================================================

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

exports.analizarEtiqueta = onRequest(
    {
        cors: true,
        secrets: ["OPENROUTER_API_KEY"]
    },

    async (req, res) => {

        try {

            const { prompt, image } = req.body;

            const respuesta = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {

                    method: "POST",

                    headers: {

                        Authorization:
                            `Bearer ${process.env.OPENROUTER_API_KEY}`,

                        "Content-Type": "application/json",

                        "HTTP-Referer":
                            "https://TU-PROYECTO.netlify.app",

                        "X-Title":
                            "Bio IA"

                    },

                    body: JSON.stringify({

                        model:
                            "qwen/qwen2.5-vl-72b-instruct:free",

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
                                                `data:image/jpeg;base64,${image}`
                                        }

                                    }

                                ]

                            }

                        ]

                    })

                }

            );

            if (!respuesta.ok) {

                const txt = await respuesta.text();

                throw new Error(txt);

            }

            const json = await respuesta.json();

            const contenido =
                json.choices[0].message.content;

            res.json(

                JSON.parse(contenido)

            );

        }

        catch (e) {

            logger.error(e);

            res.status(500).json({

                ok: false,

                mensaje: e.message

            });

        }

    }

);