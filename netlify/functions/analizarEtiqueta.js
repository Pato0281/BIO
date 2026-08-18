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

        let imageBase64 = body.image || body.imageBase64;
        const promptOriginal = body.prompt || "";

        if (!imageBase64) {
            throw new Error("No se recibió ninguna imagen.");
        }

        // Si llega como data:image/jpeg;base64,...
        // eliminamos la cabecera.
        if (imageBase64.includes(",")) {
            imageBase64 = imageBase64.split(",")[1];
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
        // PROMPT PRINCIPAL
        // =========================================

        const prompt = `
Eres BIO IA, especialista en productos agrícolas y fitosanitarios utilizados en Chile.

Tu trabajo tiene DOS ETAPAS OBLIGATORIAS.

=========================================
ETAPA 1 — IDENTIFICAR EL PRODUCTO
=========================================

Analiza cuidadosamente la fotografía de la etiqueta.

Identifica, si es posible:

- nombre comercial
- ingrediente activo
- concentración
- formulación
- empresa o fabricante
- número de registro
- contenido

La fotografía sirve principalmente para IDENTIFICAR EL PRODUCTO.

=========================================
ETAPA 2 — INVESTIGAR EL PRODUCTO
=========================================

Una vez identificado el producto, NO te limites a copiar la información visible en la fotografía.

Debes investigar el producto mediante Google Search.

La prioridad de las fuentes es:

1. SAG Chile
2. Registro o documentación oficial SAG
3. Etiqueta oficial registrada en Chile
4. Ficha técnica oficial del fabricante
5. Documentación técnica confiable

Para productos fitosanitarios registrados en Chile, da prioridad absoluta a la información correspondiente al registro SAG chileno.

IMPORTANTE:

Busca el producto por:

- nombre comercial
- ingrediente activo
- número de registro SAG, si fue identificado
- fabricante

=========================================
DATOS QUE DEBES INVESTIGAR
=========================================

Debes intentar completar TODOS estos campos:

- dosis
- unidad de dosis
- mojamiento o volumen de agua
- cultivos autorizados
- plagas objetivo
- enfermedades
- malezas
- modo de acción
- días de carencia
- horas de reentrada
- compatibilidad
- observaciones

=========================================
DOSIS Y MOJAMIENTO
=========================================

Este punto es MUY IMPORTANTE.

Busca específicamente las tablas de uso o aplicación.

Debes buscar:

- cultivo
- plaga
- dosis
- unidad de dosis
- volumen de agua
- mojamiento
- número de aplicaciones
- intervalo entre aplicaciones

NO entregues una dosis genérica si existen diferentes dosis dependiendo del cultivo o plaga.

Si existen varias combinaciones de cultivo y plaga, conserva TODAS las combinaciones relevantes.

Ejemplo:

Cultivo A:
Plaga X:
Dosis: ...
Mojamiento: ...

Cultivo B:
Plaga Y:
Dosis: ...
Mojamiento: ...

=========================================
MODO DE ACCIÓN
=========================================

Busca el modo de acción oficial.

Si corresponde, incluye:

- mecanismo de acción
- grupo IRAC
- grupo FRAC
- grupo HRAC
- otra clasificación oficial

No inventes clasificaciones.

=========================================
CARENCIA
=========================================

Busca específicamente el período de carencia.

Si existen diferentes períodos según cultivo, conserva cada uno.

Ejemplo:

Cultivo A: 7 días
Cultivo B: 14 días

=========================================
REENTRADA
=========================================

Busca específicamente el período de reentrada o reingreso.

No confundas:

- carencia
- reentrada

Son datos diferentes.

=========================================
REGLA FUNDAMENTAL
=========================================

NO INVENTES NINGÚN DATO.

Si después de realizar la búsqueda no encuentras un dato confiable, escribe exactamente:

"No encontrado"

No dejes el campo vacío cuando exista información confiable disponible.

Si existen diferencias entre fuentes, prioriza la información oficial chilena asociada al registro SAG.

=========================================
RESULTADO
=========================================

Devuelve EXCLUSIVAMENTE un JSON válido.

NO escribas:

- Markdown
- explicaciones
- comentarios
- texto antes del JSON
- texto después del JSON
- bloques de código

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

Si existen varias dosis, cultivos, plagas, carencias o mojamiento, conserva toda la información relevante dentro de los campos correspondientes.

=========================================
INFORMACIÓN ADICIONAL DE LA APLICACIÓN
=========================================

${promptOriginal}
`;

        // =========================================
        // LOG
        // =========================================

        console.log("=================================");
        console.log("ANALIZANDO ETIQUETA");
        console.log("Modelo:", model);
        console.log("Google Search: ACTIVADO");
        console.log("Imagen recibida: SI");
        console.log("Fuente prioritaria: SAG Chile");
        console.log("=================================");

        // =========================================
        // GEMINI + GOOGLE SEARCH
        // =========================================

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

                tools: [
                    {
                        googleSearch: {}
                    }
                ],

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
        // CONVERTIR A JSON
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
        // RESPUESTA
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
        // ERROR
        // =========================================

        console.error(
            "ERROR EN analizarEtiqueta:",
            error
        );

        let mensaje = error.message || "Error desconocido.";

        if (error.status === 429) {
            mensaje =
                "Se alcanzó el límite de uso de Gemini. Espera unos minutos o revisa la cuota de la API.";
        }

        return {

            statusCode: 500,

            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            },

            body: JSON.stringify({

                ok: false,

                mensaje: mensaje,

                proveedor: "Google Gemini",

                modelo: model

            })
        };
    }
};
