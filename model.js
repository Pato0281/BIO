//======================================================
// BÍO IA v3.0
// model.js
//======================================================

export function crearProductoVacio() {

    return {

        ok: false,

        proveedor: "",

        modelo: "",

        confianza: 0,

        mensaje: "",

        datos: {

            tipo_registro: "quimico",

            nombre: "",

            fabricante: "",

            registro: "",

            formulacion: "",

            concentracion: "",

            ingrediente_activo: "",

            grupo_quimico: "",

            funcion: [],

            modo_accion: [],

            plagas_objetivo: [],

            enfermedades: [],

            malezas: [],

            cultivos: [],

            dosis: "",

            unidad_dosis: "",

            carencia: "",

            reentrada: "",

            compatibilidad: "",

            observaciones: ""

        }

    };

}