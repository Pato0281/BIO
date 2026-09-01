// ======================================================
// BÍO IA V10.2
// analizarEtiqueta.js
// ======================================================
//
// RESPONSABILIDAD:
//
// IDENTIFICAR INFORMACIÓN VISIBLE EN LA FOTO
//
// ✅ Nombre comercial
// ✅ Ingrediente activo
// ✅ Concentración
// ✅ Modo de acción
// ✅ Función
// ✅ Plagas / enfermedades
//
// NO IDENTIFICA:
//
// ❌ Dosis
// ❌ Carencia
// ❌ Reingreso
// ❌ Fabricante
// ❌ Formulación
// ❌ Grupo químico
//
// ======================================================

const API_KEY = process.env.OPENROUTER_API_KEY;

const OPENROUTER_URL =
    "https://openrouter.ai/api/v1/chat/completions";

const MODEL =
    "minimax/minimax-m3:free";

const TIMEOUT_MS =
    20000;


// ======================================================
// HANDLER
// ======================================================

exports.handler = async (event) => {

    console.log("======================================");
    console.log("BÍO IA V10.2");
    console.log("INICIO");
    console.log("======================================");


    if (event.httpMethod !== "POST") {

        return respuesta(
            405,
            {
                ok: false,
                mensaje:
                    "Método no permitido."
            }
        );

    }


    if (!API_KEY) {

        console.error(
            "Falta OPENROUTER_API_KEY."
        );

        return respuesta(
            500,
            {
                ok: false,
                mensaje:
                    "OPENROUTER_API_KEY no está configurada."
            }
        );

    }


    try {

        // ==================================================
        // BODY
        // ==================================================

        let body;

        try {

            body =
                JSON.parse(
                    event.body || "{}"
                );

        } catch {

            return respuesta(
                400,
                {
                    ok: false,
                    mensaje:
                        "El cuerpo recibido no es JSON válido."
                }
            );

        }


        let image =
            body.image ||
            body.imageBase64 ||
            "";


        if (!image) {

            return respuesta(
                400,
                {
                    ok: false,
                    mensaje:
                        "No se recibió ninguna imagen."
                }
            );

        }


        // ==================================================
        // MIME
        // ==================================================

        let mimeType =
            "image/jpeg";


        if (
            image.startsWith("data:")
        ) {

            const match =
                image.match(
                    /^data:([^;]+);base64,/
                );


            if (
                match &&
                match[1]
            ) {

                mimeType =
                    match[1];

            }


            const coma =
                image.indexOf(",");


            if (
                coma !== -1
            ) {

                image =
                    image.substring(
                        coma + 1
                    );

            }

        }


        if (
            !mimeType.startsWith("image/")
        ) {

            return respuesta(
                400,
                {
                    ok: false,
                    mensaje:
                        "El archivo no es una imagen válida."
                }
            );

        }


        console.log(
            "Imagen recibida:",
            mimeType
        );

        console.log(
            "Tamaño:",
            image.length
        );


        // ==================================================
        // PROMPT
        // ==================================================

        const prompt = `
Eres BÍO IA.

Analiza la fotografía de una etiqueta o envase
de un producto fitosanitario agrícola.

Tu trabajo es IDENTIFICAR solamente la información
que pueda verse o leerse razonablemente en la imagen.

NO INVENTES DATOS.

DATOS QUE DEBES IDENTIFICAR:

1. Nombre comercial del producto.
2. Ingrediente activo.
3. Concentración.
4. Modo de acción.
5. Función técnica.
6. Plagas o enfermedades objetivo.

MODO DE ACCIÓN:

Utiliza únicamente cuando exista evidencia visible:

- contacto
- sistémico
- ingestión
- digestivo

FUNCIÓN:

Utiliza cuando exista evidencia:

- insecticida
- fungicida
- herbicida
- estimulante

PLAGAS Y ENFERMEDADES:

Extrae solamente las que sean visibles
o claramente legibles en la imagen.

NO DEBES ENTREGAR:

- dosis
- dosis baja
- dosis alta
- carencia
- reingreso
- fabricante
- formulación
- grupo químico

Esos datos serán manejados directamente
por la aplicación.

Si aparece un registro de SENASA u otro organismo
de otro país, NO lo interpretes como registro SAG.

RESPONDE SOLAMENTE CON UN OBJETO JSON.

Usa exactamente estos campos:

{
  "tipo_registro": "quimico",
  "nombre": "",
  "ingrediente_activo": "",
  "concentracion": "",
  "modo_accion": [],
  "funcion": [],
  "plagas_objetivo": []
}

Cuando un dato no pueda identificarse:

campo de texto:
"No encontrado"

campo de lista:
[]

No agregues explicaciones adicionales.
`;


        // ==================================================
        // OPENROUTER
        // ==================================================

        console.log(
            "Enviando solicitud a OpenRouter..."
        );

        console.log(
            "Modelo:",
            MODEL
        );


        const resultado =
            await llamarOpenRouter(
                prompt,
                image,
                mimeType
            );


        console.log(
            "OpenRouter HTTP:",
            resultado.status
        );

        console.log(
            "Modelo utilizado:",
            resultado.model
        );


        console.log(
            "======================================"
        );

        console.log(
            "RESPUESTA RAW"
        );

        console.log(
            "======================================"
        );

        console.log(
            resultado.text
        );

        console.log(
            "======================================"
        );


        // ==================================================
        // JSON
        // ==================================================

        const datos =
            extraerJSON(
                resultado.text
            );


        console.log(
            "DATOS IDENTIFICADOS:"
        );

        console.log(
            JSON.stringify(
                datos,
                null,
                2
            )
        );


        return respuesta(
            200,
            {

                ok: true,

                proveedor:
                    "OpenRouter",

                modelo:
                    resultado.model,

                datos:
                    normalizarDatos(
                        datos
                    )

            }
        );


    } catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "ERROR BÍO IA V10.2"
        );

        console.error(
            error
        );

        console.error(
            "======================================"
        );


        return respuesta(
            500,
            {

                ok: false,

                mensaje:
                    error?.message ||
                    "Error procesando la imagen."

            }
        );

    }

};


