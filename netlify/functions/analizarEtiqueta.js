const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODELO = "openrouter/free";

const SAG_PUBLICACIONES_URL =
    "https://www.sag.gob.cl/ambitos-de-accion/autorizacion-y-evaluacion-de-plaguicidas/publicaciones";


// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

exports.handler = async (event) => {

    if (event.httpMethod !== "POST") {

        return json(405, {
            ok: false,
            mensaje: "Método no permitido."
        });

    }

    try {

        // =================================================
        // API KEY
        // =================================================

        if (!API_KEY) {

            return json(500, {
                ok: false,
                mensaje:
                    "No está configurada OPENROUTER_API_KEY en Netlify.",
                proveedor:
                    "OpenRouter",
                modelo:
                    MODELO
            });

        }


        // =================================================
        // BODY
        // =================================================

        let body;

        try {

            body = JSON.parse(
                event.body || "{}"
            );

        } catch {

            return json(400, {
                ok: false,
                mensaje:
                    "El cuerpo de la solicitud no es JSON válido."
            });

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

            return json(400, {
                ok: false,
                mensaje:
                    "No se recibió ninguna imagen."
            });

        }


        // =================================================
        // MIME TYPE
        // =================================================

        let mimeType =
            "image/jpeg";


        if (
            typeof imageBase64 === "string" &&
            imageBase64.startsWith("data:")
        ) {

            const match =
                imageBase64.match(
                    /^data:([^;]+);base64,/
                );

            if (match?.[1]) {

                mimeType =
                    match[1];

            }

        }


        // =================================================
        // LIMPIAR BASE64
        // =================================================

        if (
            typeof imageBase64 === "string" &&
            imageBase64.includes(",")
        ) {

            imageBase64 =
                imageBase64.split(",")[1];

        }


        // =================================================
        // VALIDAR IMAGEN
        // =================================================

        if (
            !mimeType.startsWith("image/")
        ) {

            return json(400, {
                ok: false,
                mensaje:
                    `Tipo de imagen no soportado: ${mimeType}`
            });

        }


        console.log(
            "======================================"
        );

        console.log(
            "BIO IA V4"
        );

        console.log(
            "======================================"
        );

        console.log(
            "Proveedor:",
            "OpenRouter"
        );

        console.log(
            "Modelo:",
            MODELO
        );

        console.log(
            "Imagen recibida:",
            mimeType
        );

        console.log(
            "Tamaño imagen Base64:",
            imageBase64.length
        );


        // =================================================
        // PROMPT DE IDENTIFICACIÓN
        // =================================================

        const prompt = `

Eres BÍO IA, especialista en productos agrícolas,
fitosanitarios y protección vegetal utilizados en Chile.

Analiza la fotografía de la etiqueta.

Tu prioridad absoluta es identificar correctamente
el producto.

NO INVENTES INFORMACIÓN.

=========================================
IDENTIFICACIÓN
=========================================

Identifica cuando sean visibles:

- nombre comercial
- ingrediente activo
- concentración
- formulación
- fabricante
- distribuidor
- registro SAG
- contenido
- tipo de producto

=========================================
FUNCIÓN
=========================================

Determina la función cuando exista evidencia:

- Insecticida
- Fungicida
- Herbicida
- Acaricida
- Nematicida
- Bactericida
- Fertilizante
- Bioestimulante
- Coadyuvante
- Regulador de crecimiento
- Producto biológico
- Otro

=========================================
MODO DE ACCIÓN
=========================================

Si la etiqueta indica:

- sistémico
- contacto
- ingestión
- translaminar
- fumigante
- preventivo
- curativo
- erradicante
- residual

debes incluirlo.

MUY IMPORTANTE:

Si aparece literalmente una frase como:

"actividad sistémica"

debes devolver:

"Sistémico"

en modo_accion.

=========================================
INFORMACIÓN VISIBLE
=========================================

Extrae cuando sea legible:

- dosis
- unidad de dosis
- mojamiento
- cultivos
- plagas
- enfermedades
- malezas
- carencia
- reentrada
- compatibilidad
- observaciones

=========================================
NO INVENTAR
=========================================

Si algo NO aparece claramente:

texto:
"No encontrado"

arrays:
[]

=========================================
JSON
=========================================

Devuelve exclusivamente JSON válido:

{
  "tipo_registro": "",
  "nombre": "",
  "fabricante": "",
  "registro": "",
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
  "contenido": "",
  "compatibilidad": "",
  "observaciones": ""
}

No agregues Markdown.
No agregues explicaciones.

Información adicional entregada por la aplicación:

${promptOriginal}

`;


        // =================================================
        // LLAMADA OPENROUTER
        // =================================================

        const payload = {

            model:
                MODELO,

            temperature:
                0.1,

            response_format: {
                type:
                    "json_object"
            },

            messages: [

                {
                    role:
                        "user",

                    content: [

                        {
                            type:
                                "text",

                            text:
                                prompt
                        },

                        {
                            type:
                                "image_url",

                            image_url: {

                                url:
                                    `data:${mimeType};base64,${imageBase64}`

                            }

                        }

                    ]

                }

            ]

        };


        console.log(
            "Enviando imagen a OpenRouter..."
        );


        const inicio =
            Date.now();


        const response =
            await fetch(

                API_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${API_KEY}`,

                        "HTTP-Referer":
                            "https://bio-ia-2026.netlify.app",

                        "X-Title":
                            "BIO IA"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }

            );


        const duracion =
            Date.now() -
            inicio;


        const responseText =
            await response.text();


        let data;


        try {

            data =
                JSON.parse(
                    responseText
                );

        } catch {

            data = {
                raw:
                    responseText
            };

        }


        console.log(
            "Respuesta OpenRouter:",
            response.status
        );

        console.log(
            "Modelo utilizado:",
            data?.model ||
                "No informado"
        );

        console.log(
            "Tiempo:",
            `${duracion} ms`
        );


        // =================================================
        // ERROR OPENROUTER
        // =================================================

        if (!response.ok) {

            return json(502, {

                ok:
                    false,

                mensaje:
                    "OpenRouter no pudo procesar la solicitud.",

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO,

                codigo:
                    data?.error?.code ||
                    response.status,

                detalle:
                    data?.error?.message ||
                    "Error desconocido"

            });

        }


        // =================================================
        // TEXTO RESPUESTA
        // =================================================

        const texto =
            extractText(
                data
            );


        if (!texto) {

            throw new Error(
                "OpenRouter no devolvió texto."
            );

        }


        // =================================================
        // JSON
        // =================================================

        let datos;


        try {

            datos =
                JSON.parse(
                    cleanJsonText(
                        texto
                    )
                );

        } catch {

            console.error(
                "JSON inválido recibido:"
            );

            console.error(
                texto
            );

            throw new Error(
                "La respuesta de la IA no es JSON válido."
            );

        }


        // =================================================
        // NORMALIZAR
        // =================================================

        datos =
            normalizarDatos(
                datos
            );


        // =================================================
        // BÚSQUEDA DIRECTA SAG
        // =================================================

        console.log(
            "Iniciando búsqueda directa SAG..."
        );


        const sag =
            await buscarEnSAG(
                datos.nombre
            );


        console.log(
            "Resultado SAG:",
            JSON.stringify(
                sag
            )
        );


        // =================================================
        // COMPLETAR INFORMACIÓN SAG BÁSICA
        // =================================================

        if (
            sag.encontrado
        ) {

            if (
                (!datos.registro ||
                 datos.registro === "No encontrado") &&
                sag.registro
            ) {

                datos.registro =
                    sag.registro;

            }


            if (
                (!datos.fabricante ||
                 datos.fabricante === "No encontrado") &&
                sag.empresa
            ) {

                datos.fabricante =
                    sag.empresa;

            }

        }


        // =================================================
        // RESPUESTA FINAL
        // =================================================

        return json(
            200,
            {

                ok:
                    true,

                proveedor:
                    "OpenRouter",

                modelo:
                    data?.model ||
                    MODELO,

                modo:
                    "identificacion + consulta SAG",

                sag:
                    sag,

                datos:
                    datos

            }
        );


    } catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "ERROR GENERAL BIO IA V4"
        );

        console.error(
            error
        );

        console.error(
            "======================================"
        );


        return json(
            500,
            {

                ok:
                    false,

                mensaje:
                    error?.message ||
                    String(error),

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO

            }
        );

    }

};


// =====================================================
// NORMALIZAR DATOS
// =====================================================

function normalizarDatos(
    datos
) {

    if (
        !datos ||
        typeof datos !== "object" ||
        Array.isArray(datos)
    ) {

        datos = {};

    }


    const strings = [

        "tipo_registro",
        "nombre",
        "fabricante",
        "registro",
        "ingrediente_activo",
        "concentracion",
        "formulacion",
        "dosis",
        "unidad_dosis",
        "mojamiento",
        "carencia",
        "reentrada",
        "contenido",
        "compatibilidad",
        "observaciones"

    ];


    const arrays = [

        "funcion",
        "cultivos",
        "plagas_objetivo",
        "enfermedades",
        "malezas",
        "modo_accion"

    ];


    for (
        const campo
        of strings
    ) {

        if (
            typeof datos[campo] !== "string" ||
            datos[campo].trim() === ""
        ) {

            datos[campo] =
                "No encontrado";

        }

    }


    for (
        const campo
        of arrays
    ) {

        if (
            !Array.isArray(
                datos[campo]
            )
        ) {

            if (
                datos[campo] &&
                String(
                    datos[campo]
                ).trim()
            ) {

                datos[campo] = [

                    String(
                        datos[campo]
                    ).trim()

                ];

            } else {

                datos[campo] = [];

            }

        }

    }


    // =================================================
    // CORREGIR MODO DE ACCIÓN
    // =================================================

    const textoAccion =

        (

            String(
                datos.modo_accion || ""
            ) +

            " " +

            String(
                datos.observaciones || ""
            )

        ).toLowerCase();


    const acciones =
        datos.modo_accion.map(
            x =>
                String(x)
                    .trim()
        );


    if (
        textoAccion.includes(
            "actividad sistémica"
        ) ||
        textoAccion.includes(
            "actividad sistemica"
        ) ||
        textoAccion.includes(
            "sistémica"
        ) ||
        textoAccion.includes(
            "sistemica"
        )
    ) {

        if (
            !acciones.some(
                x =>
                    x.toLowerCase()
                        .includes(
                            "sistém"
                        )
            )
        ) {

            acciones.push(
                "Sistémico"
            );

        }

    }


    datos.modo_accion =
        acciones;


    // =================================================
    // CORREGIR FUNCIÓN
    // =================================================

    if (
        datos.nombre &&
        datos.funcion.length === 0
    ) {

        const texto =
            (
                datos.observaciones || ""
            ).toLowerCase();


        if (
            texto.includes(
                "insecticida"
            )
        ) {

            datos.funcion.push(
                "Insecticida"
            );

        }

    }


    return datos;

}


// =====================================================
// BUSCAR DIRECTAMENTE EN SAG
// =====================================================

async function buscarEnSAG(
    nombre
) {

    if (
        !nombre ||
        nombre === "No encontrado"
    ) {

        return {

            encontrado:
                false,

            fuente:
                "SAG",

            mensaje:
                "No se pudo realizar la búsqueda porque no se identificó el producto."

        };

    }


    try {

        // -------------------------------------------------
        // El portal SAG permite filtrar publicaciones
        // por título.
        // -------------------------------------------------

        const url =
            SAG_PUBLICACIONES_URL +
            "?field_fecha_otros_value=" +
            "&field_tema_otros_documentos_target_id=All" +
            "&field_tipo_de_publicacion_target_id=All" +
            "&title=" +
            encodeURIComponent(
                nombre
            );


        console.log(
            "URL SAG:",
            url
        );


        const response =
            await fetch(
                url,
                {
                    method:
                        "GET",

                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 BIO-IA",

                        "Accept":
                            "text/html,application/xhtml+xml"

                    }

                }
            );


        if (!response.ok) {

            return {

                encontrado:
                    false,

                fuente:
                    "SAG",

                httpStatus:
                    response.status,

                mensaje:
                    "El sitio SAG no respondió correctamente."

            };

        }


        const html =
            await response.text();


        const htmlNormalizado =
            normalizarHTML(
                html
            );


        const nombreBuscado =
            normalizarTexto(
                nombre
            );


        // -------------------------------------------------
        // Buscar el producto en la página
        // -------------------------------------------------

        const encontrado =
            htmlNormalizado.includes(
                nombreBuscado
            );


        if (!encontrado) {

            return {

                encontrado:
                    false,

                fuente:
                    "SAG",

                productoBuscado:
                    nombre,

                mensaje:
                    "Producto no encontrado en el resultado directo del SAG."

            };

        }


        // -------------------------------------------------
        // Buscar empresa en las filas cercanas
        // -------------------------------------------------

        const empresa =
            extraerEmpresaSAG(
                html,
                nombre
            );


        // -------------------------------------------------
        // Buscar enlace de publicación
        // -------------------------------------------------

        const enlace =
            extraerEnlaceProducto(
                html,
                nombre
            );


        return {

            encontrado:
                true,

            fuente:
                "SAG Chile",

            productoBuscado:
                nombre,

            empresa:
                empresa ||
                "",

            registro:
                "",

            enlace:
                enlace ||
                "",

            mensaje:
                "Producto encontrado en el portal oficial del SAG."

        };

    } catch (error) {

        console.error(
            "Error consultando SAG:",
            error
        );


        return {

            encontrado:
                false,

            fuente:
                "SAG",

            mensaje:
                "No fue posible consultar el portal SAG.",

            error:
                error?.message ||
                String(error)

        };

    }

}


// =====================================================
// EXTRAER EMPRESA SAG
// =====================================================

function extraerEmpresaSAG(
    html,
    nombre
) {

    const posicion =
        html.toLowerCase()
            .indexOf(
                String(
                    nombre
                ).toLowerCase()
            );


    if (
        posicion === -1
    ) {

        return "";

    }


    const fragmento =
        html.slice(
            posicion,
            posicion + 1800
        );


    const match =
        fragmento.match(
            /Empresa\s*:\s*([^<\n]+)/i
        );


    if (
        match?.[1]
    ) {

        return
            decodeEntities(
                match[1]
                    .trim()
            );

    }


    return "";

}


// =====================================================
// EXTRAER ENLACE DEL PRODUCTO
// =====================================================

function extraerEnlaceProducto(
    html,
    nombre
) {

    const regex =
        /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


    let match;


    while (
        (match =
            regex.exec(
                html
            )) !== null
    ) {

        const texto =
            normalizarTexto(
                stripHTML(
                    match[2]
                )
            );


        if (
            texto ===
            normalizarTexto(
                nombre
            )
        ) {

            let href =
                decodeEntities(
                    match[1]
                );


            if (
                href.startsWith("/")
            ) {

                href =
                    "https://www.sag.gob.cl" +
                    href;

            }


            return href;

        }

    }


    return "";

}


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function normalizarTexto(
    texto
) {

    return String(
        texto || ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            " "
        )
        .trim();

}


// =====================================================
// NORMALIZAR HTML
// =====================================================

function normalizarHTML(
    html
) {

    return normalizarTexto(
        stripHTML(
            html
        )
    );

}


// =====================================================
// STRIP HTML
// =====================================================

function stripHTML(
    html
) {

    return String(
        html || ""
    )
        .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        )
        .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        )
        .replace(
            /<[^>]+>/g,
            " "
        );

}


// =====================================================
// DECODE HTML
// =====================================================

function decodeEntities(
    text
) {

    return String(
        text || ""
    )
        .replace(
            /&amp;/g,
            "&"
        )
        .replace(
            /&quot;/g,
            '"'
        )
        .replace(
            /&#39;/g,
            "'"
        )
        .replace(
            /&nbsp;/g,
            " "
        );

}


// =====================================================
// EXTRAER TEXTO DE OPENROUTER
// =====================================================

function extractText(
    data
) {

    const content =
        data?.choices?.[0]
            ?.message
            ?.content;


    if (
        typeof content === "string"
    ) {

        return content;

    }


    if (
        Array.isArray(
            content
        )
    ) {

        return content

            .map(
                part =>
                    part?.text ||
                    ""
            )

            .filter(
                Boolean
            )

            .join("\n");

    }


    return "";

}


// =====================================================
// LIMPIAR JSON
// =====================================================

function cleanJsonText(
    text
) {

    if (
        typeof text !== "string"
    ) {

        return "";

    }


    let limpio =
        text.trim();


    if (
        limpio.startsWith(
            "```json"
        )
    ) {

        limpio =
            limpio.slice(
                7
            );

    }


    if (
        limpio.startsWith(
            "```"
        )
    ) {

        limpio =
            limpio.slice(
                3
            );

    }


    if (
        limpio.endsWith(
            "```"
        )
    ) {

        limpio =
            limpio.slice(
                0,
                -3
            );

    }


    return limpio.trim();

}


// =====================================================
// RESPUESTA JSON NETLIFY
// =====================================================

function json(
    statusCode,
    body
) {

    return {

        statusCode:
            statusCode,

        headers: {

            "Content-Type":
                "application/json; charset=utf-8",

            "Cache-Control":
                "no-store"

        },

        body:
            JSON.stringify(
                body
            )

    };

}
