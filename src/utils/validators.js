'use strict';

/**
 * Validadores reutilizables para los flujos conversacionales.
 * Cada función retorna { ok: boolean, error?: string }.
 */

const isNonEmpty = (text) => typeof text === 'string' && text.trim().length > 0;

const validators = {
  nombre(value) {
    if (!isNonEmpty(value) || value.trim().length < 3) {
      return { ok: false, error: 'Por favor, escribe el nombre completo (mínimo 3 caracteres).' };
    }
    return { ok: true };
  },

  telefono(value) {
    const clean = (value || '').replace(/\s|-/g, '');
    if (!/^\+?\d{7,15}$/.test(clean)) {
      return { ok: false, error: 'El teléfono no es válido. Escríbelo solo con números (7 a 15 dígitos).' };
    }
    return { ok: true, value: clean };
  },

  fecha(value) {
    // Aceptamos formato libre, solo validamos longitud mínima.
    if (!isNonEmpty(value) || value.trim().length < 4) {
      return { ok: false, error: 'Escribe la fecha. Ejemplo: 25 de diciembre de 2026, 8:00 a. m.' };
    }
    return { ok: true };
  },

  anio(value) {
    const clean = (value || '').trim();
    const match = clean.match(/\b(19|20)\d{2}\b/);
    if (!match) {
      return { ok: false, error: 'Escribe el *año* en 4 dígitos. Ejemplo: 2010.' };
    }
    const year = parseInt(match[0], 10);
    const maxYear = new Date().getFullYear() + 1;
    if (year < 1900 || year > maxYear) {
      return { ok: false, error: `El año debe estar entre 1900 y ${maxYear}.` };
    }
    return { ok: true, value: String(year) };
  },

  texto(value) {
    if (!isNonEmpty(value)) {
      return { ok: false, error: 'No recibí texto. Intenta de nuevo, por favor.' };
    }
    return { ok: true };
  },
};

module.exports = validators;
