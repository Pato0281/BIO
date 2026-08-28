// =====================================================
// BÍO IA V9
// analizarEtiqueta.js
// =====================================================
//
// OBJETIVO
//
// FOTO
//  ↓
// MiniMax M3 Free
//  ↓
// Identificación
//  ↓
// SAG Chile
//  ↓
// Etiqueta / HDS
//  ↓
// Interpretación técnica
//  ↓
// Reglas BIO
//  ↓
// Dosis 1 / 15 / 100 / 160 L
//  ↓
// JSON
//
// =====================================================

const API_KEY =
    process.env.OPENROUTER_API_KEY;

const OPENROUTER_URL =
    "https://openrouter.ai/api/v1/chat/completions";

const MODELO =
    "minimax/minimax-m3:free";

const SAG_SEARCH =
    "https://www.sag.gob.cl/buscador-general";

const SAG_DOMAIN =
    "https://www.sag.gob.cl";

const REQUEST_TIMEOUT_AI =
    20000;

const REQUEST_TIMEOUT_WEB =
    8000;


// =====================================================
// HANDLER
// =====================================================

exports.handler = async (event) => {

    const inicioTotal =
        Date.now();

    console.log("======================================");
    console.log("BÍO IA V9 - INICIO");
    console.log("======================================");


    if (
        event.httpMethod !== "POST"
    ) {

        return json(
            405,
            {
                ok: false,
                mensaje:
                    "Método no permitido."
            }
        );

    }


    try {

        // =================================================
        // API KEY
        // =================================================

        if (!API_KEY) {

            console.error(
                "OPENROUTER_API_KEY no configurada."
            );

            return json(
                500,
                {
                    ok: false,
                    mensaje:
                        "No está configurada OPENROUTER_API_KEY en Netlify.",
                    proveedor:
                        "OpenRouter",
                    modelo:
                        MODELO
                }
            );

        }


        // =================================================
        // BODY
        // =================================================

        const body =
            JSON.parse(
                event.body ||
                "{}"
            );


        let imageBase64 =
            body.image ||
            body.imageBase64 ||
            "";


        const promptOriginal =
            body.prompt ||
            "";


        if (
            !imageBase64
        ) {

            return json(
                400,
                {
                    ok: false,
                    mensaje:
                        "No se recibió ninguna imagen."
                }
            );

        }


        // =================================================
        // MIME
        // =================================================

        let mimeType =
            "image/jpeg";


        if (
            imageBase64.startsWith(
                "data:"
            )
        ) {

            const m =
                imageBase64.match(
                    /^data:([^;]+);base64,/
                );


            if (
                m &&
                m[1]
            ) {

                mimeType =
                    m[1];

            }

        }


        if (
            imageBase64.includes(",")
        ) {

            imageBase64 =
                imageBase64.split(
                    ","
                )[1];

        }


        console.log(
            "Imagen:",
            mimeType
        );

        console.log(
            "Base64:",
            imageBase64.length
        );


        // =================================================
        // ETAPA 1
        // IDENTIFICACIÓN
        // =================================================

        console.log(
            "ETAPA 1: IDENTIFICACIÓN VISUAL"
        );


        const identificacion =
            await identificarProducto(
                imageBase64,
                mimeType,
                promptOriginal
            );


        console.log(
            "Producto:",
            identificacion.nombre
        );

        console.log(
            "Ingrediente:",
            identificacion.ingrediente_activo
        );

        console.log(
            "Registro:",
            identificacion.registro
        );

        console.log(
            "Modo:",
            JSON.stringify(
                identificacion.modo_accion
            )
        );


        // =================================================
        // ETAPA 2
        // SAG
        // =================================================

        console.log(
            "ETAPA 2: BÚSQUEDA SAG"
        );


        let sag = {

            encontrado:
                false

        };


        try {

            sag =
                await buscarSAG(
                    identificacion
                );

        } catch (
            error
        ) {

            console.error(
                "Error SAG:",
                error
            );

            sag =
            {
                encontrado:
                    false,

                mensaje:
                    "Error consultando SAG."

            };

        }


        console.log(
            "RESULTADO SAG:",
            JSON.stringify(
                sag
            )
        );


        // =================================================
        // ETAPA 3
        // DOCUMENTO
        // =================================================

        let documento =
            "";

        let documentoURL =
            "";


        if (
            sag.pdfUrl
        ) {

            console.log(
                "ETAPA 3: LEYENDO PDF SAG"
            );


            documentoURL =
                sag.pdfUrl;


            try {

                documento =
                    await leerDocumento(
                        sag.pdfUrl
                    );

            } catch (
                error
            ) {

                console.error(
                    "Error PDF:",
                    error
                );

            }

        }


        // Si no hubo PDF, intentamos leer
        // la página individual del SAG.

        if (
            !documento &&
            sag.productUrl
        ) {

            console.log(
                "Intentando página SAG..."
            );


            documentoURL =
                sag.productUrl;


            try {

                documento =
                    await leerDocumento(
                        sag.productUrl
                    );

            } catch (
                error
            ) {

                console.error(
                    "Error página SAG:",
                    error
                );

            }

        }


        console.log(
            "Tamaño documento:",
            documento.length
        );


        // =================================================
        // ETAPA 4
        // INTERPRETACIÓN DOCUMENTACIÓN
        // =================================================

        let datos =
            identificacion;


        if (
            documento &&
            documento.length >
                100
        ) {

            console.log(
                "ETAPA 4: INTERPRETANDO DOCUMENTACIÓN"
            );


            try {

                datos =
                    await interpretarDocumento(
                        identificacion,
                        documento,
                        promptOriginal
                    );

            } catch (
                error
            ) {

                console.error(
                    "Error interpretando documento:",
                    error
                );

                // Conservamos identificación.
                datos =
                    identificacion;

            }

        } else {

            console.log(
                "No hay documentación suficiente."
            );

        }


        // =================================================
        // ETAPA 5
        // REGLAS BIO
        // =================================================

        console.log(
            "ETAPA 5: REGLAS BIO"
        );


        datos =
            normalizarDatos(
                datos
            );


        datos =
            aplicarReglasBIO(
                datos,
                documento
            );


        // =================================================
        // ETAPA 6
        // DOSIS
        // =================================================

        console.log(
            "ETAPA 6: DOSIS BIO"
        );


        datos.dosis =
            construirDosisBIO(
                datos.dosis
            );


        // =================================================
        // FUENTE
        // =================================================

        datos.observaciones =
            agregarFuentes(
                datos.observaciones,
                sag,
                documentoURL
            );


        const duracion =
            Date.now() -
            inicioTotal;


        console.log(
            "======================================"
        );

        console.log(
            "BÍO IA V9 - RESULTADO"
        );

        console.log(
            "Duración:",
            duracion,
            "ms"
        );

        console.log(
            JSON.stringify(
                datos,
                null,
                2
            )
        );

        console.log(
            "======================================"
        );


        return json(
            200,
            {

                ok:
                    true,

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO,

                fuente:
                    sag.encontrado
                        ? "SAG Chile"
                        : "Imagen",

                fuente_url:
                    documentoURL ||
                    sag.productUrl ||
                    null,

                sag:
                    sag,

                datos:
                    datos

            }
        );


    } catch (
        error
    ) {

        console.error(
            "======================================"
        );

        console.error(
            "ERROR GENERAL BÍO IA V9"
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
// IDENTIFICACIÓN
// =====================================================

async function identificarProducto(
    imageBase64,
    mimeType,
    promptOriginal
) {

    const prompt = `

Eres BÍO IA.

Eres especialista en productos
fitosanitarios agrícolas utilizados en Chile.

Analiza cuidadosamente la fotografía.

TU PRINCIPAL OBJETIVO ES IDENTIFICAR EL PRODUCTO.

NO INVENTES INFORMACIÓN.

Busca:

- nombre comercial
- fabricante
- ingrediente activo
- concentración
- formulación
- registro SAG
- contenido
- función
- plagas
- cultivos
- modo de acción

MODO DE ACCIÓN:

Si aparece:

actividad sistémica
→ Sistémico

acción de contacto
→ Contacto

acción de ingestión
→ Ingestión

Si aparecen varias:
devuélvelas todas.

NO INVENTES:

- dosis
- carencia
- reingreso

si no están visibles.

Devuelve SOLO JSON.

Estructura:

{
  "tipo_registro": "",
  "nombre": "",
  "fabricante": "",
  "registro": "",
  "funcion": [],
  "ingrediente_activo": "",
  "grupo_quimico": "",
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

Cuando no exista evidencia:

texto = "No encontrado"

array = []

${promptOriginal}

`;


    const resultado =
        await llamarOpenRouter(
            prompt,
            [
                {

                    type:
                        "image_url",

                    image_url:
                    {
                        url:
                            `data:${mimeType};base64,${imageBase64}`
                    }

                }
            ]
        );


    console.log(
        "======================================"
    );

    console.log(
        "RESPUESTA RAW IDENTIFICACIÓN"
    );

    console.log(
        "======================================"
    );

    console.log(
        resultado.texto
    );

    console.log(
        "======================================"
    );


    const datos =
        parseJSON(
            resultado.texto
        );


    const normalizados =
        normalizarDatos(
            datos
        );


    normalizados.modelo_utilizado =
        resultado.modelo;


    return normalizados;

}


// =====================================================
// BÚSQUEDA SAG
// =====================================================

async function buscarSAG(
    identificacion
) {

    const nombre =
        String(
            identificacion.nombre ||
            ""
        ).trim();


    const registro =
        String(
            identificacion.registro ||
            ""
        ).trim();


    if (
        !nombre ||
        nombre ===
            "No encontrado"
    ) {

        return {

            encontrado:
                false,

            mensaje:
                "No existe nombre comercial para buscar."

        };

    }


    const consultas =
        [];


    consultas.push(
        nombre
    );


    // Nombre sin formulación
    const nombreBase =
        nombre
            .replace(
                /\b\d+(?:[.,]\d+)?\s*(?:%|WP|WG|SP|SC|SL|EC|SG|SE|EW|OD|CS|GR|FS)\b/gi,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    if (
        nombreBase &&
        nombreBase.toLowerCase() !==
            nombre.toLowerCase()
    ) {

        consultas.push(
            nombreBase
        );

    }


    if (
        registro &&
        registro !==
            "No encontrado"
    ) {

        consultas.push(
            registro
        );

    }


    for (
        const termino
        of consultas
    ) {

        console.log(
            "Consultando SAG:",
            termino
        );


        const resultados =
            await consultarSAG(
                termino
            );


        console.log(
            "Cantidad resultados:",
            resultados.length
        );


        const mejor =
            elegirResultadoSAG(
                resultados,
                nombre,
                registro
            );


        if (
            !mejor
        ) {

            continue;

        }


        console.log(
            "Resultado SAG elegido:",
            mejor.titulo
        );


        let pagina =
            "";


        try {

            pagina =
                await fetchText(
                    mejor.url,
                    REQUEST_TIMEOUT_WEB
                );

        } catch (
            error
        ) {

            console.error(
                "No se pudo abrir página SAG:",
                error
            );

        }


        let pdfUrl =
            encontrarPDF(
                pagina
            );


        if (
            !pdfUrl
        ) {

            console.log(
                "PDF no encontrado directamente."
            );


            try {

                const paginaJina =
                    await fetchText(
                        "https://r.jina.ai/" +
                        mejor.url,
                        REQUEST_TIMEOUT_WEB
                    );


                pdfUrl =
                    encontrarPDF(
                        paginaJina
                    );

            } catch (
                error
            ) {

                console.error(
                    "Jina página SAG:",
                    error
                );

            }

        }


        return {

            encontrado:
                true,

            titulo:
                mejor.titulo,

            productUrl:
                mejor.url,

            pdfUrl:
                pdfUrl ||
                "",

            fuente:
                "SAG Chile"

        };

    }


    return {

        encontrado:
            false,

        productoBuscado:
            nombre,

        mensaje:
            "No se encontró una publicación coincidente en SAG."

    };

}


// =====================================================
// CONSULTAR SAG
// =====================================================

async function consultarSAG(
    termino
) {

    const url =
        SAG_SEARCH +
        "?search_api_fulltext=" +
        encodeURIComponent(
            termino
        );


    console.log(
        "URL buscador SAG:",
        url
    );


    const html =
        await fetchText(
            url,
            REQUEST_TIMEOUT_WEB
        );


    return extraerResultadosSAG(
        html
    );

}


// =====================================================
// EXTRAER RESULTADOS SAG
// =====================================================

function extraerResultadosSAG(
    html
) {

    const resultados =
        [];


    if (
        !html
    ) {

        return resultados;

    }


    const regex =
        /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


    let match;


    while (
        (match =
            regex.exec(
                html
            )) !== null
    ) {

        const href =
            convertirURLSAG(
                decodeHTML(
                    match[1]
                )
            );


        const titulo =
            limpiarEspacios(
                stripHTML(
                    match[2]
                )
            );


        if (
            !titulo
        ) {

            continue;

        }


        if (
            href.includes(
                "/content/"
            )
        ) {

            resultados.push(
                {

                    titulo:
                        titulo,

                    url:
                        href

                }
            );

        }

    }


    return resultados;

}


// =====================================================
// ELEGIR RESULTADO SAG
// =====================================================

function elegirResultadoSAG(
    resultados,
    nombre,
    registro
) {

    if (
        !resultados.length
    ) {

        return null;

    }


    const nombreN =
        normalizarTexto(
            nombre
        );


    const registroN =
        normalizarTexto(
            registro
        );


    let mejor =
        null;


    let mayor =
        0;


    for (
        const item
        of resultados
    ) {

        const tituloN =
            normalizarTexto(
                item.titulo
            );


        let puntos =
            0;


        if (
            tituloN ===
            nombreN
        ) {

            puntos +=
                100;

        }


        if (
            tituloN.includes(
                nombreN
            )
        ) {

            puntos +=
                70;

        }


        if (
            nombreN.includes(
                tituloN
            )
        ) {

            puntos +=
                40;

        }


        if (
            registroN &&
            registroN !==
                "no encontrado" &&
            tituloN.includes(
                registroN
            )
        ) {

            puntos +=
                50;

        }


        if (
            puntos >
            mayor
        ) {

            mayor =
                puntos;

            mejor =
                item;

        }

    }


    return mejor;

}


// =====================================================
// PDF
// =====================================================

function encontrarPDF(
    html
) {

    if (
        !html
    ) {

        return "";

    }


    const regex =
        /href\s*=\s*["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi;


    let match;


    while (
        (match =
            regex.exec(
                html
            )) !== null
    ) {

        return convertirURLSAG(
            decodeHTML(
                match[1]
            )
        );

    }


    const regexURL =
        /https?:\/\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?/gi;


    const urls =
        html.match(
            regexURL
        );


    if (
        urls &&
        urls[0]
    ) {

        return decodeHTML(
            urls[0]
        );

    }


    return "";

}


// =====================================================
// LEER DOCUMENTO
// =====================================================

async function leerDocumento(
    url
) {

    if (
        !url
    ) {

        return "";

    }


    console.log(
        "Leyendo documento:",
        url
    );


    // PDF → Jina
    if (
        /\.pdf(?:$|\?)/i.test(
            url
        )
    ) {

        const jinaURL =
            "https://r.jina.ai/" +
            url;


        console.log(
            "PDF mediante Jina:",
            jinaURL
        );


        const texto =
            await fetchText(
                jinaURL,
                REQUEST_TIMEOUT_WEB
            );


        return String(
            texto || ""
        )
            .slice(
                0,
                80000
            );

    }


    // HTML
    const html =
        await fetchText(
            url,
            REQUEST_TIMEOUT_WEB
        );


    return stripHTML(
        html
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim()
        .slice(
            0,
            80000
        );

}


// =====================================================
// INTERPRETAR DOCUMENTO
// =====================================================

async function interpretarDocumento(
    identificacion,
    documento,
    promptOriginal
) {

    const prompt = `

Eres BÍO IA.

Analiza la documentación oficial siguiente.

Tu fuente principal es la documentación
obtenida desde SAG Chile.

NO INVENTES.

========================================
PRIORIDAD
========================================

1. Etiqueta oficial SAG
2. Ficha/HDS oficial
3. Imagen original

========================================
PRODUCTO
========================================

${JSON.stringify(
    identificacion
)}

========================================
REGLA CRISANTEMO
========================================

Si no existe información específica
para crisantemo o flores:

usar HORTALIZAS / VERDURAS
como referencia agronómica BIO.

NUNCA usar:

- árboles
- vides

No presentar la referencia de hortalizas
como autorización SAG específica
para crisantemo.

========================================
MODO DE ACCIÓN
========================================

Buscar:

- sistémico
- contacto
- ingestión
- translaminar
- preventivo
- curativo
- erradicante
- residual
- IRAC
- FRAC
- HRAC

========================================
CARANCIA
========================================

Buscar carencia específica del cultivo.

Prioridad:

1. cultivo
2. flores/ornamentales
3. invernadero
4. general

========================================
REINGRESO
========================================

Buscar:

- reingreso
- reentrada
- ingreso al área tratada

Prioridad:

1. invernadero
2. cultivo
3. general

========================================
DOSIS
========================================

Extraer exactamente:

- cantidad
- unidad
- cultivo
- plaga
- volumen de agua
- frecuencia
- intervalo

No inventar.

========================================
1X / 2X — REGLA BIO
========================================

1X = Preventivo = presión baja

2X = Curativo = presión alta

Cuando exista explícitamente
1X–2X:

1X → preventivo
2X → curativo

========================================
DOSIS PARA BIO
========================================

Si la dosis es por 100 litros:

calcular:

1 L
15 L
100 L
160 L

Si la dosis es por hectárea:

usar el mojamiento oficial para
hacer la conversión.

Si no existe mojamiento suficiente:

NO inventar la conversión.

========================================
DOCUMENTACIÓN
========================================

${documento}

========================================
INSTRUCCIONES ADICIONALES
========================================

${promptOriginal}

========================================
RESPUESTA
========================================

Devuelve solamente JSON válido.

{
  "tipo_registro": "",
  "nombre": "",
  "fabricante": "",
  "registro": "",
  "funcion": [],
  "ingrediente_activo": "",
  "grupo_quimico": "",
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

`;


    const resultado =
        await llamarOpenRouter(
            prompt,
            []
        );


    console.log(
        "======================================"
    );

    console.log(
        "RESPUESTA RAW DOCUMENTACIÓN"
    );

    console.log(
        "======================================"
    );

    console.log(
        resultado.texto
    );

    console.log(
        "======================================"
    );


    const datos =
        parseJSON(
            resultado.texto
        );


    const normalizados =
        normalizarDatos(
            datos
        );


    normalizados.modelo_utilizado =
        resultado.modelo;


    return normalizados;

}


// =====================================================
// REGLAS BIO
// =====================================================

function aplicarReglasBIO(
    datos,
    documento
) {

    datos =
        normalizarDatos(
            datos
        );


    const doc =
        normalizarTexto(
            documento
        );


    // -------------------------------------------------
    // MODO DE ACCIÓN
    // -------------------------------------------------

    const acciones =
        datos.modo_accion;


    function agregar(
        valor
    ) {

        const existe =
            acciones.some(
                x =>
                    normalizarTexto(
                        x
                    ) ===
                    normalizarTexto(
                        valor
                    )
            );


        if (
            !existe
        ) {

            acciones.push(
                valor
            );

        }

    }


    if (
        doc.includes(
            "sistemico"
        ) ||
        doc.includes(
            "actividad sistemica"
        )
    ) {

        agregar(
            "Sistémico"
        );

    }


    if (
        doc.includes(
            "contacto"
        )
    ) {

        agregar(
            "Contacto"
        );

    }


    if (
        doc.includes(
            "ingestion"
        )
    ) {

        agregar(
            "Ingestión"
        );

    }


    if (
        doc.includes(
            "translaminar"
        )
    ) {

        agregar(
            "Translaminar"
        );

    }


    datos.modo_accion =
        acciones;


    // -------------------------------------------------
    // 1X / 2X
    // -------------------------------------------------

    if (
        /1\s*x/i.test(
            datos.dosis
        )
    ) {

        datos.dosis +=
            " | 1X = Preventivo (presión baja)";

    }


    if (
        /2\s*x/i.test(
            datos.dosis
        )
    ) {

        datos.dosis +=
            " | 2X = Curativo (presión alta)";

    }


    // -------------------------------------------------
    // REGLA CRISANTEMO
    // -------------------------------------------------

    const cultivos =
        normalizarTexto(
            datos.cultivos.join(
                " "
            )
        );


    if (
        !cultivos.includes(
            "crisantemo"
        ) &&
        !cultivos.includes(
            "flor"
        ) &&
        !cultivos.includes(
            "ornamental"
        ) &&
        (
            cultivos.includes(
                "hortal"
            ) ||
            cultivos.includes(
                "verdura"
            )
        )
    ) {

        datos.observaciones +=
            " Referencia agronómica BIO tomada de hortalizas por ausencia de recomendación específica para crisantemo/flores. No se utilizan árboles ni vides como referencia.";

    }


    return datos;

}


// =====================================================
// DOSIS BIO
// =====================================================

function construirDosisBIO(
    dosis
) {

    if (
        !dosis
    ) {

        return "No encontrado";

    }


    const original =
        String(
            dosis
        ).trim();


    if (
        normalizarTexto(
            original
        ) ===
        "no encontrado"
    ) {

        return original;

    }


    // -------------------------------------------------
    // RANGO / 100 L
    // -------------------------------------------------

    const rango =
        original.match(
            /(\d+(?:[.,]\d+)?)\s*(?:-|a)\s*(\d+(?:[.,]\d+)?)\s*(mg|g|kg|ml|mL|cc|l|L)\s*\/\s*100\s*(?:l|L)/i
        );


    if (
        rango
    ) {

        const a =
            parseFloat(
                rango[1].replace(
                    ",",
                    "."
                )
            );


        const b =
            parseFloat(
                rango[2].replace(
                    ",",
                    "."
                )
            );


        const unidad =
            normalizarUnidad(
                rango[3]
            );


        return (
            original +
            "\n\nCálculo BIO por volumen de agua:" +
            calcularVolumenes(
                a,
                b,
                unidad
            )
        );

    }


    // -------------------------------------------------
    // DOSIS ÚNICA / 100 L
    // -------------------------------------------------

    const unica =
        original.match(
            /(\d+(?:[.,]\d+)?)\s*(mg|g|kg|ml|mL|cc|l|L)\s*\/\s*100\s*(?:l|L)/i
        );


    if (
        unica
    ) {

        const valor =
            parseFloat(
                unica[1].replace(
                    ",",
                    "."
                )
            );


        const unidad =
            normalizarUnidad(
                unica[2]
            );


        return (
            original +
            "\n\nCálculo BIO por volumen de agua:" +
            calcularVolumenes(
                valor,
                null,
                unidad
            )
        );

    }


    return original;

}


// =====================================================
// CÁLCULO
// =====================================================

function calcularVolumenes(
    a,
    b,
    unidad
) {

    const litros =
        [
            1,
            15,
            100,
            160
        ];


    let texto =
        "";


    for (
        const L
        of litros
    ) {

        const x =
            a *
            L /
            100;


        if (
            b != null
        ) {

            const y =
                b *
                L /
                100;


            texto +=
                `\n${L} L = ${formatear(x)}-${formatear(y)} ${unidad}`;

        } else {

            texto +=
                `\n${L} L = ${formatear(x)} ${unidad}`;

        }

    }


    return texto;

}


// =====================================================
// UNIDAD
// =====================================================

function normalizarUnidad(
    unidad
) {

    const u =
        String(
            unidad
        ).toLowerCase();


    if (
        u === "ml" ||
        u === "cc"
    ) {

        return "mL";

    }


    if (
        u === "l"
    ) {

        return "L";

    }


    if (
        u === "kg"
    ) {

        return "kg";

    }


    if (
        u === "mg"
    ) {

        return "mg";

    }


    return "g";

}


// =====================================================
// FORMATEAR
// =====================================================

function formatear(
    valor
) {

    if (
        Number.isInteger(
            valor
        )
    ) {

        return String(
            valor
        );

    }


    return Number(
        valor.toFixed(
            4
        )
    )
        .toString()
        .replace(
            ".",
            ","
        );

}


// =====================================================
// NORMALIZAR DATOS
// =====================================================

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


    const strings =
        [

            "tipo_registro",
            "nombre",
            "fabricante",
            "registro",
            "ingrediente_activo",
            "grupo_quimico",
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


    const arrays =
        [

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
            typeof datos[campo] !==
                "string" ||
            !datos[campo].trim()
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
                datos[campo]
            ) {

                datos[campo] =
                    [
                        String(
                            datos[campo]
                        )
                    ];

            } else {

                datos[campo] =
                    [];

            }

        }

    }


    return datos;

}


// =====================================================
// OPENROUTER
// =====================================================

async function llamarOpenRouter(
    prompt,
    elementos
) {

    const content =
        [
            {

                type:
                    "text",

                text:
                    prompt

            }

        ];


    if (
        Array.isArray(
            elementos
        )
    ) {

        content.push(
            ...elementos
        );

    }


    const payload =
        {

            model:
                MODELO,

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
                            content

                    }

                ]

        };


    const controller =
        new AbortController();


    const timer =
        setTimeout(
            () =>
                controller.abort(),
            REQUEST_TIMEOUT_AI
        );


    try {

        console.log(
            "OpenRouter →",
            MODELO
        );


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
                            `Bearer ${API_KEY}`,

                        "HTTP-Referer":
                            "https://bio-ia-2026.netlify.app",

                        "X-Title":
                            "BÍO IA V9"

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


        console.log(
            "OpenRouter HTTP:",
            response.status
        );


        console.log(
            "Modelo utilizado:",
            data?.model ||
                "No informado"
        );


        if (
            !response.ok
        ) {

            throw new Error(
                data?.error?.message ||
                `OpenRouter HTTP ${response.status}`
            );

        }


        const texto =
            extraerTexto(
                data
            );


        if (
            !texto
        ) {

            throw new Error(
                "OpenRouter no devolvió contenido."
            );

        }


        return {

            data:
                data,

            texto:
                texto,

            modelo:
                data?.model ||
                null

        };

    } finally {

        clearTimeout(
            timer
        );

    }

}


// =====================================================
// EXTRAER TEXTO
// =====================================================

function extraerTexto(
    data
) {

    const content =
        data?.choices?.[0]
            ?.message
            ?.content;


    if (
        typeof content ===
        "string"
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
                x =>
                    x?.text ||
                    ""
            )
            .filter(
                Boolean
            )
            .join(
                "\n"
            );

    }


    return "";

}


// =====================================================
// PARSER JSON
// =====================================================

function parseJSON(
    texto
) {

    if (
        !texto
    ) {

        throw new Error(
            "La IA no devolvió contenido."
        );

    }


    let limpio =
        String(
            texto
        )
        .trim();


    // quitar Markdown
    limpio =
        limpio.replace(
            /^```json/i,
            ""
        );


    limpio =
        limpio.replace(
            /^```/,
            ""
        );


    limpio =
        limpio.replace(
            /```$/,
            ""
        );


    limpio =
        limpio.trim();


    // -------------------------------------------------
    // JSON directo
    // -------------------------------------------------

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


    // -------------------------------------------------
    // Buscar objeto JSON
    // -------------------------------------------------

    const inicio =
        limpio.indexOf(
            "{"
        );


    const fin =
        limpio.lastIndexOf(
            "}"
        );


    if (
        inicio !== -1 &&
        fin > inicio
    ) {

        const posible =
            limpio.slice(
                inicio,
                fin + 1
            );


        try {

            return JSON.parse(
                posible
            );

        } catch {
            // continuar
        }

    }


    console.error(
        "JSON RAW NO VÁLIDO:"
    );

    console.error(
        texto
    );


    throw new Error(
        "La respuesta de la IA no es JSON válido."
    );

}


// =====================================================
// FETCH
// =====================================================

async function fetchText(
    url,
    timeout
) {

    const controller =
        new AbortController();


    const timer =
        setTimeout(
            () =>
                controller.abort(),
            timeout
        );


    try {

        const response =
            await fetch(
                url,
                {

                    method:
                        "GET",

                    headers:
                    {

                        "User-Agent":
                            "Mozilla/5.0 BÍO IA V9",

                        "Accept":
                            "text/html,application/xhtml+xml,text/plain,application/pdf,*/*"

                    },

                    signal:
                        controller.signal

                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        return await response.text();

    } finally {

        clearTimeout(
            timer
        );

    }

}


// =====================================================
// UTILIDADES
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


function limpiarEspacios(
    texto
) {

    return String(
        texto || ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function decodeHTML(
    texto
) {

    return String(
        texto || ""
    )
        .replace(
            /&amp;/gi,
            "&"
        )
        .replace(
            /&quot;/gi,
            '"'
        )
        .replace(
            /&#39;/gi,
            "'"
        )
        .replace(
            /&nbsp;/gi,
            " "
        );

}


function convertirURLSAG(
    href
) {

    if (
        !href
    ) {

        return "";

    }


    if (
        /^https?:\/\//i.test(
            href
        )
    ) {

        return href;

    }


    if (
        href.startsWith(
            "//"
        )
    ) {

        return "https:" +
            href;

    }


    if (
        href.startsWith(
            "/"
        )
    ) {

        return SAG_DOMAIN +
            href;

    }


    return SAG_DOMAIN +
        "/" +
        href.replace(
            /^\/+/,
            ""
        );

}


// =====================================================
// FUENTES
// =====================================================

function agregarFuentes(
    observaciones,
    sag,
    documentoURL
) {

    let resultado =
        normalizarTexto(
            observaciones
        ) ===
        "no encontrado"
            ? ""
            : String(
                observaciones
            );


    if (
        sag.encontrado
    ) {

        resultado +=
            " Fuente oficial consultada: SAG Chile.";

    }


    if (
        sag.productUrl
    ) {

        resultado +=
            ` Página SAG: ${sag.productUrl}`;

    }


    if (
        documentoURL
    ) {

        resultado +=
            ` Documento: ${documentoURL}`;

    }


    if (
        !resultado.trim()
    ) {

        resultado =
            "No encontrado";

    }


    return resultado.trim();

}


// =====================================================
// RESPUESTA NETLIFY
// =====================================================

function json(
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
