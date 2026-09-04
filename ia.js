//======================================================
// BÍO IA ENGINE V4
// ia.js
//======================================================
//
// FLUJO ACTUAL:
//
// FOTO
//   ↓
// Netlify Function
//   ↓
// OpenRouter / IA
//   ↓
// Identificación
//   ↓
// app.js
//
// DATOS QUE RECIBE:
//
// ✅ Nombre
// ✅ Ingrediente activo
// ✅ Concentración
// ✅ Modo de acción
// ✅ Función
//
// DATOS MANUALES EN LA APP:
//
// ✅ Plaga 1
// ✅ Plaga 2
// ✅ Plaga 3
// ✅ Plaga 4
// ✅ Dosis baja
// ✅ Dosis alta
// ✅ Unidad
// ✅ Carencia
// ✅ Reingreso
//
//======================================================


//------------------------------------------------------
// CONFIGURACIÓN
//------------------------------------------------------

import {
    IA_CONFIG
} from "./config.js";


//------------------------------------------------------
// URL DE LA NETLIFY FUNCTION
//------------------------------------------------------

const FUNCTION_URL =
    IA_CONFIG.API_URL;


//------------------------------------------------------
// FUNCIÓN PRINCIPAL
//------------------------------------------------------

export async function analizarEtiqueta(
    file
) {

    if (
        !file
    ) {

        return error(
            "No se recibió ninguna imagen."
        );

    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        return error(
            "El archivo seleccionado no es una imagen."
        );

    }


    try {

        //--------------------------------------------------
        // CONVERTIR IMAGEN
        //--------------------------------------------------

        const base64 =
            await convertirImagen(
                file
            );


        //--------------------------------------------------
        // ENVIAR A NETLIFY
        //--------------------------------------------------

        const respuesta =
            await enviarACloudFunction(
                base64
            );


        //--------------------------------------------------
        // NORMALIZAR
        //--------------------------------------------------

        return normalizarRespuesta(
            respuesta
        );


    } catch (
        e
    ) {

        console.error(
            "Error en analizarEtiqueta():",
            e
        );


        return error(
            e?.message ||
            "Error desconocido al analizar la imagen."
        );

    }

}


//------------------------------------------------------
// CONVERTIR IMAGEN
//------------------------------------------------------

async function convertirImagen(
    file
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const reader =
                new FileReader();


            reader.onload = (
                event
            ) => {

                const img =
                    new Image();


                img.onload = () => {

                    const MAX_WIDTH =
                        1024;

                    const MAX_HEIGHT =
                        1024;


                    let width =
                        img.width;

                    let height =
                        img.height;


                    //--------------------------------------------------
                    // REDIMENSIONAR
                    //--------------------------------------------------

                    if (
                        width >
                        MAX_WIDTH ||
                        height >
                        MAX_HEIGHT
                    ) {

                        const factor =
                            Math.min(
                                MAX_WIDTH /
                                    width,

                                MAX_HEIGHT /
                                    height
                            );


                        width =
                            Math.round(
                                width *
                                factor
                            );


                        height =
                            Math.round(
                                height *
                                factor
                            );

                    }


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        width;

                    canvas.height =
                        height;


                    const ctx =
                        canvas.getContext(
                            "2d"
                        );


                    if (
                        !ctx
                    ) {

                        reject(
                            new Error(
                                "No se pudo crear el contexto de imagen."
                            )
                        );

                        return;

                    }


                    ctx.drawImage(
                        img,
                        0,
                        0,
                        width,
                        height
                    );


                    //--------------------------------------------------
                    // JPEG
                    //--------------------------------------------------

                    const dataUrl =
                        canvas.toDataURL(
                            "image/jpeg",
                            0.70
                        );


                    const partes =
                        dataUrl.split(
                            ","
                        );


                    if (
                        partes.length <
                        2
                    ) {

                        reject(
                            new Error(
                                "No se pudo convertir la imagen."
                            )
                        );

                        return;

                    }


                    resolve(
                        partes[1]
                    );

                };


                img.onerror = () => {

                    reject(
                        new Error(
                            "No se pudo cargar la imagen."
                        )
                    );

                };


                img.src =
                    event.target.result;

            };


            reader.onerror = () => {

                reject(
                    new Error(
                        "No se pudo leer el archivo de imagen."
                    )
                );

            };


            reader.readAsDataURL(
                file
            );

        }
    );

}


//------------------------------------------------------
// ENVIAR A NETLIFY FUNCTION
//------------------------------------------------------

async function enviarACloudFunction(
    base64
) {

    const response =
        await fetch(
            FUNCTION_URL,
            {

                method:
                    "POST",

                headers:
                {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        {

                            version:
                                IA_CONFIG.ENGINE_VERSION,

                            image:
                                base64

                        }
                    )

            }
        );


    //--------------------------------------------------
    // ERROR HTTP
    //--------------------------------------------------

    if (
        !response.ok
    ) {

        let detalle =
            "";


        try {

            detalle =
                await response.text();

        } catch (
            e
        ) {

            detalle =
                "Sin información adicional.";

        }


        console.error(
            "ERROR HTTP DEL SERVIDOR IA:",
            {

                status:
                    response.status,

                statusText:
                    response.statusText,

                detalle:
                    detalle

            }
        );


        throw new Error(
            `Servidor IA respondió ${response.status} ${response.statusText}. ${detalle}`
        );

    }


    //--------------------------------------------------
    // JSON
    //--------------------------------------------------

    try {

        return await response.json();

    } catch (
        e
    ) {

        throw new Error(
            "El servidor IA respondió pero no devolvió JSON válido."
        );

    }

}


