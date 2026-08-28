// =====================================================
// BÍO IA V5
// analizarEtiqueta.js
// =====================================================
//
// FLUJO:
//
// 1. Recibir fotografía
// 2. OpenRouter identifica producto
// 3. Buscar producto en SAG Chile
// 4. Obtener publicación oficial SAG
// 5. Obtener PDF de etiqueta/HDS
// 6. Leer PDF mediante Jina Reader
// 7. OpenRouter interpreta la documentación oficial
// 8. Aplicar reglas agronómicas BIO
// 9. Calcular dosis para 1 / 15 / 100 / 160 L
// 10. Interpretar 1X = preventivo / 2X = curativo
// 11. Devolver JSON compatible con BIO
//
// IMPORTANTE:
//
// - No se utiliza Gemini.
// - No se utiliza Google Search.
// - No se requiere una API key adicional para SAG/Jina.
// - OPENROUTER_API_KEY permanece solamente en Netlify.
//
// =====================================================


// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_KEY =
    process.env.OPENROUTER_API_KEY;

const OPENROUTER_URL =
    "https://openrouter.ai/api/v1/chat/completions";

const MODELO =
    "openrouter/free";

const SAG_SEARCH_URL =
    "https://www.sag.gob.cl/ambitos-de-accion/autorizacion-y-evaluacion-de-plaguicidas/publicaciones";

const JINA_READER_PREFIX =
    "https://r.jina.ai/";


const MAX_SAG_TEXT =
    25000;

const MAX_SOURCE_TEXT =
    60000;


// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

