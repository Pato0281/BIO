// =====================================================
// BÍO IA V10
// netlify/functions/analizarEtiqueta.js
// =====================================================
//
// OBJETIVO V10
//
// 1. Leer fotografía
// 2. Identificar producto con OpenRouter
// 3. Normalizar nombres mal leídos
// 4. Buscar coincidencia real en SAG Chile
// 5. Confirmar página oficial SAG
// 6. Encontrar PDF oficial
// 7. Leer PDF mediante Jina Reader
// 8. Interpretar documentación oficial
// 9. Aplicar reglas BIO
// 10. Preparar dosis 1 / 15 / 100 / 160 L
// 11. 1X = preventivo / 2X = curativo
//
// NO UTILIZA GEMINI.
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
    "minimax/minimax-m3:free";

const SAG_SEARCH_URL =
    "https://www.sag.gob.cl/buscador-general";

const SAG_CONTENT_URL =
    "https://www.sag.gob.cl/content";

const SAG_DOMAIN =
    "https://www.sag.gob.cl";

const JINA_PREFIX =
    "https://r.jina.ai/";

const AI_TIMEOUT =
    20000;

const WEB_TIMEOUT =
    10000;

const MAX_DOCUMENT =
    80000;


// =====================================================
// HANDLER
// =====================================================

