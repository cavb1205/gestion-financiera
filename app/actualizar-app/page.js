'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { FiArrowRight, FiCheck, FiDownload, FiExternalLink, FiHome, FiMoreVertical, FiShare, FiShield, FiSmartphone } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { installationPlatform, migrationContinuation, migrationDestination, requestPwaInstall } from '../utils/legacyMigration.mjs';

const ADDRESS = 'https://app.carterafinanciera.com';
const SERVER_BROWSER_STATE = '["","",0]';
const browserSnapshot = () => JSON.stringify([window.location.search, navigator.userAgent, navigator.maxTouchPoints || 0]);
const serverBrowserSnapshot = () => SERVER_BROWSER_STATE;
const subscribeBrowser = (changed) => {
  window.addEventListener('popstate', changed);
  window.addEventListener('pageshow', changed);
  return () => { window.removeEventListener('popstate', changed); window.removeEventListener('pageshow', changed); };
};

export default function ActualizarAppPage() {
  const { loading, isAuthenticated, user, selectedStore } = useAuth();
  const browser = useSyncExternalStore(subscribeBrowser, browserSnapshot, serverBrowserSnapshot);
  const [search, userAgent, touchPoints] = JSON.parse(browser);
  const destination = migrationDestination(new URLSearchParams(search).get('destino'));
  const platform = installationPlatform(userAgent, touchPoints);
  const [installEvent, setInstallEvent] = useState(null);
  const [installState, setInstallState] = useState('idle');

  useEffect(() => {
    const prepareInstall = (event) => {
      if (typeof event.prompt !== 'function') return;
      event.preventDefault();
      setInstallEvent(event);
    };
    const installed = () => { setInstallEvent(null); setInstallState('installed'); };
    window.addEventListener('beforeinstallprompt', prepareInstall);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', prepareInstall);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const continueTo = migrationContinuation({ isAuthenticated, user, selectedStore, destination });
  const install = async () => {
    const prompt = installEvent;
    setInstallEvent(null);
    setInstallState('opening');
    setInstallState(await requestPwaInstall(prompt));
  };
  const buttonStyle = 'inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600';

  return (
    <main className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-3 font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600" aria-label="Cartera Financiera, inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon.svg" width="36" height="36" alt="" />
          Cartera Financiera
        </Link>

        <div className="mt-10 grid items-start gap-8 sm:mt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <section aria-labelledby="migration-title">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Tu acceso actualizado</p>
            <h1 id="migration-title" className="max-w-xl text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl">Tu Cartera está en una nueva dirección.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300">Entra con tu usuario de siempre. Tus rutas, clientes y registros ya están disponibles.</p>

            <div className="my-7 rounded-2xl border border-indigo-200 bg-white p-5 dark:border-indigo-900 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"><FiShield aria-hidden="true" /> Dirección actual</div>
              <p className="break-all text-lg font-bold tracking-tight text-indigo-700 sm:text-xl dark:text-indigo-300">app.carterafinanciera.com</p>
            </div>

            {loading ? <button type="button" disabled className={`${buttonStyle} opacity-60`}>Preparando el acceso…</button> : <Link href={continueTo} className={buttonStyle}>Continuar a Cartera <FiArrowRight aria-hidden="true" /></Link>}
            <p className="mt-3 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">Si es tu primera entrada en esta dirección, inicia sesión y elige tu ruta.</p>

            <div className="mt-7 flex items-start gap-3 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-400"><FiCheck className="mt-1 shrink-0 text-emerald-600" aria-hidden="true" /><p>Los registros que ya guardaste se conservan. Termina de guardar cualquier formulario abierto en la versión anterior antes de cerrarlo.</p></div>
          </section>

          <section aria-labelledby="install-title" className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4 bg-indigo-950 px-6 py-6 text-white">
              <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-indigo-300/60"><FiSmartphone size={24} aria-hidden="true" /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">En tu teléfono</p><h2 id="install-title" className="mt-1 text-xl font-bold tracking-tight">Actualiza el icono de inicio</h2></div>
            </div>
            <div className="p-6">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">El icono anterior puede seguir abriendo esta pantalla. Instala el acceso de la nueva dirección para entrar directamente.</p>

              {installEvent && <button type="button" onClick={install} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 font-bold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"><FiDownload aria-hidden="true" /> Instalar nueva Cartera</button>}
              <p role="status" aria-live="polite" className="mt-3 text-sm leading-6 text-indigo-700 dark:text-indigo-300">
                {installState === 'opening' && 'Abriendo la instalación…'}
                {installState === 'accepted' && 'Instalación solicitada. Cuando aparezca el icono nuevo, ábrelo para comprobar el acceso.'}
                {installState === 'installed' && 'Se instaló el acceso nuevo. Ábrelo desde la pantalla de inicio.'}
                {installState === 'dismissed' && 'Puedes seguir trabajando e instalar el acceso después.'}
                {installState === 'manual' && 'Usa los pasos de tu navegador para añadir el acceso.'}
              </p>

              <ol className="mt-5 space-y-5 text-sm leading-6">
                <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">1</span><div><p className="font-bold">Abre la dirección nueva en tu navegador</p><p className="mt-1 text-slate-500 dark:text-slate-400">{platform === 'ios' ? 'En iPhone o iPad, usa Safari.' : platform === 'android' ? 'En Android, usa Chrome o el navegador donde instalas tus aplicaciones.' : 'Si abriste desde el icono anterior, utiliza Safari o Chrome para instalar el nuevo.'}</p><a href={`${ADDRESS}/actualizar-app`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-indigo-600 underline underline-offset-4 dark:text-indigo-400">Abrir la nueva dirección <FiExternalLink aria-hidden="true" /></a></div></li>
                <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">2</span><div><p className="font-bold">Añade Cartera a la pantalla de inicio</p><p className="mt-1 text-slate-500 dark:text-slate-400">{platform === 'ios' ? <>Toca <FiShare className="inline" aria-hidden="true" /> Compartir y luego «Añadir a pantalla de inicio».</> : platform === 'android' ? <>Abre el menú <FiMoreVertical className="inline" aria-hidden="true" /> y elige «Instalar aplicación» o «Añadir a pantalla de inicio».</> : 'En iPhone: Compartir → Añadir a pantalla de inicio. En Android: menú → Instalar aplicación o Añadir a pantalla de inicio.'}</p></div></li>
                <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">3</span><div><p className="font-bold">Comprueba el icono nuevo</p><p className="mt-1 text-slate-500 dark:text-slate-400">Ábrelo e inicia sesión. Cuando confirmes que funciona, puedes quitar el icono anterior.</p></div></li>
              </ol>
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-950 dark:text-slate-400"><FiHome className="shrink-0" size={18} aria-hidden="true" /><p>El teléfono no sustituye automáticamente el acceso de un dominio por el de otro.</p></div>
            </div>
          </section>
        </div>
        <footer className="mt-10 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">Cartera Financiera · <Link href="/guia-rapida" className="underline underline-offset-4 hover:text-indigo-600">Guía de uso</Link></footer>
      </div>
    </main>
  );
}