// ======================================================
// OPENROUTER
// ======================================================

async function llamarOpenRouter(
    prompt,
    image,
    mimeType
) {

    const payload = {

        model:
            MODEL,

        temperature:
            0.1,

        response_format:
        {
            type:
                "json_object"
        },

        messages:
        [

            {

                role:
                    "user",

                content:
                [

                    {

                        type:
                            "text",

                        text:
                            prompt

                    },

                    {

                        type:
                            "image_url",

                        image_url:
                        {

                            url:
                                "data:" +
                                mimeType +
                                ";base64," +
                                image

                        }

                    }

                ]

            }

        ]

    };


    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () => {
                controller.abort();
            },
            TIMEOUT_MS
        );


    try {

        const response =
            await fetch(
                OPENROUTER_URL,
                {

                    method:
                        "POST",

                    headers:
                    {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            API_KEY,

                        "HTTP-Referer":
                            "https://bio-ia-2026.netlify.app",

                        "X-Title":
                            "BÍO IA"

                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    signal:
                        controller.signal

                }
            );


        const raw =
            await response.text();


        let data;


        try {

            data =
                JSON.parse(
                    raw
                );

        } catch {

            data =
            {
                raw:
                    raw
            };

        }


        if (
            !response.ok
        ) {

            const mensaje =
                data?.error?.message ||
                `OpenRouter HTTP ${response.status}`;


            throw new Error(
                mensaje
            );

        }


        const text =
            extraerTexto(
                data
            );


        if (!text) {

            throw new Error(
                "OpenRouter no devolvió contenido."
            );

        }


        return {

            text:
                text,

            model:
                data?.model ||
                MODEL,

            status:
                response.status

        };

    } catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                "OpenRouter superó los 20 segundos de espera."
            );

        }

        throw error;

    } finally {

        clearTimeout(
            timeout
        );

    }

}


