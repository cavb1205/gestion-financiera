// Se ejecuta desde recorrido-browser.cjs contra API/SQLite locales y datos ficticios.
const assert = require('node:assert/strict');

exports.probarArrastre = async function probarArrastre(page, mobile, {guardar = false} = {}) {
  const dialog = page.getByRole('dialog', {name:'Organizar recorrido',exact:true});
  const abrir = async () => {
    await page.getByRole('button', {name:'Organizar recorrido',exact:true}).click();
    await dialog.getByLabel('Buscar cliente o dirección').waitFor();
  };
  const filas = () => dialog.locator('[data-recorrido-cliente]');
  const orden = () => filas().evaluateAll(elements => elements.map(e=>Number(e.dataset.recorridoCliente)));
  const scroll = dialog.locator('[data-recorrido-scroll]');
  const cdp = mobile ? await page.context().newCDPSession(page) : null;
  const enviar = async (tipo,x,y) => {
    if (cdp) await cdp.send('Input.dispatchTouchEvent', {
      type: {down:'touchStart',move:'touchMove',up:'touchEnd',cancel:'touchCancel'}[tipo],
      touchPoints: tipo==='up'||tipo==='cancel' ? [] : [{x,y,id:1}],
    });
    else if (tipo==='down') { await page.mouse.move(x,y); await page.mouse.down(); }
    else if (tipo==='move') await page.mouse.move(x,y,{steps:6});
    else await page.mouse.up();
  };
  const comenzar = async id => {
    const asa = dialog.locator(`[data-recorrido-cliente="${id}"]`).getByRole('button',{name:/Arrastrar a/});
    await asa.scrollIntoViewIfNeeded();
    const b = await asa.boundingBox();
    const punto = {x:b.x+b.width/2,y:b.y+b.height/2};
    await enviar('down',punto.x,punto.y);
    return punto;
  };
  const destino = async (id,lado) => {
    const b = await dialog.locator(`[data-recorrido-cliente="${id}"]`).boundingBox();
    const area = await scroll.boundingBox();
    const y = lado==='antes' ? Math.max(b.y+8,Math.min(b.y+b.height/2-8,area.y+area.height-10))
      : Math.min(b.y+b.height-8,Math.max(b.y+b.height/2+8,area.y+10));
    assert(y>area.y && y<area.y+area.height,'El destino de prueba debe estar visible');
    return {x:b.x+25,y};
  };
  try {
    await abrir();
    await dialog.getByLabel('Buscar cliente o dirección').fill('Cliente 0');
    const original = await orden();
    const [primero,segundo] = original;
    const punto = await comenzar(segundo);
    await enviar('up',punto.x,punto.y);
    assert.deepEqual(await orden(),original,'Un clic/toque no mueve');

    // Movimiento antes, indicadores visuales y borrador únicamente.
    await comenzar(segundo);
    const antes = await destino(primero,'antes');
    await enviar('move',antes.x,antes.y);
    await dialog.locator(`[data-recorrido-cliente="${primero}"][data-arrastre-destino="antes"]`).waitFor();
    assert(await dialog.getByRole('button',{name:'Guardar cambios',exact:true}).isDisabled());
    if (process.env.RECORRIDO_SCREENSHOT) await page.screenshot({path:process.env.RECORRIDO_SCREENSHOT+(mobile?'-arrastre-mobile.png':'-arrastre-desktop.png')});
    await enviar('up',antes.x,antes.y);
    assert.deepEqual((await orden()).slice(0,2),[segundo,primero]);

    // Soltar después regresa al orden original (dos sentidos).
    await comenzar(segundo);
    const despues = await destino(primero,'despues');
    await enviar('move',despues.x,despues.y);
    await dialog.locator(`[data-recorrido-cliente="${primero}"][data-arrastre-destino="despues"]`).waitFor();
    await enviar('up',despues.x,despues.y);
    assert.deepEqual(await orden(),original);

    // Escape cancela solo el gesto, no cierra el diálogo.
    await comenzar(segundo);
    const p = await destino(primero,'antes');
    await enviar('move',p.x,p.y);
    await dialog.locator('[data-arrastre-destino]').waitFor();
    await page.keyboard.press('Escape');
    await enviar('up',p.x,p.y);
    assert(await dialog.isVisible()); assert.deepEqual(await orden(),original);
    assert.equal(await dialog.locator('[data-arrastre-destino]').count(),0);

    // No se aceptan drops sobre footer/fuera de la lista.
    await comenzar(segundo);
    const cancelar = await dialog.getByRole('button',{name:'Cancelar',exact:true}).boundingBox();
    await enviar('move',cancelar.x+5,cancelar.y+5);
    await enviar('up',cancelar.x+5,cancelar.y+5);
    assert.deepEqual(await orden(),original);

    // La cancelación del dispositivo tampoco cambia el borrador.
    const inicio = await comenzar(segundo);
    await enviar('move',inicio.x+10,inicio.y);
    if (cdp) await enviar('cancel',0,0);
    else await page.evaluate(() => {
      const asa=document.activeElement;
      asa.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1}));
    });
    if (!cdp) await enviar('up',inicio.x+10,inicio.y);
    assert.deepEqual(await orden(),original);
    assert.equal(await dialog.locator('[data-arrastre-destino]').count(),0);

    // Cambiar de ventana cancela y libera la captura del puntero.
    const b = await comenzar(segundo);
    await enviar('move',b.x+10,b.y);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await enviar('up',b.x+10,b.y);
    assert.deepEqual(await orden(),original);
    assert.equal(await dialog.locator('[data-arrastre-destino]').count(),0);

    // Teclado y botones siguen disponibles.
    const asa = dialog.locator(`[data-recorrido-cliente="${segundo}"]`).getByRole('button',{name:/Arrastrar a/});
    await asa.focus(); await page.keyboard.press('ArrowUp');
    assert.deepEqual((await orden()).slice(0,2),[segundo,primero]);
    assert(await asa.evaluate(el=>el===document.activeElement),'Conserva el foco tras mover con teclado');
    await page.keyboard.press('ArrowDown');
    assert.deepEqual(await orden(),original);

    // Buscar conserva el recorrido completo; solo se mueve el origen.
    await dialog.getByLabel('Buscar cliente o dirección').fill('Sector 1');
    const filtrado = await orden();
    await comenzar(filtrado[1]);
    const f = await destino(filtrado[0],'antes');
    await enviar('move',f.x,f.y);
    await dialog.locator(`[data-recorrido-cliente="${filtrado[0]}"][data-arrastre-destino="antes"]`).waitFor();
    await enviar('up',f.x,f.y);
    assert.deepEqual((await orden()).slice(0,2),[filtrado[1],filtrado[0]]);
    await dialog.getByLabel('Buscar cliente o dirección').fill('');
    assert.equal(await filas().count(),25,'No pierde clientes ocultos ni cambia el límite');
    await dialog.getByRole('button',{name:/Mostrar 25 más/}).click();
    assert.equal(await filas().count(),50);

    // Desplazamiento automático mientras se mantiene el puntero en el borde.
    await scroll.evaluate(el=>{el.scrollTop=0;});
    const id = Number(await filas().first().getAttribute('data-recorrido-cliente'));
    await comenzar(id);
    const area = await scroll.boundingBox();
    const posicion = await scroll.evaluate(el=>el.scrollTop);
    await enviar('move',area.x+35,area.y+area.height-10);
    await page.waitForFunction(({posicion})=>document.querySelector('[data-recorrido-scroll]').scrollTop>posicion+120,{posicion});
    await page.keyboard.press('Escape');
    await enviar('up',area.x+35,area.y+area.height-10);
    assert.equal(await dialog.locator('[data-arrastre-destino]').count(),0);
    if (cdp) {
      // Deslizar sobre el texto, sin asa, desplaza y no reordena.
      await scroll.evaluate(el=>{el.scrollTop=350;});
      const area = await scroll.boundingBox(), anterior = await scroll.evaluate(el=>el.scrollTop);
      await enviar('down',area.x+170,area.y+area.height-55);
      for(let i=1;i<=5;i++) await enviar('move',area.x+170,area.y+area.height-55-i*24);
      await enviar('up',area.x+170,area.y+area.height-175);
      await page.waitForFunction(anterior=>document.querySelector('[data-recorrido-scroll]').scrollTop>anterior,anterior);
      assert.equal(await dialog.locator('[data-arrastre-destino]').count(),0);
    }
    assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth),false);
    await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
    await abrir();
    await dialog.getByLabel('Buscar cliente o dirección').fill('Cliente 0');
    assert.deepEqual(await orden(),original,'Cancelar descarta todos los movimientos');
    if (guardar) {
      await comenzar(segundo);
      const p = await destino(primero,'antes');
      await enviar('move',p.x,p.y);
      await dialog.locator(`[data-recorrido-cliente="${primero}"][data-arrastre-destino="antes"]`).waitFor();
      await enviar('up',p.x,p.y);
      const nuevo = await orden();
      await dialog.getByRole('button',{name:'Guardar cambios',exact:true}).click();
      await dialog.waitFor({state:'hidden'});
      await page.reload(); await abrir();
      await dialog.getByLabel('Buscar cliente o dirección').fill('Cliente 0');
      assert.deepEqual(await orden(),nuevo,'El arrastre guardado persiste después de recargar');
    }
    await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
    console.log(JSON.stringify({arrastre:mobile?'touch':'mouse',cancelar:true,filtro:true,teclado:true,autoscroll:true}));
  } finally { await cdp?.detach(); }
};
