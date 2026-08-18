//======================================================
// BÍO IA ENGINE V3
// ia.js
// Parte 1
//======================================================

import { IA_CONFIG } from "./config.js";
import { PROMPT, PROMPT_VERSION } from "./prompt.js";
import { crearProductoVacio } from "./model.js";

//------------------------------------------------------
// URL de tu Cloud Function
// (se reemplazará cuando la creemos)
//------------------------------------------------------

const FUNCTION_URL = IA_CONFIG.API_URL;

//------------------------------------------------------
// Función principal
//------------------------------------------------------

export async function analizarEtiqueta(file) {

    if (!file) {
        return error("No se recibió ninguna imagen.");
    }

    if (!file.type.startsWith("image/")) {
        return error("El archivo seleccionado no es una imagen.");
    }

    try {

        const base64 = await convertirImagen(file);

        const respuesta = await enviarACloudFunction(base64);

        return normalizarRespuesta(respuesta);

    } catch (e) {

        console.error(e);

        return error(e.message);

    }

}

//------------------------------------------------------
// Conversión Base64
//------------------------------------------------------

async function convertirImagen(file){

    return new Promise((resolve,reject)=>{

        const reader=new FileReader();

        reader.readAsDataURL(file);

        reader.onload=(event)=>{

            const img=new Image();

            img.src=event.target.result;

            img.onload=()=>{

                const canvas=document.createElement("canvas");

                const MAX_WIDTH=1024;
                const MAX_HEIGHT=1024;

                let width=img.width;
                let height=img.height;

                if(width>height){

                    if(width>MAX_WIDTH){

                        height*=MAX_WIDTH/width;
                        width=MAX_WIDTH;

                    }

                }else{

                    if(height>MAX_HEIGHT){

                        width*=MAX_HEIGHT/height;
                        height=MAX_HEIGHT;

                    }

                }

                canvas.width=width;
                canvas.height=height;

                const ctx=canvas.getContext("2d");

                ctx.drawImage(img,0,0,width,height);

                const dataUrl=canvas.toDataURL(
                    "image/jpeg",
                    0.70
                );

                resolve(
                    dataUrl.split(",")[1]
                );

            };

            img.onerror=reject;

        };

        reader.onerror=reject;

    });

}

//------------------------------------------------------
// Enviar a Firebase Function
//------------------------------------------------------

async function enviarACloudFunction(base64){

    const response=await fetch(

        FUNCTION_URL,

        {

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                version:IA_CONFIG.ENGINE_VERSION,

                promptVersion:PROMPT_VERSION,

                prompt:PROMPT,

                image:base64

            })

        }

    );

   if (!response.ok) {

    let detalle = "";

    try {
        detalle = await response.text();
    } catch (e) {
        detalle = "Sin información adicional.";
    }

    console.error("ERROR HTTP DEL SERVIDOR IA:", {
        status: response.status,
        statusText: response.statusText,
        detalle: detalle
    });

    throw new Error(
        `Servidor IA respondió ${response.status} ${response.statusText}. ${detalle}`
    );
}
    return await response.json();

}
//------------------------------------------------------
// Normalizar Respuesta
//------------------------------------------------------

function normalizarRespuesta(json) {

    const producto = crearProductoVacio();

    if (!json) {
        return error("La IA no devolvió información.");
    }

    producto.ok = true;

    producto.proveedor = json.proveedor || IA_CONFIG.PROVIDER;

    producto.modelo = json.modelo || "";

    producto.confianza = json.confianza || 90;

    if (json.datos) {

        producto.datos.nombre =
            json.datos.nombre || "";

        producto.datos.fabricante =
            json.datos.fabricante || "";

        producto.datos.registro =
            json.datos.registro || "";

        producto.datos.formulacion =
            json.datos.formulacion || "";

        producto.datos.concentracion =
            json.datos.concentracion || "";

        producto.datos.tipo_registro =
            json.datos.tipo_registro || "quimico";

        producto.datos.ingrediente_activo =
            json.datos.ingrediente_activo || "";

        producto.datos.grupo_quimico =
            json.datos.grupo_quimico || "";

        producto.datos.funcion =
            limpiarArray(json.datos.funcion);

        producto.datos.modo_accion =
            limpiarArray(json.datos.modo_accion);

        producto.datos.plagas_objetivo =
            limpiarArray(json.datos.plagas_objetivo);

        producto.datos.dosis =
            json.datos.dosis || "";

        producto.datos.carencia =
            json.datos.carencia || "";

        producto.datos.reentrada =
            json.datos.reentrada || "";

        producto.datos.observaciones =
            json.datos.observaciones || "";

    }

    else {

        producto.datos.nombre =
            json.nombre || "";

        producto.datos.fabricante =
            json.fabricante || "";

        producto.datos.registro =
            json.registro || "";

        producto.datos.formulacion =
            json.formulacion || "";

        producto.datos.concentracion =
            json.concentracion || "";

        producto.datos.tipo_registro =
            json.tipo_registro || "quimico";

        producto.datos.ingrediente_activo =
            json.ingrediente_activo || "";

        producto.datos.grupo_quimico =
            json.grupo_quimico || "";

        producto.datos.funcion =
            limpiarArray(json.funcion);

        producto.datos.modo_accion =
            limpiarArray(json.modo_accion);

        producto.datos.plagas_objetivo =
            limpiarArray(json.plagas_objetivo);

        producto.datos.dosis =
            json.dosis || "";

        producto.datos.carencia =
            json.carencia || "";

        producto.datos.reentrada =
            json.reentrada || "";

        producto.datos.observaciones =
            json.observaciones || "";

    }

    return producto;

}

//------------------------------------------------------
// Limpiar Arrays
//------------------------------------------------------

function limpiarArray(valor){

    if(!valor)
        return [];

    if(Array.isArray(valor))
        return valor;

    return String(valor)
        .split(",")
        .map(v=>v.trim())
        .filter(v=>v!="");

}

//------------------------------------------------------
// Error estándar
//------------------------------------------------------

function error(mensaje){

    return{

        ok:false,

        proveedor:IA_CONFIG.PROVIDER,

        modelo:"",

        confianza:0,

        mensaje,

        datos:crearProductoVacio().datos

    };

}
