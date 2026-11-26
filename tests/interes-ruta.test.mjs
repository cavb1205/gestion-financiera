import test from "node:test";
import assert from "node:assert/strict";
import {
  camposDeclaracionInteres,
  interesInicialCredito,
  rutaConInteresDefecto,
  validarDeclaracionInteres,
  validarInteresDefecto,
} from "../app/utils/interesRuta.mjs";

test("la tasa es obligatoria, entera y entre 0 y 100", () => {
  for (const valor of ["", "  ", null, undefined]) {
    assert.match(validarInteresDefecto(valor), /Indica/);
  }
  for (const valor of ["12.5", "-1", "abc", "1e2"]) {
    assert.match(validarInteresDefecto(valor), /entero/);
  }
  assert.match(validarInteresDefecto("101"), /entre 0 y 100/);
  for (const valor of ["0", "20", " 100 ", 5]) {
    assert.equal(validarInteresDefecto(valor), "");
  }
});

test("crear la ruta exige aceptar la responsabilidad", () => {
  assert.match(validarDeclaracionInteres("20", false), /responsabilidad/);
  assert.match(validarDeclaracionInteres("", true), /Indica/);
  assert.equal(validarDeclaracionInteres("20", true), "");
  assert.deepEqual(camposDeclaracionInteres(" 15 "), {
    interes_defecto: 15,
    acepta_responsabilidad_interes: true,
  });
});

test("los créditos parten de la tasa de la ruta o del 20 % histórico", () => {
  assert.equal(interesInicialCredito({ interes_defecto: 0 }), 0);
  assert.equal(interesInicialCredito({ interes_defecto: 12 }), 12);
  assert.equal(interesInicialCredito({ interes_defecto: null }), 20);
  assert.equal(interesInicialCredito(undefined), 20);
  assert.equal(rutaConInteresDefecto({ interes_defecto: 0 }), true);
  assert.equal(rutaConInteresDefecto({ interes_defecto: null }), false);
});
