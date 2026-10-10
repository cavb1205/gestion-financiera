"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { destinoArrastre, velocidadArrastre } from '@/app/utils/arrastreRecorrido';

// El asa captura el puntero. El resto de la tarjeta conserva el scroll táctil.
// Solo soltar en una fila válida modifica el borrador; nunca se llama a la API.
export default function useArrastreRecorrido({ habilitado, scrollRef, listaRef, onDrop, onCancel }) {
  const [arrastre, setArrastre] = useState(null);
  const sesion = useRef(null);
  const frame = useRef(null);

  const limpiar = useCallback(() => {
    const actual = sesion.current;
    sesion.current = null;
    cancelAnimationFrame(frame.current);
    frame.current = null;
    if (actual?.asa.hasPointerCapture(actual.pointerId)) actual.asa.releasePointerCapture(actual.pointerId);
    return actual;
  }, []);

  const cancelar = useCallback(() => {
    const actual = limpiar();
    if (!actual) return false;
    setArrastre(null);
    if (actual.activado) actual.onCancel();
    return true;
  }, [limpiar]);

  useEffect(() => {
    if (!habilitado) cancelar();
  }, [habilitado, cancelar]);

  useEffect(() => {
    const escape = e => {
      if (e.key === 'Escape' && cancelar()) {
        e.preventDefault(); e.stopPropagation();
      }
    };
    document.addEventListener('keydown', escape, true);
    window.addEventListener('blur', cancelar);
    return () => {
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('blur', cancelar);
      limpiar();
    };
  }, [cancelar, limpiar]);

  const calcular = actual => {
    const scroll = scrollRef.current, lista = listaRef.current;
    if (!scroll || !lista) return null;
    const area = scroll.getBoundingClientRect(), limites = lista.getBoundingClientRect();
    const filas = Array.from(lista.children, fila => {
      const rect = fila.getBoundingClientRect();
      return { id: Number(fila.dataset.recorridoCliente), top: rect.top, bottom: rect.bottom };
    });
    return destinoArrastre(filas, {
      left: limites.left, right: limites.right, top: area.top, bottom: area.bottom,
    }, actual.x, actual.y, actual.id);
  };

  const iniciar = (e, id) => {
    if (!habilitado || sesion.current || !e.isPrimary || e.button !== 0) return;
    const asa = e.currentTarget;
    asa.setPointerCapture(e.pointerId);
    sesion.current = { id, asa, pointerId: e.pointerId, inicioX: e.clientX, inicioY: e.clientY,
      x: e.clientX, y: e.clientY, activado: false, onDrop, onCancel };
  };

  const actualizar = e => {
    const actual = sesion.current;
    if (!actual || e.pointerId !== actual.pointerId) return;
    actual.x = e.clientX; actual.y = e.clientY;
    if (!actual.activado && Math.hypot(actual.x - actual.inicioX, actual.y - actual.inicioY) < 6) return;
    e.preventDefault();
    actual.activado = true;
    if (frame.current !== null) return;
    let anterior;
    const dibujar = tiempo => {
      if (sesion.current !== actual) return;
      const scroll = scrollRef.current;
      if (scroll) {
        const dt = anterior === undefined ? 0 : Math.min(50, tiempo - anterior) / 1000;
        scroll.scrollTop += velocidadArrastre(scroll.getBoundingClientRect(), actual.x, actual.y) * dt;
      }
      anterior = tiempo;
      const destino = calcular(actual);
      setArrastre(prev => {
        const siguiente = { id: actual.id, x: actual.x, y: actual.y, ...destino };
        return prev?.id === siguiente.id && prev.x === siguiente.x && prev.y === siguiente.y &&
          prev.destinoId === siguiente.destinoId && prev.ubicacion === siguiente.ubicacion ? prev : siguiente;
      });
      frame.current = requestAnimationFrame(dibujar);
    };
    frame.current = requestAnimationFrame(dibujar);
  };

  const soltar = e => {
    const actual = sesion.current;
    if (!actual || e.pointerId !== actual.pointerId) return;
    actual.x = e.clientX; actual.y = e.clientY;
    const destino = actual.activado ? calcular(actual) : null;
    limpiar(); setArrastre(null);
    if (destino) actual.onDrop(actual.id, destino.ubicacion, destino.destinoId);
    else if (actual.activado) actual.onCancel();
  };

  const interrumpir = e => {
    if (sesion.current?.pointerId === e.pointerId) cancelar();
  };

  return { arrastre, iniciar, actualizar, soltar, cancelar, interrumpir };
}
