//======================================================
// BÍO IA
// model.js V4
//======================================================

export function crearProductoVacio() {

    return {

        ok: false,

        proveedor: "",

        modelo: "",

        confianza: 0,

        mensaje: "",

        datos: {

            tipo_registro:
                "quimico",

            // IA
            nombre:
                "",

            ingrediente_activo:
                "",

            concentracion:
                "",

            funcion:
                [],

            modo_accion:
                [],


            // Usuario
            plagas_objetivo:
                [],

            dosis_baja:
                "",

            dosis_alta:
                "",

            unidad_dosis:
                "",

            carencia:
                "",

            reentrada:
                ""

        }

    };

}