exports.handler = async (event) => {

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
                "OPENROUTER_API_KEY no encontrada."
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

        let body;

        try {

            body =
                JSON.parse(
                    event.body || "{}"
                );

        } catch {

            return json(
                400,
                {
                    ok: false,
                    mensaje:
                        "El cuerpo de la solicitud no es JSON válido."
                }
            );

        }


        let imageBase64 =
            body.image ||
            body.imageBase64 ||
            "";

        const promptOriginal =
            body.prompt ||
            "";


        if (!imageBase64) {

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
            typeof imageBase64 === "string" &&
            imageBase64.startsWith("data:")
        ) {

            const mimeMatch =
                imageBase64.match(
                    /^data:([^;]+);base64,/
                );

            if (
                mimeMatch &&
                mimeMatch[1]
            ) {

                mimeType =
                    mimeMatch[1];

            }

        }


        // =================================================
        // LIMPIAR BASE64
        // =================================================

        if (
            imageBase64.includes(",")
        ) {

            imageBase64 =
                imageBase64.split(",")[1];

        }


        if (
            !mimeType.startsWith("image/")
        ) {

            return json(
                400,
                {
                    ok: false,
                    mensaje:
                        `Tipo de imagen no soportado: ${mimeType}`
                }
            );

        }


        console.log(
            "======================================"
        );

        console.log(
            "BÍO IA V5 - INICIO"
        );

        console.log(
            "======================================"
        );

        console.log(
            "Proveedor IA:",
            "OpenRouter"
        );

        console.log(
            "Modelo:",
            MODELO
        );

        console.log(
            "Imagen:",
            mimeType
        );

        console.log(
            "Tamaño Base64:",
            imageBase64.length
        );


        // =================================================
        // PASO 1
        // IDENTIFICAR PRODUCTO DESDE LA FOTO
        // =================================================

        console.log(
            "PASO 1: Identificación visual..."
        );


        const identificacion =
            await identificarProducto(
                imageBase64,
                mimeType,
                promptOriginal
            );


        console.log(
            "Producto identificado:",
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


        // =================================================
        // PASO 2
        // BUSCAR EN SAG
        // =================================================

        console.log(
            "PASO 2: Buscando producto en SAG..."
        );


        const sag =
            await buscarProductoSAG(
                identificacion
            );


        console.log(
            "SAG encontrado:",
            sag.encontrado
        );

        console.log(
            "SAG URL:",
            sag.productUrl || ""
        );

        console.log(
            "SAG PDF:",
            sag.pdfUrl || ""
        );


        // =================================================
        // PASO 3
        // LEER DOCUMENTACIÓN OFICIAL
        // =================================================

        let fuenteOficial = "";

        let fuenteUrl = "";

        if (
            sag.pdfUrl
        ) {

            console.log(
                "PASO 3: Leyendo PDF SAG..."
            );


            fuenteOficial =
                await leerConJina(
                    sag.pdfUrl
                );

            fuenteUrl =
                sag.pdfUrl;

        }


        // Si no encontramos PDF, intentamos leer
        // la página oficial del SAG.

        if (
            !fuenteOficial &&
            sag.productUrl
        ) {

            console.log(
                "No hubo PDF. Leyendo página SAG..."
            );


            fuenteOficial =
                await leerConJina(
                    sag.productUrl
                );

            fuenteUrl =
                sag.productUrl;

        }


        // =================================================
        // PASO 4
        // INTERPRETAR DOCUMENTACIÓN
        // =================================================

        let datosFinales;


        if (
            fuenteOficial
        ) {

            console.log(
                "PASO 4: Interpretando documentación oficial..."
            );


            datosFinales =
                await interpretarDocumentacion(
                    identificacion,
                    fuenteOficial,
                    promptOriginal
                );

        } else {

            console.log(
                "No se obtuvo documentación SAG. Usando identificación visual."
            );


            datosFinales =
                normalizarDatos(
                    identificacion
                );

        }


        // =================================================
        // PASO 5
        // REGLAS BIO
        // =================================================

        console.log(
            "PASO 5: Aplicando reglas BIO..."
        );


        datosFinales =
            aplicarReglasBIO(
                datosFinales,
                fuenteOficial
            );


        // =================================================
        // PASO 6
        // CÁLCULOS DE DOSIS
        // =================================================

        console.log(
            "PASO 6: Calculando dosis..."
        );


        datosFinales.dosis =
            construirDosisBIO(
                datosFinales.dosis
            );


        // =================================================
        // OBSERVACIONES / FUENTE
        // =================================================

        datosFinales.observaciones =
            agregarFuente(
                datosFinales.observaciones,
                sag,
                fuenteUrl
            );


        // =================================================
        // LOG FINAL
        // =================================================

        console.log(
            "======================================"
        );

        console.log(
            "BÍO IA V5 - RESULTADO FINAL"
        );

        console.log(
            "======================================"
        );

        console.log(
            JSON.stringify(
                datosFinales
            )
        );


        // =================================================
        // RESPUESTA
        // =================================================

        return json(
            200,
            {

                ok:
                    true,

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO,

                modelo_utilizado:
                    null,

                fuente:
                    sag.encontrado
                        ? "SAG Chile"
                        : "Imagen",

                fuente_url:
                    fuenteUrl || null,

                sag:
                    sag,

                datos:
                    datosFinales

            }
        );


    } catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "ERROR BÍO IA V5"
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
// IDENTIFICACIÓN DEL PRODUCTO
// =====================================================

async function identificarProducto(
    imageBase64,
    mimeType,
    promptOriginal
) {

    const prompt = `

Eres BÍO IA.

Analiza la fotografía del producto agrícola.

Tu prioridad es IDENTIFICAR el producto.

NO INVENTES.

Busca:

- nombre comercial
- ingrediente activo
- concentración
- formulación
- fabricante
- registro SAG
- contenido
- tipo de producto
- función
- plagas
- cultivos
- modo de acción si aparece

IMPORTANTE:

Si la imagen indica literalmente:

"actividad sistémica"

debes incluir:

"Sistémico"

en modo_accion.

No inventes dosis si no aparecen.

Devuelve SOLO JSON válido.

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

Si un dato no es legible:

texto = "No encontrado"

array = []

Información adicional de la aplicación:

${promptOriginal}

`;


    const data =
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


    const texto =
        extractText(
            data
        );


    const datos =
        parseJSONSeguro(
            texto
        );


    return normalizarDatos(
        datos
    );

}


// =====================================================
// BUSCAR PRODUCTO EN SAG
// =====================================================

async function buscarProductoSAG(
    identificacion
) {

    const nombre =
        limpiarValor(
            identificacion.nombre
        );

    const registro =
        limpiarValor(
            identificacion.registro
        );


    if (
        !nombre ||
        nombre === "No encontrado"
    ) {

        return {
            encontrado:
                false,

            mensaje:
                "No hay nombre comercial suficiente para buscar en SAG."
        };

    }


    try {

        // -------------------------------------------------
        // Buscar primero por nombre comercial.
        // -------------------------------------------------

        const url =
            `${SAG_SEARCH_URL}?title=${encodeURIComponent(nombre)}`;


        console.log(
            "Consultando SAG:",
            url
        );


        const html =
            await fetchText(
                url
            );


        if (!html) {

            return {
                encontrado:
                    false,

                mensaje:
                    "SAG no devolvió contenido."
            };

        }


        // -------------------------------------------------
        // Buscar enlace del producto.
        // -------------------------------------------------

        const productUrl =
            encontrarEnlaceSAG(
                html,
                nombre
            );


        // -------------------------------------------------
        // Si no encontramos por nombre,
        // intentamos con registro.
        // -------------------------------------------------

        if (
            !productUrl &&
            registro &&
            registro !== "No encontrado"
        ) {

            const urlRegistro =
                `${SAG_SEARCH_URL}?title=${encodeURIComponent(registro)}`;


            const htmlRegistro =
                await fetchText(
                    urlRegistro
                );


            const porRegistro =
                encontrarEnlaceSAG(
                    htmlRegistro,
                    registro
                );


            if (
                porRegistro
            ) {

                return {
                    encontrado:
                        true,

                    productUrl:
                        porRegistro,

                    pdfUrl:
                        "",

                    metodo:
                        "registro SAG"

                };

            }

        }


        if (
            !productUrl
        ) {

            return {
                encontrado:
                    false,

                mensaje:
                    "No se encontró una publicación SAG directamente por nombre."
            };

        }


        // -------------------------------------------------
        // Leer página individual SAG
        // -------------------------------------------------

        const paginaSAG =
            await fetchText(
                productUrl
            );


        // -------------------------------------------------
        // Buscar PDF
        // -------------------------------------------------

        const pdfUrl =
            encontrarPDF(
                paginaSAG
            );


        return {

            encontrado:
                true,

            productUrl:
                productUrl,

            pdfUrl:
                pdfUrl || "",

            metodo:
                "nombre comercial"

        };


    } catch (error) {

        console.error(
            "Error buscando en SAG:",
            error
        );


        return {

            encontrado:
                false,

            mensaje:
                "Error consultando SAG.",

            error:
                error?.message ||
                String(error)

        };

    }

}


// =====================================================
// ENCONTRAR ENLACE SAG
// =====================================================

function encontrarEnlaceSAG(
    html,
    termino
) {

    if (
        !html
    ) {

        return "";

    }


    const regex =
        /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


    const buscado =
        normalizarTexto(
            termino
        );


    let match;


    while (
        (match =
            regex.exec(
                html
            ))
    ) {

        const href =
            decodeHTML(
                match[1]
            );


        const texto =
            normalizarTexto(
                stripHTML(
                    match[2]
                )
            );


        if (
            texto &&
            (
                texto.includes(
                    buscado
                ) ||
                buscado.includes(
                    texto
                )
            )
        ) {

            return
                convertirURLSAG(
                    href
                );

        }

    }


    return "";

}


// =====================================================
// ENCONTRAR PDF
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
        /href=["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi;


    let match;


    while (
        (match =
            regex.exec(
                html
            ))
    ) {

        return convertirURLSAG(
            decodeHTML(
                match[1]
            )
        );

    }


    return "";

}


// =====================================================
// CONVERTIR URL SAG
// =====================================================

function convertirURLSAG(
    href
) {

    if (
        !href
    ) {

        return "";

    }


    if (
        href.startsWith(
            "http://"
        ) ||
        href.startsWith(
            "https://"
        )
    ) {

        return href;

    }


    if (
        href.startsWith("//")
    ) {

        return "https:" +
            href;

    }


    if (
        href.startsWith("/")
    ) {

        return "https://www.sag.gob.cl" +
            href;

    }


    return
        "https://www.sag.gob.cl/" +
        href.replace(
            /^\/+/,
            ""
        );

}


// =====================================================
// LEER URL CON JINA
// =====================================================

async function leerConJina(
    url
) {

    if (
        !url
    ) {

        return "";

    }


    try {

        const jinaUrl =
            JINA_READER_PREFIX +
            url;


        console.log(
            "Jina Reader:",
            jinaUrl
        );


        const texto =
            await fetchText(
                jinaUrl
            );


        if (
            !texto
        ) {

            return "";

        }


        // Limitar tamaño para evitar
        // enviar documentos enormes al modelo.

        return texto.slice(
            0,
            MAX_SOURCE_TEXT
        );


    } catch (error) {

        console.error(
            "Error Jina Reader:",
            error
        );


        return "";

    }

}


// =====================================================
// INTERPRETAR DOCUMENTACIÓN
// =====================================================

async function interpretarDocumentacion(
    identificacion,
    fuente,
    promptOriginal
) {

    const textoFuente =
        fuente.slice(
            0,
            MAX_SOURCE_TEXT
        );


    const prompt = `

Eres BÍO IA, especialista en protección vegetal
y productos fitosanitarios utilizados en Chile.

Tienes:

1. Una identificación inicial obtenida desde una fotografía.
2. Documentación oficial obtenida desde SAG Chile.

Tu tarea es completar la información de BIO utilizando
PRIORITARIAMENTE la documentación oficial.

=========================================
REGLAS FUNDAMENTALES
=========================================

NO INVENTES.

Si el dato no aparece o no puede verificarse:

"No encontrado"

=========================================
PRIORIDAD DE FUENTES
=========================================

1. Documento oficial SAG Chile.
2. Información oficial de la etiqueta/HDS.
3. Información visible en la fotografía.

=========================================
REGLA DE CRISANTEMO
=========================================

Cuando se consulte BIO para CRISANTEMO:

1. Buscar primero recomendación específica para:
   - crisantemo
   - flores
   - ornamentales

2. Si NO existe recomendación específica,
   utilizar HORTALIZAS / VERDURAS como
   referencia agronómica.

3. NUNCA utilizar como referencia:
   - árboles
   - vides

IMPORTANTE:

Cuando se utilice hortalizas como referencia porque
no existe recomendación específica para crisantemo,
indícalo claramente en observaciones como:

"Referencia agronómica tomada de hortalizas por ausencia
de recomendación específica para crisantemo/flores."

No presentes esa asociación como una autorización SAG
específica para crisantemo.

=========================================
CARENCIA
=========================================

Prioridad:

1. Carencia específica del cultivo.
2. Carencia para flores/ornamentales.
3. Carencia aplicable a invernadero.
4. Si no existe:

"No encontrado"

No confundas carencia con reentrada.

=========================================
REINGRESO
=========================================

Prioridad:

1. Reingreso específico para invernadero.
2. Reingreso específico del cultivo.
3. Reingreso general.

Si no existe:

"No encontrado"

=========================================
MODO DE ACCIÓN
=========================================

Busca en la documentación:

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

Si el documento indica:

"actividad sistémica"

devuelve:

"Sistémico"

=========================================
DOSIS
=========================================

Conserva la dosis OFICIAL.

Si la documentación contiene varias dosis
según cultivo/plaga, conserva las diferencias.

NO conviertas una dosis en otra arbitrariamente.

=========================================
1X / 2X
=========================================

REGLA BIO:

1X = Preventivo

2X = Curativo

Si aparece:

1X - 2X

debes interpretar:

Preventivo = 1X

Curativo = 2X

No inventes valores numéricos adicionales.

=========================================
CÁLCULO DE DOSIS
=========================================

Cuando exista una dosis expresada por 100 litros,
calcula también para:

1 L
15 L
100 L
160 L

Ejemplo:

30 g / 100 L

1 L = 0,30 g
15 L = 4,50 g
100 L = 30 g
160 L = 48 g

Si la dosis es un rango,
mantén el rango en todos los volúmenes.

=========================================
RESPUESTA
=========================================

Devuelve SOLO JSON válido.

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

=========================================
PRODUCTO IDENTIFICADO
=========================================

${JSON.stringify(
    identificacion
)}

=========================================
DOCUMENTACIÓN SAG
=========================================

${textoFuente}

=========================================
INSTRUCCIONES ADICIONALES DE LA APLICACIÓN
=========================================

${promptOriginal}

`;


    const data =
        await llamarOpenRouter(
            prompt,
            []
        );


    const texto =
        extractText(
            data
        );


    const datos =
        parseJSONSeguro(
            texto
        );


    return normalizarDatos(
        datos
    );

}


// =====================================================
// REGLAS BIO
// =====================================================

function aplicarReglasBIO(
    datos,
    fuente
) {

    const cultivosTexto =
        datos.cultivos
            .join(" ")
            .toLowerCase();


    const fuenteTexto =
        String(
            fuente || ""
        ).toLowerCase();


    // -------------------------------------------------
    // REGLA SISTÉMICO
    // -------------------------------------------------

    const accionTexto =
        (
            datos.modo_accion
                .join(" ") +
            " " +
            datos.observaciones +
            " " +
            fuenteTexto
        ).toLowerCase();


    if (
        accionTexto.includes(
            "actividad sistémica"
        ) ||
        accionTexto.includes(
            "actividad sistemica"
        ) ||
        accionTexto.includes(
            "sistémico"
        ) ||
        accionTexto.includes(
            "sistemico"
        )
    ) {

        const existe =
            datos.modo_accion.some(
                x =>
                    x.toLowerCase()
                        .includes(
                            "sistém"
                        )
            );


        if (
            !existe
        ) {

            datos.modo_accion.push(
                "Sistémico"
            );

        }

    }


    // -------------------------------------------------
    // REGLA CRISANTEMO
    // -------------------------------------------------

    const hablaCrisantemo =
        cultivosTexto.includes(
            "crisantemo"
        );


    const hablaFlores =
        cultivosTexto.includes(
            "flor"
        ) ||
        cultivosTexto.includes(
            "ornamental"
        );


    if (
        !hablaCrisantemo &&
        !hablaFlores
    ) {

        const textoObservacion =
            (
                datos.observaciones || ""
            ).toLowerCase();


        if (
            textoObservacion.includes(
                "hortal"
            )
        ) {

            datos.observaciones +=
                " Referencia BIO: ante ausencia de recomendación específica para crisantemo/flores se utiliza hortalizas como referencia agronómica; nunca árboles o vides.";

        }

    }


    // -------------------------------------------------
    // REGLA 1X / 2X
    // -------------------------------------------------

    const dosisTexto =
        String(
            datos.dosis || ""
        );


    if (
        /1\s*x/i.test(
            dosisTexto
        ) ||
        /2\s*x/i.test(
            dosisTexto
        )
    ) {

        if (
            !dosisTexto
                .toLowerCase()
                .includes(
                    "preventivo"
                )
        ) {

            datos.dosis +=
                " | 1X = Preventivo";

        }


        if (
            !dosisTexto
                .toLowerCase()
                .includes(
                    "curativo"
                )
        ) {

            datos.dosis +=
                " | 2X = Curativo";

        }

    }


    return datos;

}


// =====================================================
// CONSTRUIR DOSIS BIO
// =====================================================

function construirDosisBIO(
    dosis
) {

    if (
        !dosis
    ) {

        return
            "No encontrado";

    }


    const texto =
        String(
            dosis
        ).trim();


    if (
        texto ===
        "No encontrado"
    ) {

        return texto;

    }


    // -------------------------------------------------
    // Detectar:
    //
    // 30 g / 100 L
    // 30-40 g/100 L
    // 0,3 L/100 L
    // 100 cc/100 L
    // -------------------------------------------------

    const match =
        texto.match(
            /(\d+(?:[.,]\d+)?)\s*(?:-|a)\s*(\d+(?:[.,]\d+)?)?\s*(mg|g|kg|ml|mL|cc|l|L)\s*\/\s*100\s*(?:l|L)/i
        );


    if (
        !match
    ) {

        // Puede existir 1X-2X sin una
        // relación /100 L.
        return
            texto;

    }


    const valor1 =
        numero(
            match[1]
        );


    const valor2 =
        match[2]
            ? numero(
                match[2]
            )
            : null;


    const unidadOriginal =
        normalizarUnidad(
            match[3]
        );


    const resultados =
        [];


    resultados.push(
        calcularDosisLinea(
            1,
            valor1,
            valor2,
            unidadOriginal
        )
    );


    resultados.push(
        calcularDosisLinea(
            15,
            valor1,
            valor2,
            unidadOriginal
        )
    );


    resultados.push(
        calcularDosisLinea(
            100,
            valor1,
            valor2,
            unidadOriginal
        )
    );


    resultados.push(
        calcularDosisLinea(
            160,
            valor1,
            valor2,
            unidadOriginal
        )
    );


    let resultadoFinal =
        texto;


    resultadoFinal +=
        "\n\nCálculo BIO por volumen de agua:\n";


    resultadoFinal +=
        resultados.join(
            "\n"
        );


    // -------------------------------------------------
    // 1X / 2X
    // -------------------------------------------------

    if (
        /1\s*x/i.test(
            texto
        ) ||
        /2\s*x/i.test(
            texto
        )
    ) {

        resultadoFinal +=
            "\n1X = Preventivo";

        resultadoFinal +=
            "\n2X = Curativo";

    }


    return resultadoFinal;

}


// =====================================================
// CALCULAR DOSIS POR VOLUMEN
// =====================================================

function calcularDosisLinea(
    litros,
    valor1,
    valor2,
    unidad
) {

    const calculado1 =
        valor1 *
        litros /
        100;


    const calculado2 =
        valor2 != null
            ? valor2 *
                litros /
                100
            : null;


    if (
        calculado2 != null
    ) {

        return (
            `${litros} L = ` +
            `${formatearNumero(calculado1)}-${formatearNumero(calculado2)} ${unidad}`
        );

    }


    return (
        `${litros} L = ` +
        `${formatearNumero(calculado1)} ${unidad}`
    );

}


// =====================================================
// INTERPRETAR NÚMERO
// =====================================================

function numero(
    valor
) {

    return parseFloat(
        String(
            valor
        ).replace(
            ",",
            "."
        )
    );

}


// =====================================================
// NORMALIZAR UNIDAD
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
// FORMATEAR NÚMERO
// =====================================================

function formatearNumero(
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
    ).toString()
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
                datos[campo] &&
                String(
                    datos[campo]
                ).trim()
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
// AGREGAR FUENTE
// =====================================================

function agregarFuente(
    observaciones,
    sag,
    fuenteUrl
) {

    let resultado =
        observaciones ===
            "No encontrado"
            ? ""
            : observaciones;


    if (
        sag.encontrado
    ) {

        resultado +=
            " Fuente consultada: SAG Chile.";

    }


    if (
        fuenteUrl
    ) {

        resultado +=
            ` Documento oficial: ${fuenteUrl}`;

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
// OPENROUTER
// =====================================================

async function llamarOpenRouter(
    prompt,
    contenidoExtra
) {

    const contenido = [
        {
            type:
                "text",

            text:
                prompt
        }
    ];


    if (
        Array.isArray(
            contenidoExtra
        )
    ) {

        for (
            const item
            of contenidoExtra
        ) {

            contenido.push(
                item
            );

        }

    }


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
                        "BÍO IA"

                },

                body:
                    JSON.stringify(
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
                                        contenido
                                }
                            ]

                        }
                    )

            }
        );


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(
                text
            );

    } catch {

        data =
        {
            raw:
                text
        };

    }


    console.log(
        "OpenRouter HTTP:",
        response.status
    );


    console.log(
        "OpenRouter modelo:",
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


    return data;

}