//------------------------------------------------------
// NORMALIZAR RESPUESTA
//------------------------------------------------------

function normalizarRespuesta(
    json
) {

    const producto =
        crearProductoVacio();


    if (
        !json
    ) {

        return error(
            "La IA no devolvió información."
        );

    }


    //--------------------------------------------------
    // ESTADO
    //--------------------------------------------------

    producto.ok =
        json.ok !== false;


    producto.proveedor =
        json.proveedor ||
        IA_CONFIG.PROVIDER ||
        "OpenRouter";


    producto.modelo =
        json.modelo ||
        "";


    producto.confianza =
        Number(
            json.confianza ||
            90
        );


    producto.mensaje =
        json.mensaje ||
        "";


    //--------------------------------------------------
    // DATOS
    //--------------------------------------------------

    const datos =
        json.datos &&
        typeof json.datos ===
            "object"

            ? json.datos

            : json;


    //--------------------------------------------------
    // TIPO
    //--------------------------------------------------

    producto.datos.tipo_registro =
        datos.tipo_registro ||
        "quimico";


    //--------------------------------------------------
    // NOMBRE
    //--------------------------------------------------

    producto.datos.nombre =
        normalizarTexto(
            datos.nombre
        );


    //--------------------------------------------------
    // INGREDIENTE ACTIVO
    //--------------------------------------------------

    producto.datos.ingrediente_activo =
        normalizarTexto(
            datos.ingrediente_activo
        );


    //--------------------------------------------------
    // CONCENTRACIÓN
    //--------------------------------------------------

    producto.datos.concentracion =
        normalizarTexto(
            datos.concentracion
        );


    //--------------------------------------------------
    // FUNCIÓN
    //--------------------------------------------------

    producto.datos.funcion =
        limpiarArray(
            datos.funcion
        );


    //--------------------------------------------------
    // MODO DE ACCIÓN
    //--------------------------------------------------

    producto.datos.modo_accion =
        limpiarArray(
            datos.modo_accion
        );


    //--------------------------------------------------
    // IMPORTANTE
    //
    // Estos campos YA NO son proporcionados
    // por la IA.
    //
    //--------------------------------------------------

    producto.datos.plagas_objetivo =
        [];

    producto.datos.dosis =
        "";

    producto.datos.carencia =
        "";

    producto.datos.reentrada =
        "";


    return producto;

}


//------------------------------------------------------
// NORMALIZAR TEXTO
//------------------------------------------------------

function normalizarTexto(
    valor
) {

    if (
        typeof valor !==
            "string"
    ) {

        return "";

    }


    const texto =
        valor.trim();


    if (
        !texto
    ) {

        return "";

    }


    if (
        texto.toLowerCase() ===
        "no encontrado"
    ) {

        return "";

    }


    return texto;

}


//------------------------------------------------------
// LIMPIAR ARRAYS
//------------------------------------------------------

function limpiarArray(
    valor
) {

    if (
        !valor
    ) {

        return [];

    }


    if (
        Array.isArray(
            valor
        )
    ) {

        return valor
            .map(
                item =>
                    String(
                        item
                    ).trim()
            )
            .filter(
                Boolean
            );

    }


    return String(
        valor
    )
        .split(
            ","
        )
        .map(
            item =>
                item.trim()
        )
        .filter(
            Boolean
        );

}


//------------------------------------------------------
// CREAR PRODUCTO VACÍO
//------------------------------------------------------

function crearProductoVacio() {

    return {

        ok:
            false,

        proveedor:
            IA_CONFIG.PROVIDER ||
            "OpenRouter",

        modelo:
            "",

        confianza:
            0,

        mensaje:
            "",

        datos:
        {

            tipo_registro:
                "quimico",

            nombre:
                "",

            fabricante:
                "",

            registro:
                "",

            formulacion:
                "",

            concentracion:
                "",

            ingrediente_activo:
                "",

            grupo_quimico:
                "",

            funcion:
                [],

            modo_accion:
                [],

            plagas_objetivo:
                [],

            enfermedades:
                [],

            malezas:
                [],

            cultivos:
                [],

            dosis:
                "",

            unidad_dosis:
                "",

            carencia:
                "",

            reentrada:
                "",

            compatibilidad:
                "",

            observaciones:
                ""

        }

    };

}


//------------------------------------------------------
// ERROR ESTÁNDAR
//------------------------------------------------------

function error(
    mensaje
) {

    return {

        ok:
            false,

        proveedor:
            IA_CONFIG.PROVIDER ||
            "OpenRouter",

        modelo:
            "",

        confianza:
            0,

        mensaje:
            mensaje,

        datos:
            crearProductoVacio()
                .datos

    };

}