exports.handler = async (event) => {

    const inicio =
        Date.now();


    console.log(
        "========================================"
    );

    console.log(
        "BÍO IA V10 - INICIO"
    );

    console.log(
        "========================================"
    );


    // -------------------------------------------------
    // MÉTODO
    // -------------------------------------------------

    if (
        event.httpMethod !== "POST"
    ) {

        return responder(
            405,
            {
                ok:
                    false,

                mensaje:
                    "Método no permitido."
            }
        );

    }


    try {

        // -------------------------------------------------
        // API KEY
        // -------------------------------------------------

        if (
            !API_KEY
        ) {

            throw new Error(
                "OPENROUTER_API_KEY no está configurada en Netlify."
            );

        }


        // -------------------------------------------------
        // BODY
        // -------------------------------------------------

        const body =
            parseBody(
                event.body
            );


        let imagen =
            body.image ||
            body.imageBase64 ||
            "";


        const promptOriginal =
            body.prompt ||
            "";


        if (
            !imagen
        ) {

            return responder(
                400,
                {
                    ok:
                        false,

                    mensaje:
                        "No se recibió ninguna imagen."
                }
            );

        }


        // -------------------------------------------------
        // MIME
        // -------------------------------------------------

        let mimeType =
            "image/jpeg";


        if (
            imagen.startsWith(
                "data:"
            )
        ) {

            const mime =
                imagen.match(
                    /^data:([^;]+);base64,/
                );


            if (
                mime &&
                mime[1]
            ) {

                mimeType =
                    mime[1];

            }

        }


        if (
            imagen.includes(",")
        ) {

            imagen =
                imagen.split(
                    ","
                )[1];

        }


        console.log(
            "Imagen:",
            mimeType
        );

        console.log(
            "Tamaño Base64:",
            imagen.length
        );


        // =================================================
        // ETAPA 1
        // IDENTIFICACIÓN VISUAL
        // =================================================

        console.log(
            "ETAPA 1: IDENTIFICACIÓN VISUAL"
        );


        let identificacion =
            await identificarProducto(
                imagen,
                mimeType,
                promptOriginal
            );


        console.log(
            "----------------------------------------"
        );

        console.log(
            "IDENTIFICACIÓN ORIGINAL"
        );

        console.log(
            JSON.stringify(
                identificacion,
                null,
                2
            )
        );


        // -------------------------------------------------
        // NORMALIZAR NOMBRE
        // -------------------------------------------------

        identificacion =
            normalizarIdentificacion(
                identificacion
            );


        console.log(
            "----------------------------------------"
        );

        console.log(
            "IDENTIFICACIÓN NORMALIZADA"
        );

        console.log(
            JSON.stringify(
                identificacion,
                null,
                2
            )
        );


        // =================================================
        // ETAPA 2
        // BÚSQUEDA SAG
        // =================================================

        console.log(
            "========================================"
        );

        console.log(
            "ETAPA 2: BÚSQUEDA SAG"
        );

        console.log(
            "========================================"
        );


        const sag =
            await buscarEnSAG(
                identificacion
            );


        console.log(
            "========================================"
        );

        console.log(
            "RESULTADO SAG"
        );

        console.log(
            JSON.stringify(
                sag,
                null,
                2
            )
        );


        // =================================================
        // ETAPA 3
        // DOCUMENTACIÓN
        // =================================================

        let documento =
            "";

        let documentoURL =
            "";


        if (
            sag.pdfUrl
        ) {

            console.log(
                "========================================"
            );

            console.log(
                "ETAPA 3: LEYENDO PDF SAG"
            );

            console.log(
                sag.pdfUrl
            );


            documentoURL =
                sag.pdfUrl;


            documento =
                await leerDocumento(
                    sag.pdfUrl
                );

        }


        // -------------------------------------------------
        // FALLBACK: página SAG
        // -------------------------------------------------

        if (
            !documento &&
            sag.productUrl
        ) {

            console.log(
                "PDF no leído."
            );

            console.log(
                "Intentando página SAG..."
            );


            documentoURL =
                sag.productUrl;


            documento =
                await leerDocumento(
                    sag.productUrl
                );

        }


        console.log(
            "Caracteres documentación:",
            documento.length
        );


        // =================================================
        // ETAPA 4
        // INTERPRETAR DOCUMENTACIÓN
        // =================================================

        let datos =
            identificacion;


        if (
            documento &&
            documento.length >
                100
        ) {

            console.log(
                "========================================"
            );

            console.log(
                "ETAPA 4: INTERPRETACIÓN DOCUMENTAL"
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


                datos =
                    identificacion;

            }

        } else {

            console.log(
                "No existe documentación suficiente."
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
            aplicarReglasBIO(
                datos,
                documento
            );


        // =================================================
        // ETAPA 6
        // DOSIS
        // =================================================

        console.log(
            "ETAPA 6: CÁLCULO DE DOSIS"
        );


        datos.dosis =
            construirDosisBIO(
                datos.dosis,
                datos.mojamiento
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


        // =================================================
        // RESULTADO
        // =================================================

        const duracion =
            Date.now() -
            inicio;


        console.log(
            "========================================"
        );

        console.log(
            "BÍO IA V10 - RESULTADO FINAL"
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
            "========================================"
        );


        return responder(
            200,
            {

                ok:
                    true,

                proveedor:
                    "OpenRouter",

                modelo:
                    MODELO,

                modelo_utilizado:
                    datos.modelo_utilizado ||
                    null,

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
            "========================================"
        );

        console.error(
            "ERROR GENERAL BÍO IA V10"
        );

        console.error(
            error
        );

        console.error(
            "========================================"
        );


        return responder(
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
    imagen,
    mimeType,
    promptOriginal
) {

    const prompt = `

Eres BÍO IA, especialista en productos
fitosanitarios agrícolas utilizados en Chile.

Analiza cuidadosamente la fotografía.

Tu objetivo es identificar el producto comercial.

NO INVENTES.

Debes distinguir correctamente:

- nombre comercial
- concentración
- formulación
- fabricante
- ingrediente activo
- contenido
- registro
- función
- modo de acción si aparece

IMPORTANTE:

La imagen puede contener un registro de otro país.

NO debes asumir que un registro de SENASA,
Perú, Argentina, Brasil u otro país corresponde
al registro SAG Chile.

El registro mostrado en la fotografía debe copiarse
como aparece, pero debe conservarse como texto
de identificación, no como registro SAG chileno.

MODO DE ACCIÓN:

Si aparece:

"actividad sistémica"
→ "Sistémico"

"acción de contacto"
→ "Contacto"

"acción de ingestión"
→ "Ingestión"

Si aparecen varias acciones:
inclúyelas todas.

NO inventes:

- dosis
- carencia
- reentrada

si no son visibles.

Devuelve SOLO JSON válido:

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
                            `data:${mimeType};base64,${imagen}`
                    }

                }

            ]
        );


    console.log(
        "----------------------------------------"
    );

    console.log(
        "RAW IDENTIFICACIÓN"
    );

    console.log(
        resultado.texto
    );

    console.log(
        "----------------------------------------"
    );


    const datos =
        parsearJSON(
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
// NORMALIZAR IDENTIFICACIÓN
// =====================================================

function normalizarIdentificacion(
    datos
) {

    datos =
        normalizarDatos(
            datos
        );


    if (
        datos.nombre &&
        datos.nombre !==
            "No encontrado"
    ) {

        datos.nombre =
            limpiarNombreComercial(
                datos.nombre
            );

    }


    return datos;

}


// =====================================================
// LIMPIAR NOMBRE COMERCIAL
// =====================================================

function limpiarNombreComercial(
    nombre
) {

    let texto =
        String(
            nombre
        ).trim();


    texto =
        texto.replace(
            /®/g,
            ""
        );


    texto =
        texto.replace(
            /™/g,
            ""
        );


    texto =
        texto.replace(
            /\s+/g,
            " "
        );


    return texto.trim();

}


// =====================================================
// BÚSQUEDA SAG
// =====================================================

async function buscarEnSAG(
    identificacion
) {

    const nombre =
        limpiar(
            identificacion.nombre
        );


    const registro =
        limpiar(
            identificacion.registro
        );


    const ingrediente =
        limpiar(
            identificacion.ingrediente_activo
        );


    if (
        !nombre ||
        normalizarTexto(
            nombre
        ) ===
        "no encontrado"
    ) {

        return {

            encontrado:
                false,

            mensaje:
                "No se identificó nombre comercial."

        };

    }


    // -------------------------------------------------
    // Generar términos de búsqueda
    // -------------------------------------------------

    const consultas =
        generarConsultasSAG(
            nombre,
            registro,
            ingrediente
        );


    console.log(
        "Consultas SAG:",
        JSON.stringify(
            consultas
        )
    );


    // -------------------------------------------------
    // BUSCAR EN SITIO SAG
    // -------------------------------------------------

    const candidatos =
        [];


    for (
        const consulta
        of consultas
    ) {

        try {

            const resultados =
                await consultarSAG(
                    consulta
                );


            candidatos.push(
                ...resultados
            );


            console.log(
                "SAG:",
                consulta,
                "→",
                resultados.length,
                "resultados"
            );

        } catch (
            error
        ) {

            console.error(
                "Error consulta SAG:",
                consulta,
                error
            );

        }

    }


    // -------------------------------------------------
    // ELIMINAR DUPLICADOS
    // -------------------------------------------------

    const unicos =
        eliminarDuplicadosSAG(
            candidatos
        );


    console.log(
        "Candidatos SAG totales:",
        unicos.length
    );


    // -------------------------------------------------
    // ELEGIR MEJOR COINCIDENCIA
    // -------------------------------------------------

    let mejor =
        elegirMejorSAG(
            unicos,
            nombre,
            registro,
            ingrediente
        );


    // -------------------------------------------------
    // FALLBACK POR SLUG
    //
    // Esto es importante para casos como:
    //
    // ORTHENE 75 PS
    // →
    // ORTHENE 75 SP
    // -------------------------------------------------

    if (
        !mejor
    ) {

        console.log(
            "No hubo coincidencia suficiente."
        );

        console.log(
            "Intentando candidatos por slug..."
        );


        mejor =
            await buscarPorSlug(
                nombre
            );

    }


    if (
        !mejor
    ) {

        return {

            encontrado:
                false,

            productoBuscado:
                nombre,

            mensaje:
                "No se encontró una coincidencia suficientemente confiable en SAG Chile."

        };

    }


    console.log(
        "MEJOR SAG:",
        JSON.stringify(
            mejor
        )
    );


    // -------------------------------------------------
    // VERIFICAR PÁGINA
    // -------------------------------------------------

    let pagina =
        "";


    try {

        pagina =
            await fetchText(
                mejor.url,
                WEB_TIMEOUT
            );

    } catch (
        error
    ) {

        console.error(
            "No se pudo abrir página SAG:",
            error
        );

    }


    // -------------------------------------------------
    // PDF
    // -------------------------------------------------

    let pdfUrl =
        encontrarPDF(
            pagina
        );


    // -------------------------------------------------
    // Segundo intento:
    // Jina sobre página SAG
    // -------------------------------------------------

    if (
        !pdfUrl
    ) {

        try {

            console.log(
                "Intentando localizar PDF mediante Jina..."
            );


            const paginaJina =
                await fetchText(
                    JINA_PREFIX +
                    mejor.url,
                    WEB_TIMEOUT
                );


            pdfUrl =
                encontrarPDF(
                    paginaJina
                );

        } catch (
            error
        ) {

            console.error(
                "Jina búsqueda PDF:",
                error
            );

        }

    }


    return {

        encontrado:
            true,

        productoBuscado:
            nombre,

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


// =====================================================
// GENERAR CONSULTAS SAG
// =====================================================

function generarConsultasSAG(
    nombre,
    registro,
    ingrediente
) {

    const consultas =
        [];


    const agregar =
        (valor) => {

            if (
                !valor
            ) {

                return;

            }


            const limpio =
                valor.trim();


            if (
                !limpio
            ) {

                return;

            }


            const existe =
                consultas.some(
                    x =>
                        normalizarTexto(
                            x
                        ) ===
                        normalizarTexto(
                            limpio
                        )
                );


            if (
                !existe
            ) {

                consultas.push(
                    limpio
                );

            }

        };


    // -------------------------------------------------
    // Nombre original
    // -------------------------------------------------

    agregar(
        nombre
    );


    // -------------------------------------------------
    // Nombre base:
    //
    // ORTHENE 75 PS
    // →
    // ORTHENE 75
    // -------------------------------------------------

    const base =
        obtenerNombreBase(
            nombre
        );


    agregar(
        base
    );


    // -------------------------------------------------
    // Solo marca principal
    // -------------------------------------------------

    const marca =
        obtenerMarca(
            nombre
        );


    agregar(
        marca
    );


    // -------------------------------------------------
    // Ingrediente
    // -------------------------------------------------

    if (
        ingrediente &&
        normalizarTexto(
            ingrediente
        ) !==
        "no encontrado"
    ) {

        agregar(
            `${marca} ${ingrediente}`
        );

    }


    // -------------------------------------------------
    // Registro
    //
    // Solo se utiliza como búsqueda adicional.
    // No se considera automáticamente SAG.
    // -------------------------------------------------

    if (
        registro &&
        !normalizarTexto(
            registro
        ).includes(
            "senasa"
        )
    ) {

        agregar(
            registro
        );

    }


    return consultas;

}


// =====================================================
// OBTENER NOMBRE BASE
// =====================================================

function obtenerNombreBase(
    nombre
) {

    let texto =
        limpiarNombreComercial(
            nombre
        );


    // Quitar símbolos
    texto =
        texto.replace(
            /[®™]/g,
            ""
        );


    // Quitar formulaciones al final
    texto =
        texto.replace(
            /\b(?:WP|SP|WG|SC|SL|EC|SG|SE|EW|OD|CS|GR|FS|ME|PS)\b/gi,
            ""
        );


    // Limpiar
    texto =
        texto.replace(
            /\s+/g,
            " "
        )
        .trim();


    return texto;

}


// =====================================================
// OBTENER MARCA
// =====================================================

function obtenerMarca(
    nombre
) {

    const base =
        obtenerNombreBase(
            nombre
        );


    // Ej:
    // ORTHENE 75
    // → ORTHENE

    const palabras =
        base.split(
            " "
        );


    const filtradas =
        palabras.filter(
            palabra =>
                !/^\d+(?:[.,]\d+)?$/.test(
                    palabra
                )
        );


    if (
        filtradas.length
    ) {

        return
            filtradas.join(
                " "
            );

    }


    return base;

}


// =====================================================
// CONSULTAR SAG
// =====================================================

async function consultarSAG(
    termino
) {

    const url =
        SAG_SEARCH_URL +
        "?search_api_fulltext=" +
        encodeURIComponent(
            termino
        );


    console.log(
        "URL SAG:",
        url
    );


    const html =
        await fetchText(
            url,
            WEB_TIMEOUT
        );


    return
        extraerResultadosSAG(
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
        (
            match =
                regex.exec(
                    html
                )
        ) !== null
    ) {

        const href =
            convertirURLSAG(
                decodeHTML(
                    match[1]
                )
            );


        const texto =
            limpiarEspacios(
                stripHTML(
                    match[2]
                )
            );


        if (
            !texto
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
                        texto,

                    url:
                        href

                }
            );

        }

    }


    return resultados;

}


// =====================================================
// ELEGIR MEJOR RESULTADO SAG
// =====================================================

function elegirMejorSAG(
    resultados,
    nombre,
    registro,
    ingrediente
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


    const baseN =
        normalizarTexto(
            obtenerNombreBase(
                nombre
            )
        );


    const marcaN =
        normalizarTexto(
            obtenerMarca(
                nombre
            )
        );


    const registroN =
        normalizarTexto(
            registro
        );


    const ingredienteN =
        normalizarTexto(
            ingrediente
        );


    let mejor =
        null;


    let mejorPuntaje =
        0;


    for (
        const item
        of resultados
    ) {

        const tituloN =
            normalizarTexto(
                item.titulo
            );


        if (
            !tituloN
        ) {

            continue;

        }


        let puntos =
            0;


        // -------------------------------------------------
        // Coincidencia exacta
        // -------------------------------------------------

        if (
            tituloN ===
            nombreN
        ) {

            puntos +=
                150;

        }


        // -------------------------------------------------
        // Nombre completo contenido
        // -------------------------------------------------

        if (
            tituloN.includes(
                nombreN
            )
        ) {

            puntos +=
                100;

        }


        // -------------------------------------------------
        // Base
        // -------------------------------------------------

        if (
            baseN &&
            tituloN.includes(
                baseN
            )
        ) {

            puntos +=
                90;

        }


        // -------------------------------------------------
        // Marca
        // -------------------------------------------------

        if (
            marcaN &&
            tituloN.includes(
                marcaN
            )
        ) {

            puntos +=
                50;

        }


        // -------------------------------------------------
        // Comparación de tokens
        // -------------------------------------------------

        const tokensBase =
            baseN.split(
                " "
            )
            .filter(Boolean);


        let coincidencias =
            0;


        for (
            const token
            of tokensBase
        ) {

            if (
                tituloN.includes(
                    token
                )
            ) {

                coincidencias++;

            }

        }


        if (
            tokensBase.length
        ) {

            puntos +=
                Math.round(
                    coincidencias /
                    tokensBase.length *
                    70
                );

        }


        // -------------------------------------------------
        // Registro
        // -------------------------------------------------

        if (
            registroN &&
            !registroN.includes(
                "senasa"
            ) &&
            tituloN.includes(
                registroN
            )
        ) {

            puntos +=
                60;

        }


        // -------------------------------------------------
        // Ingrediente
        // -------------------------------------------------

        if (
            ingredienteN &&
            ingredienteN !==
                "no encontrado" &&
            tituloN.includes(
                ingredienteN
            )
        ) {

            puntos +=
                20;

        }


        // -------------------------------------------------
        // Penalización por títulos claramente distintos
        // -------------------------------------------------

        if (
            !tituloN.includes(
                marcaN
            ) &&
            marcaN
        ) {

            puntos -=
                80;

        }


        if (
            puntos >
            mejorPuntaje
        ) {

            mejorPuntaje =
                puntos;

            mejor =
                item;

        }

    }


    console.log(
        "Mejor puntaje SAG:",
        mejorPuntaje
    );


    // -------------------------------------------------
    // Umbral de seguridad
    // -------------------------------------------------

    if (
        mejorPuntaje <
        70
    ) {

        return null;

    }


    return mejor;

}


// =====================================================
// BUSCAR POR SLUG
// =====================================================

async function buscarPorSlug(
    nombre
) {

    const base =
        obtenerNombreBase(
            nombre
        );


    const marca =
        obtenerMarca(
            nombre
        );


    const candidatos =
        [];


    // -------------------------------------------------
    // Base normal
    //
    // orthene-75
    // -------------------------------------------------

    agregarSlug(
        candidatos,
        base
    );


    // -------------------------------------------------
    // Marca + posibles formulaciones
    //
    // orthene-75-sp
    // orthene-75-wp
    // orthene-75-ps
    // -------------------------------------------------

    const variantes =
        [
            "SP",
            "WP",
            "PS",
            "WG",
            "SC",
            "SL",
            "EC",
            "SG"
        ];


    for (
        const variante
        of variantes
    ) {

        agregarSlug(
            candidatos,
            `${base}-${variante}`
        );


        agregarSlug(
            candidatos,
            `${marca}-75-${variante}`
        );

    }


    console.log(
        "Slugs candidatos:",
        JSON.stringify(
            candidatos
        )
    );


    for (
        const slug
        of candidatos
    ) {

        const url =
            `${SAG_CONTENT_URL}/${slug}`;


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
                                "Mozilla/5.0 BÍO-IA V10"

                        },

                        signal:
                            crearTimeout(
                                WEB_TIMEOUT
                            ).signal

                    }
                );


            if (
                response.ok
            ) {

                const html =
                    await response.text();


                // -------------------------------------------------
                // Confirmar que la página parece ser del producto
                // -------------------------------------------------

                const texto =
                    normalizarTexto(
                        stripHTML(
                            html
                        )
                    );


                const marcaN =
                    normalizarTexto(
                        marca
                    );


                if (
                    texto.includes(
                        marcaN
                    )
                ) {

                    console.log(
                        "Slug SAG válido:",
                        url
                    );


                    return
                    {

                        titulo:
                            extraerTituloPagina(
                                html
                            ) ||
                            slug.replace(
                                /-/g,
                                " "
                            ),

                        url:
                            url

                    };

                }

            }

        } catch (
            error
        ) {

            console.error(
                "Slug error:",
                slug,
                error?.message
            );

        }

    }


    return null;

}


// =====================================================
// AGREGAR SLUG
// =====================================================

function agregarSlug(
    lista,
    texto
) {

    if (
        !texto
    ) {

        return;

    }


    const slug =
        normalizarTexto(
            texto
        )
        .replace(
            /\s+/g,
            "-"
        );


    if (
        slug &&
        !lista.includes(
            slug
        )
    ) {

        lista.push(
            slug
        );

    }

}


// =====================================================
// EXTRAER TÍTULO PÁGINA
// =====================================================

function extraerTituloPagina(
    html
) {

    const match =
        html.match(
            /<title[^>]*>([\s\S]*?)<\/title>/i
        );


    if (
        match &&
        match[1]
    ) {

        return limpiarEspacios(
            stripHTML(
                match[1]
            )
        );

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


    // -------------------------------------------------
    // href con PDF
    // -------------------------------------------------

    const regex =
        /href\s*=\s*["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi;


    let match;


    while (
        (
            match =
                regex.exec(
                    html
                )
        ) !== null
    ) {

        return convertirURLSAG(
            decodeHTML(
                match[1]
            )
        );

    }


    // -------------------------------------------------
    // URL PDF escrita directamente
    // -------------------------------------------------

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
        "Leyendo:",
        url
    );


    // -------------------------------------------------
    // PDF → Jina
    // -------------------------------------------------

    if (
        /\.pdf(?:$|\?)/i.test(
            url
        )
    ) {

        const jinaURL =
            JINA_PREFIX +
            url;


        console.log(
            "Jina PDF:",
            jinaURL
        );


        try {

            const texto =
                await fetchText(
                    jinaURL,
                    WEB_TIMEOUT
                );


            if (
                texto &&
                texto.length >
                    100
            ) {

                return texto.slice(
                    0,
                    MAX_DOCUMENT
                );

            }

        } catch (
            error
        ) {

            console.error(
                "Error leyendo PDF con Jina:",
                error
            );

        }


        return "";

    }


    // -------------------------------------------------
    // HTML
    // -------------------------------------------------

    try {

        const html =
            await fetchText(
                url,
                WEB_TIMEOUT
            );


        if (
            html
        ) {

            return limpiarEspacios(
                stripHTML(
                    html
                )
            ).slice(
                0,
                MAX_DOCUMENT
            );

        }

    } catch (
        error
    ) {

        console.error(
            "Error leyendo HTML:",
            error
        );

    }


    return "";

}


// =====================================================
// INTERPRETAR DOCUMENTACIÓN
// =====================================================

async function interpretarDocumento(
    identificacion,
    documento,
    promptOriginal
) {

    const prompt = `

Eres BÍO IA, especialista en fitosanidad
y productos agrícolas utilizados en Chile.

La información siguiente proviene de una
documentación encontrada desde SAG Chile.

Debes extraer la información técnica
de la documentación.

NO INVENTES.

=========================================
PRODUCTO
=========================================

${JSON.stringify(
    identificacion
)}

=========================================
REGLA DE PRIORIDAD
=========================================

La etiqueta/ficha oficial SAG tiene prioridad.

=========================================
MODO DE ACCIÓN
=========================================

Buscar expresamente:

- Sistémico
- Contacto
- Ingestión
- Translaminar
- Fumigante
- Preventivo
- Curativo
- Erradicante
- Residual

Si aparece:

"actividad sistémica"
→ "Sistémico"

Si aparece:

"acción de contacto"
→ "Contacto"

Si aparece:

"acción de ingestión"
→ "Ingestión"

Busca también:

- IRAC
- FRAC
- HRAC

=========================================
CRISANTEMO
=========================================

Para BIO:

1. Buscar recomendación específica
   para crisantemo.

2. Si no existe,
   buscar flores/ornamentales.

3. Si tampoco existe,
   utilizar HORTALIZAS/VERDURAS
   como referencia agronómica BIO.

4. NUNCA utilizar árboles
   ni vides como referencia.

IMPORTANTE:

La asociación con hortalizas es una
REGLA AGRONÓMICA BIO.

No debe presentarse como autorización
SAG específica para crisantemo.

=========================================
CARENCIA
=========================================

Buscar:

- carencia
- días de carencia
- período de carencia

Prioridad:

1. cultivo específico
2. flores/ornamentales
3. condición de invernadero
4. general

=========================================
REINGRESO
=========================================

Buscar:

- reingreso
- reentrada
- ingreso al área tratada
- invernadero

Prioridad:

1. invernadero
2. cultivo
3. general

=========================================
DOSIS
=========================================

Extraer exactamente la dosis oficial.

Puede ser:

g/100 L
kg/100 L
mL/100 L
L/100 L

o:

g/ha
kg/ha
mL/ha
L/ha

No cambiar unidades.

=========================================
1X / 2X
=========================================

REGLA BIO:

1X = Preventivo = presión baja

2X = Curativo = presión alta

Cuando aparezca:

1X–2X

interpretar:

1X → preventivo
2X → curativo

Cuando el documento indique:

"usar dosis mayor con alta presión"

se puede relacionar:

dosis menor → presión baja / preventivo

dosis mayor → presión alta / curativo

No inventar esta relación.

=========================================
DOSIS PARA BIO
=========================================

Si la dosis está expresada por 100 L,
preparar referencia para:

1 L
15 L
100 L
160 L

Ejemplo:

30 g/100 L

1 L = 0,30 g
15 L = 4,50 g
100 L = 30 g
160 L = 48 g

Si hay rango,
mantener el rango.

Si la dosis es por hectárea,
no convertir a litros sin disponer
del mojamiento oficial.

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

Si un dato no aparece:

texto = "No encontrado"

array = []

=========================================
DOCUMENTACIÓN
=========================================

${documento}

=========================================
INSTRUCCIONES DE LA APLICACIÓN
=========================================

${promptOriginal}

`;


    const resultado =
        await llamarOpenRouter(
            prompt,
            []
        );


    console.log(
        "========================================"
    );

    console.log(
        "RAW DOCUMENTACIÓN"
    );

    console.log(
        "========================================"
    );

    console.log(
        resultado.texto
    );


    const datos =
        parsearJSON(
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


    function agregarAccion(
        accion
    ) {

        const existe =
            acciones.some(
                x =>
                    normalizarTexto(
                        x
                    ) ===
                    normalizarTexto(
                        accion
                    )
            );


        if (
            !existe
        ) {

            acciones.push(
                accion
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

        agregarAccion(
            "Sistémico"
        );

    }


    if (
        doc.includes(
            "accion de contacto"
        ) ||
        doc.includes(
            "de contacto"
        )
    ) {

        agregarAccion(
            "Contacto"
        );

    }


    if (
        doc.includes(
            "accion de ingestion"
        ) ||
        doc.includes(
            "de ingestion"
        )
    ) {

        agregarAccion(
            "Ingestión"
        );

    }


    if (
        doc.includes(
            "translaminar"
        )
    ) {

        agregarAccion(
            "Translaminar"
        );

    }


    datos.modo_accion =
        acciones;


    // -------------------------------------------------
    // 1X / 2X
    // -------------------------------------------------

    const dosisTexto =
        String(
            datos.dosis ||
            ""
        );


    if (
        /1\s*x/i.test(
            dosisTexto
        )
    ) {

        if (
            !normalizarTexto(
                datos.dosis
            ).includes(
                "preventivo"
            )
        ) {

            datos.dosis +=
                " | 1X = Preventivo (presión baja)";

        }

    }


    if (
        /2\s*x/i.test(
            dosisTexto
        )
    ) {

        if (
            !normalizarTexto(
                datos.dosis
            ).includes(
                "curativo"
            )
        ) {

            datos.dosis +=
                " | 2X = Curativo (presión alta)";

        }

    }


    // -------------------------------------------------
    // REGLA DE HORTALIZAS
    // -------------------------------------------------

    const cultivosN =
        normalizarTexto(
            datos.cultivos.join(
                " "
            )
        );


    const tieneCrisantemo =
        cultivosN.includes(
            "crisantemo"
        );


    const tieneFlores =
        cultivosN.includes(
            "flor"
        ) ||
        cultivosN.includes(
            "ornamental"
        );


    const tieneHortalizas =
        cultivosN.includes(
            "hortal"
        ) ||
        cultivosN.includes(
            "verdura"
        );


    if (
        !tieneCrisantemo &&
        !tieneFlores &&
        tieneHortalizas
    ) {

        const obs =
            normalizarTexto(
                datos.observaciones
            );


        if (
            !obs.includes(
                "referencia agronomica bio"
            )
        ) {

            datos.observaciones +=
                " Referencia agronómica BIO tomada de hortalizas por ausencia de recomendación específica para crisantemo/flores. No se utilizan árboles ni vides como referencia.";

        }

    }


    return datos;

}


// =====================================================
// DOSIS BIO
// =====================================================

function construirDosisBIO(
    dosis,
    mojamiento
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
    // DOSIS ÚNICA /100 L
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


    // -------------------------------------------------
    // Dosis por ha
    // -------------------------------------------------

    if (
        /\/\s*ha\b/i.test(
            original
        ) ||
        /por\s+hect[aá]rea/i.test(
            original
        )
    ) {

        const moj =
            extraerMojamiento(
                mojamiento
            );


        if (
            moj
        ) {

            const convertido =
                convertirDosisHa(
                    original,
                    moj
                );


            if (
                convertido
            ) {

                return
                    original +
                    "\n\nCálculo BIO por volumen de agua:" +
                    convertido;

            }

        }


        return
            original +
            "\n\nCálculo BIO para 1 / 15 / 100 / 160 L: requiere mojamiento oficial.";

    }


    return original;

}


// =====================================================
// CALCULAR VOLUMEN
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


    let resultado =
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


            resultado +=
                `\n${L} L = ${formatearNumero(x)}-${formatearNumero(y)} ${unidad}`;

        } else {

            resultado +=
                `\n${L} L = ${formatearNumero(x)} ${unidad}`;

        }

    }


    return resultado;

}


// =====================================================
// EXTRAER MOJAMIENTO
// =====================================================

function extraerMojamiento(
    texto
) {

    if (
        !texto
    ) {

        return null;

    }


    const rango =
        String(
            texto
        ).match(
            /(\d+(?:[.,]\d+)?)\s*(?:-|a)\s*(\d+(?:[.,]\d+)?)\s*L\s*\/\s*ha/i
        );


    if (
        rango
    ) {

        return {

            min:
                parseFloat(
                    rango[1].replace(
                        ",",
                        "."
                    )
                ),

            max:
                parseFloat(
                    rango[2].replace(
                        ",",
                        "."
                    )
                )

        };

    }


    const simple =
        String(
            texto
        ).match(
            /(\d+(?:[.,]\d+)?)\s*L\s*\/\s*ha/i
        );


    if (
        simple
    ) {

        const valor =
            parseFloat(
                simple[1].replace(
                    ",",
                    "."
                )
            );


        return {

            min:
                valor,

            max:
                valor

        };

    }


    return null;

}


// =====================================================
// CONVERTIR DOSIS / HA
// =====================================================

function convertirDosisHa(
    dosis,
    mojamiento
) {

    const match =
        String(
            dosis
        ).match(
            /(\d+(?:[.,]\d+)?)\s*(g|kg|ml|mL|L)\s*\/\s*ha/i
        );


    if (
        !match
    ) {

        return "";

    }


    const cantidad =
        parseFloat(
            match[1].replace(
                ",",
                "."
            )
        );


    const unidad =
        normalizarUnidad(
            match[2]
        );


    const aguaPromedio =
        (
            mojamiento.min +
            mojamiento.max
        ) /
        2;


    if (
        aguaPromedio <=
        0
    ) {

        return "";

    }


    const porLitro =
        cantidad /
        aguaPromedio;


    let resultado =
        "";


    for (
        const L
        of [
            1,
            15,
            100,
            160
        ]
    ) {

        const valor =
            porLitro *
            L;


        resultado +=
            `\n${L} L = ${formatearNumero(valor)} ${unidad}`;

    }


    return resultado;

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
                datos[campo] &&
                String(
                    datos[campo]
                ).trim()
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


    const controller =
        new AbortController();


    const timer =
        setTimeout(
            () =>
                controller.abort(),
            AI_TIMEOUT
        );


    try {

        console.log(
            "OpenRouter:",
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
                            "BÍO IA V10"

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
                                            content

                                    }

                                ]

                            }
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
            "OpenRouter modelo utilizado:",
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
                "OpenRouter no devolvió texto."
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
// EXTRAER TEXTO OPENROUTER
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
// PARSEAR JSON
// =====================================================

function parsearJSON(
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
        ).trim();


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
    // Buscar objeto balanceado
    // -------------------------------------------------

    const inicio =
        limpio.indexOf(
            "{"
        );


    if (
        inicio ===
        -1
    ) {

        throw new Error(
            "La respuesta de la IA no contiene JSON."
        );

    }


    let profundidad =
        0;

    let dentroString =
        false;

    let escape =
        false;


    for (
        let i =
            inicio;

        i <
            limpio.length;

        i++
    ) {

        const c =
            limpio[i];


        if (
            dentroString
        ) {

            if (
                escape
            ) {

                escape =
                    false;

                continue;

            }


            if (
                c ===
                "\\"
            ) {

                escape =
                    true;

                continue;

            }


            if (
                c ===
                '"'
            ) {

                dentroString =
                    false;

            }


            continue;

        }


        if (
            c ===
            '"'
        ) {

            dentroString =
                true;

            continue;

        }


        if (
            c ===
            "{"
        ) {

            profundidad++;

        } else if (
            c ===
            "}"
        ) {

            profundidad--;


            if (
                profundidad ===
                0
            ) {

                const objeto =
                    limpio.slice(
                        inicio,
                        i + 1
                    );


                try {

                    return JSON.parse(
                        objeto
                    );

                } catch {
                    break;
                }

            }

        }

    }


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


// =====================================================
// DOCUMENTO / WEB
// =====================================================

async function fetchText(
    url,
    timeoutMs
) {

    const controller =
        new AbortController();


    const timer =
        setTimeout(
            () =>
                controller.abort(),
            timeoutMs
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
                            "Mozilla/5.0 BÍO IA V10",

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
// TIMEOUT
// =====================================================

function crearTimeout(
    ms
) {

    const controller =
        new AbortController();


    setTimeout(
        () =>
            controller.abort(),
        ms
    );


    return controller;

}


// =====================================================
// URL SAG
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
// TEXTO
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


function limpiar(
    valor
) {

    return typeof valor ===
        "string"
        ? valor.trim()
        : "";

}


// =====================================================
// DUPLICADOS SAG
// =====================================================

function eliminarDuplicadosSAG(
    resultados
) {

    const vistos =
        new Set();


    return resultados.filter(
        item => {

            const clave =
                `${item.url}|${normalizarTexto(item.titulo)}`;


            if (
                vistos.has(
                    clave
                )
            ) {

                return false;

            }


            vistos.add(
                clave
            );


            return true;

        }
    );

}


// =====================================================
// DOSIS
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
    )
        .toString()
        .replace(
            ".",
            ","
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
            ` Documento consultado: ${documentoURL}`;

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
// BODY
// =====================================================

function parseBody(
    body
) {

    try {

        return JSON.parse(
            body ||
            "{}"
        );

    } catch {

        throw new Error(
            "El cuerpo de la solicitud no contiene JSON válido."
        );

    }

}


// =====================================================
// RESPUESTA
// =====================================================

function responder(
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