// =====================================================
// EXTRAER TEXTO
// =====================================================

function extractText(
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
                    x?.text || ""
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
// PARSEAR JSON
// =====================================================

function parseJSONSeguro(
    texto
) {

    if (
        typeof texto !== "string"
    ) {

        throw new Error(
            "La IA no devolvió texto."
        );

    }


    let limpio =
        texto.trim();


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


    try {

        return JSON.parse(
            limpio.trim()
        );

    } catch {

        // Intentar encontrar el primer objeto JSON
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
            fin !== -1 &&
            fin > inicio
        ) {

            return JSON.parse(
                limpio.slice(
                    inicio,
                    fin + 1
                )
            );

        }


        throw new Error(
            "La respuesta de la IA no es JSON válido."
        );

    }

}


// =====================================================
// FETCH TEXT
// =====================================================

async function fetchText(
    url
) {

    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            25000
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
                            "Mozilla/5.0 BÍO-IA",

                        "Accept":
                            "text/html,application/xhtml+xml,text/plain,application/pdf"

                    },

                    signal:
                        controller.signal

                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status} al consultar ${url}`
            );

        }


        return await response.text();

    } finally {

        clearTimeout(
            timeout
        );

    }

}


// =====================================================
// LIMPIAR VALOR
// =====================================================

function limpiarValor(
    valor
) {

    if (
        typeof valor !== "string"
    ) {

        return "";

    }


    return valor.trim();

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

function decodeHTML(
    text
) {

    return String(
        text || ""
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


// =====================================================
// JSON NETLIFY
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
