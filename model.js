//======================================================
// BÍO IA
// model.js V4
//======================================================
//
// DATOS AUTOMÁTICOS DE LA IA:
//
// ✅ Nombre
// ✅ Ingrediente activo
// ✅ Concentración
// ✅ Modo de acción
// ✅ Función
//
// DATOS MANUALES DE LA APP:
//
// ✅ Plaga / Enfermedad 1
// ✅ Plaga / Enfermedad 2
// ✅ Plaga / Enfermedad 3
// ✅ Plaga / Enfermedad 4
// ✅ Dosis baja
// ✅ Dosis alta
// ✅ Unidad
// ✅ Carencia
// ✅ Reingreso
//
//======================================================

export function crearProductoVacio() {

    return {

        ok: false,

        proveedor: "",

        modelo: "",

        confianza: 0,

        mensaje: "",

        datos: {

            // ------------------------------------------
            // IDENTIFICACIÓN
            // ------------------------------------------

            tipo_registro:
                "quimico",

            nombre:
                "",

            ingrediente_activo:
                "",

            concentracion:
                "",


            // ------------------------------------------
            // CARACTERÍSTICAS TÉCNICAS
            // ------------------------------------------

            funcion:
                [],

            modo_accion:
                [],


            // ------------------------------------------
            // CAMPOS MANUALES
            // ------------------------------------------

            plaga_1:
                "",

            plaga_2:
                "",

            plaga_3:
                "",

            plaga_4:
                "",


            // ------------------------------------------
            // DOSIFICACIÓN
            // ------------------------------------------

            dosis:
                "",

            dosis_baja:
                "",

            dosis_alta:
                "",

            unidad_dosis:
                "",


            // ------------------------------------------
            // SEGURIDAD
            // ------------------------------------------

            carencia:
                "",

            reentrada:
                ""

        }

    };

}
