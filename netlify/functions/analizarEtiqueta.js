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
        const promptOriginal = body.prompt || "";

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

        // =========================================
        // INSTRUCCIÓN PARA BIO IA
        // =========================================

        const prompt = `
Eres BIO IA, un asistente especializado en productos
fitosanitarios agrícolas utilizados en Chile.

Tu trabajo tiene DOS ETAPAS:

ETAPA 1 — IDENTIFICAR EL PRODUCTO
Analiza la fotografía y determina con la mayor precisión posible:

- nombre comercial
- ingrediente activo
- concentración
- formulación
- empresa/fabricante
- número de registro
- contenido

ETAPA 2 — INVESTIGAR Y COMPLETAR LA INFORMACIÓN

Una vez identificado el producto, utiliza Google Search para
buscar información técnica y regulatoria actualizada.

PARA PRODUCTOS FITOSANITARIOS EN CHILE:

1. PRIORIDAD MÁXIMA:
   Servicio Agrícola y Ganadero (SAG) de Chile.

2. Busca preferentemente:
   - etiqueta oficial SAG
   - registro SAG
   - documentación oficial del producto
   - ficha técnica oficial del fabricante

3. Como segunda fuente puedes utilizar:
   - fabricante
   - distribuidor oficial
   - documentación técnica reconocida

4. NO utilices una página comercial como fuente principal
   si existe información oficial del SAG.

5. Si existen diferencias entre fuentes, prioriza la
   información oficial chilena correspondiente al registro
   del producto.

INFORMACIÓN QUE DEBES INTENTAR COMPLETAR:

- dosis
- mojamiento / volumen de agua
- modo de acción
- días de carencia
- horas de reentrada
- cultivos autorizados
- plagas objetivo
- enfermedades
- malezas
- compatibilidad
- observaciones

MUY IMPORTANTE:

NO INVENTES NINGÚN DATO.

Si una información no aparece en la etiqueta oficial,
registro SAG o fuente técnica confiable, escribe:

"No encontrado"

Para DOSIS y MOJAMIENTO debes buscar específicamente
las tablas de aplicación del producto, incluyendo:

- cultivo
- plaga
- dosis
- volumen de agua / mojamiento
- número de aplicaciones
- intervalo entre aplicaciones

Para CARENCIA debes buscar específicamente el período
de carencia indicado para cada cultivo.

Para REENTRADA debes buscar específicamente el período
de reingreso o reentrada indicado en la etiqueta.

Para MODO DE ACCIÓN debes identificar el mecanismo o grupo
de acción indicado oficialmente. Si existe una clasificación
IRAC, FRAC, HRAC u otra, inclúyela cuando esté respaldada
por una fuente confiable.

IMPORTANTE SOBRE DOSIS:

NO entregues una dosis genérica si la etiqueta establece
diferentes dosis según cultivo o plaga.

En ese caso conserva la información diferenciada.

El resultado debe ser exclusivamente un JSON válido,
sin Markdown, sin ```json y sin explicaciones fuera del JSON.

La estructura obligatoria es:

{
  "tipo_registro": "",
  "nombre": "",
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
  "empresa": "",
  "registro": "",
  "contenido": "",
  "compatibilidad": "",
  "observaciones": ""
}

Si hay varias dosis, cultivos o plagas,
mantén toda la información relevante dentro
de los campos correspondientes.

INFORMACIÓN ADICIONAL PROPORCIONADA POR LA APLICACIÓN:

${promptOriginal}
`;

        // =========================================
        // ENVIAR IMAGEN + BÚSQUEDA WEB A GEMINI
        // =========================================

        console.log("=================================");
        console.log("ANALIZANDO ETIQUETA");
        console.log("Modelo:", model);
        console.log("Google Search: ACTIVADO");
        console.log("Imagen recibida: SI");
        console.log("Fuente prioritaria: SAG Chile");
        console.log("=================================");

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

            config: {

                // =====================================
                // BÚSQUEDA WEB
                // =====================================

                tools: [
                    {
                        googleSearch: {}
                    }
                ],

                // =====================================
                // RESPUESTA JSON
                // =====================================

                responseMimeType: "application/json"
            }
        });

        // =========================================
        // OBTENER RESPUESTA
        // =========================================

        const texto = result.text;

        if (!texto) {
            throw new Error(
                "Gemini no devolvió ninguna respuesta."
            );
        }

        console.log(
            "Respuesta recibida desde Gemini."
        );

        console.log(
            "Respuesta Gemini:",
            texto
        );

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
                "Gemini no devolvió un JSON válido."
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

        console.log(
            "JSON convertido correctamente."
        );

        console.log(
            "Datos:",
            JSON.stringify(datos)
        );

        // =========================================
        // RESPUESTA PARA IA.JS
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