// ======================================================
// EXTRAER TEXTO
// ======================================================

function extraerTexto(
    data
) {

    const content =
        data
            ?.choices
            ?.[0]
            ?.message
            ?.content;


    if (
        typeof content ===
        "string"
    ) {

        return content.trim();

    }


    if (
        Array.isArray(
            content
        )
    ) {

        return content
            .map(
                item =>
                    item?.text ||
                    ""
            )
            .filter(
                Boolean
            )
            .join(
                "\n"
            )
            .trim();

    }


    return "";

}


// ======================================================
// EXTRAER JSON
// ======================================================

function extraerJSON(
    texto
) {

    if (!texto) {

        throw new Error(
            "La IA no devolvió información."
        );

    }


    const limpio =
        String(
            texto
        ).trim();


    // --------------------------------------------------
    // JSON directo
    // --------------------------------------------------

    try {

        const directo =
            JSON.parse(
                limpio
            );


        if (
            directo &&
            typeof directo ===
                "object"
        ) {

            return directo;

        }

    } catch {

        // continuar

    }


    // --------------------------------------------------
    // Buscar objeto JSON
    // --------------------------------------------------

    const inicio =
        limpio.indexOf(
            "{"
        );


    const fin =
        limpio.lastIndexOf(
            "}"
        );


    if (
        inicio ===
        -1 ||
        fin ===
        -1 ||
        fin <= inicio
    ) {

        throw new Error(
            "No se encontró un objeto JSON en la respuesta de la IA."
        );

    }


    const posible =
        limpio.substring(
            inicio,
            fin + 1
        );


    try {

        return JSON.parse(
            posible
        );

    } catch {

        console.error(
            "JSON recibido:"
        );

        console.error(
            texto
        );


        throw new Error(
            "La respuesta de la IA no tiene un JSON válido."
        );

    }

}


// ======================================================
// NORMALIZAR
// ======================================================

function normalizarDatos(
    datos
) {

    if (
        !datos ||
        typeof datos !==
            "object" ||
        Array.isArray(
            datos
        )
    ) {

        datos =
            {};

    }


    datos.tipo_registro =
        "quimico";


    const camposTexto =
        [

            "nombre",

            "ingrediente_activo",

            "concentracion"

        ];


    camposTexto.forEach(
        campo => {

            if (
                typeof datos[campo] !==
                    "string" ||
                !datos[campo].trim()
            ) {

                datos[campo] =
                    "No encontrado";

            } else {

                datos[campo] =
                    datos[campo].trim();

            }

        }
    );


    const camposLista =
        [

            "modo_accion",

            "funcion",

            "plagas_objetivo"

        ];


    camposLista.forEach(
        campo => {

            if (
                !Array.isArray(
                    datos[campo]
                )
            ) {

                if (
                    datos[campo]
                ) {

                    datos[campo] =
                        [
                            String(
                                datos[campo]
                            ).trim()
                        ];

                } else {

                    datos[campo] =
                        [];

                }

            }


            datos[campo] =
                datos[campo]
                    .map(
                        x =>
                            String(
                                x
                            ).trim()
                    )
                    .filter(
                        Boolean
                    );

        }
    );


    return datos;

}


// ======================================================
// RESPUESTA
// ======================================================

function respuesta(
    statusCode,
    body
) {

    return {

        statusCode:
            statusCode,

        headers:
        {

            "Content-Type":
                "application/json; charset=utf-8",

            "Cache-Control":
                "no-store",

            "Access-Control-Allow-Origin":
                "*"

        },

        body:
            JSON.stringify(
                body
            )

    };

}
