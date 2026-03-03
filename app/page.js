"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  FiArrowRight, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiUsers, 
  FiShield, 
  FiSmartphone, 
  FiPieChart,
  FiActivity,
  FiZap,
  FiGlobe,
  FiLock,
  FiCpu,
  FiArrowUpRight
} from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/10 blur-[150px] rounded-full animate-pulse opacity-50" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navbar Section */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-2xl bg-slate-950/60 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="bg-emerald-600 p-2.5 rounded-[1.2rem] group-hover:rotate-[15deg] transition-all duration-500 shadow-2xl shadow-emerald-900/40">
              <FiActivity className="text-white text-2xl" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-black tracking-tighter uppercase leading-none">
                MONEY<span className="text-emerald-500">CORE</span>
              </span>
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em]">Integrated Financial Suite</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
             <a href="#tecnologia" className="hover:text-white transition-colors py-2 relative group italic">
               Tecnología
               <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-emerald-500 group-hover:w-full transition-all"></span>
             </a>
             <a href="#ecosistema" className="hover:text-white transition-colors py-2 relative group italic">
               Ecosistema
               <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-emerald-500 group-hover:w-full transition-all"></span>
             </a>
             <a href="#auditoria" className="hover:text-white transition-colors py-2 relative group italic">
               Seguridad
               <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-emerald-500 group-hover:w-full transition-all"></span>
             </a>
          </div>

          <div className="flex items-center gap-5">
            <Link 
              href="/login" 
              className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors px-4"
            >
              Auth
            </Link>
            <Link 
              href="/login"
              className="px-8 py-4 bg-emerald-600 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/40 hover:scale-[1.05] active:scale-95 flex items-center gap-3 group"
            >
              Acceso Total
              <FiArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative pt-48 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-12 xl:col-span-6 relative z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-10 backdrop-blur-md">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Red Global de Transacciones Activa</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.85] mb-10 uppercase italic">
                 EVOLUCIÓN <br />
                 <span className="text-emerald-500 not-italic uppercase underline decoration-emerald-800 decoration-8 underline-offset-8">FINANCIERA</span>
              </h1>
              
              <p className="max-w-xl mx-auto lg:mx-0 text-slate-400 text-xl font-medium leading-relaxed mb-12 uppercase tracking-tight">
                 Gestione su capital con la precisión de una entidad bancaria. Inteligencia analítica para el control total de créditos y ventas.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                 <Link href="/login" className="flex items-center justify-center gap-4 px-12 py-7 bg-white text-slate-950 hover:bg-emerald-500 hover:text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-3xl transition-all hover:scale-105 active:scale-95 group">
                    Iniciar Despliegue 
                    <FiZap className="group-hover:animate-bounce" />
                 </Link>
                 <button className="flex items-center justify-center gap-4 px-12 py-7 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] transition-all backdrop-blur-xl">
                    Documentación Core
                 </button>
              </div>

              <div className="mt-16 grid grid-cols-3 gap-10 opacity-40">
                 <div className="space-y-4">
                    <FiShield className="text-emerald-500 text-2xl" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] leading-tight text-slate-300">Cifrado de Grado Militar</p>
                 </div>
                 <div className="space-y-4">
                    <FiGlobe className="text-emerald-500 text-2xl" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] leading-tight text-slate-300">Multi-Sucursal <br /> Global</p>
                 </div>
                 <div className="space-y-4">
                    <FiCpu className="text-emerald-500 text-2xl" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] leading-tight text-slate-300">Procesamiento Instantáneo</p>
                 </div>
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-6 relative perspective-[2000px] mt-12 xl:mt-0">
               {/* Visual Hero Decoration */}
               <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120%] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse"></div>
               
               <div className="relative glass p-4 rounded-[4rem] border-white/5 shadow-3xl transform rotate-Y-12 rotate-X-6 hover:rotate-0 transition-all duration-1000 group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[3.8rem]"></div>
                  <div className="relative rounded-[3.5rem] overflow-hidden bg-slate-900 border border-white/10 aspect-square md:aspect-video xl:aspect-square">
                     <Image 
                        src="/hero-finance.png"
                        alt="MoneyCore Interface"
                        fill
                        className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2s]"
                     />
                  </div>
                  
                  {/* Floating Action Elements */}
                  <div className="absolute -top-10 -right-10 glass p-8 rounded-3xl border-emerald-500/20 shadow-2xl animate-float">
                     <FiTrendingUp className="text-emerald-500 text-4xl mb-2" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Crecimiento</p>
                     <p className="text-xl font-black">+42.8%</p>
                  </div>

                  <div className="absolute -bottom-12 -left-12 glass p-10 rounded-[2.5rem] border-white/10 shadow-2xl hidden md:block">
                     <div className="flex gap-4 mb-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40"></div>
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40"></div>
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40"></div>
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Usuarios Conectados</p>
                     <p className="text-2xl font-black">2,482</p>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </main>

      {/* Feature Section Grid */}
      <section id="tecnologia" className="py-40 px-6 bg-white/[0.01] relative overflow-hidden">
         <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
         
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-10">
               <div className="max-w-2xl">
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.85] mb-8">
                     ARQUITECTURA DE <br /> <span className="text-emerald-500 not-italic underline decoration-emerald-800 decoration-4 underline-offset-4">ÉLITE</span>
                  </h2>
                  <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm">Escalabilidad bancaria para carteras de cualquier dimensión.</p>
               </div>
               <div className="text-right hidden md:block">
                  <p className="text-8xl font-black text-white/5 tracking-tighter uppercase italic leading-none">CORE v4.0</p>
               </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[
                  { icon: FiUsers, title: "Análisis de Riesgo", desc: "Motor de IA que procesa el historial de pagos para predecir la liquidez futura de su cartera." },
                  { icon: FiSmartphone, title: "App para Campo", desc: "Herramienta optimizada para cobradores con actualización vía satélite y modo offline." },
                  { icon: FiPieChart, title: "Dynamic BI", desc: "Business Intelligence embebido. Visualice el retorno de inversión por cada sucursal." },
                  { icon: FiShield, title: "Vault Security", desc: "Protección perimetral de datos y auditoría de registros inmutable." },
                  { icon: FiGlobe, title: "Sync Global", desc: "Sincronización multi-región. Gestione tiendas en diferentes ciudades simultáneamente." },
                  { icon: FiZap, title: "Liquidación 1ms", desc: "Cierre de ventas y abonos con latencia imperceptible, incluso en conexiones lentas." }
               ].map((feat, i) => (
                  <div key={i} className="glass p-12 rounded-[3.5rem] border-white/5 hover:border-emerald-500/40 transition-all duration-500 group relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="p-5 bg-white/5 rounded-2xl inline-flex mb-10 group-hover:bg-emerald-600 transition-all duration-500 shadow-xl group-hover:scale-110">
                        <feat.icon className="text-2xl text-emerald-500 group-hover:text-white" />
                     </div>
                     <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-6 italic group-hover:text-emerald-400 transition-colors">{feat.title}</h3>
                     <p className="text-slate-500 text-sm leading-relaxed font-semibold uppercase tracking-tight">{feat.desc}</p>
                     
                     <div className="mt-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Ver Detalles</span>
                        <FiArrowRight className="text-emerald-500" size={12} />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Social / Trust Section */}
      <section className="py-24 px-6 border-y border-white/5 overflow-hidden">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-32">
            <div className="flex flex-col gap-2">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Confianza Industrial</p>
               <h3 className="text-2xl font-black italic tracking-tighter uppercase whitespace-nowrap">RESPALDADO POR <span className="text-emerald-500 not-italic">EL MERCADO</span></h3>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
               <div className="flex gap-20 animate-marquee whitespace-nowrap opacity-20 hover:opacity-100 transition-opacity duration-700 font-black text-2xl md:text-4xl italic tracking-tighter uppercase grayscale hover:grayscale-0">
                  <span>FINTECH_CORP</span>
                  <span>GLOBAL_FINANCE</span>
                  <span>CAPITAL_PLUS</span>
                  <span>RECAUDOS_VITAL</span>
                  <span>CREDIT_MASTER</span>
                  <span>SYNC_BANK</span>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section id="ecosistema" className="py-40 px-6">
         <div className="max-w-6xl mx-auto glass rounded-[5rem] p-12 md:p-32 text-center relative overflow-hidden border-white/10">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-600/20 blur-[130px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full"></div>
            
            <div className="relative z-10">
               <div className="inline-flex p-5 bg-white/5 rounded-3xl mb-12 shadow-2xl">
                  <FiActivity className="text-emerald-500 text-5xl" />
               </div>
               <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-12">
                  ACTIVA TU <br /> <span className="text-emerald-500 not-italic">INFRAESTRUCTURA</span>
               </h2>
               <p className="text-slate-400 text-xl md:text-2xl mb-16 max-w-2xl mx-auto font-medium leading-relaxed italic">
                  Únase a los negocios que han reducido su mora en un <span className="text-white font-black underline decoration-emerald-500 underline-offset-8">40% desde el primer mes.</span>
               </p>
               
               <div className="flex justify-center">
                  <Link href="/login" className="inline-flex items-center gap-6 px-16 py-9 bg-emerald-600 text-white rounded-[2.5rem] font-black text-base uppercase tracking-[0.3em] hover:bg-emerald-500 transition-all shadow-3xl hover:scale-110 active:scale-95 group">
                     Desplegar Ahora
                     <FiArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </Link>
               </div>
               
               <p className="mt-12 text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Implementación Inmediata • Sin Compromiso</p>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-black/20">
         <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-16 mb-20">
               <div className="md:col-span-2">
                  <div className="flex items-center gap-4 mb-8">
                     <FiActivity className="text-emerald-500 text-3xl" />
                     <span className="text-3xl font-black tracking-tighter uppercase">MONEY<span className="text-emerald-500">CORE</span></span>
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-tight text-sm max-w-sm">
                     La suite financiera definitiva diseñada para empresarios que no aceptan menos que la perfección operativa.
                  </p>
               </div>
               
               <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Tecnología</p>
                  <ul className="space-y-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                     <li className="hover:text-emerald-500 cursor-pointer transition-colors">Infraestructura</li>
                     <li className="hover:text-emerald-500 cursor-pointer transition-colors">Seguridad AES</li>
                     <li className="hover:text-emerald-500 cursor-pointer transition-colors">API REST</li>
                  </ul>
               </div>

               <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Compañía</p>
                  <ul className="space-y-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                     <li className="hover:text-emerald-500 cursor-pointer transition-colors">Sobre Nosotros</li>
                     <li className="hover:text-emerald-500 cursor-pointer transition-colors">Términos Legales</li>
                     <li className="hover:text-emerald-500 cursor-pointer transition-colors">Soporte 24/7</li>
                  </ul>
               </div>
            </div>

            <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.5em]">
                  &copy; {new Date().getFullYear()} CORE SYSTEMS GROUP. ALL RIGHTS RESERVED.
               </p>
               <div className="flex gap-10 opacity-30">
                  <div className="w-10 h-[1px] bg-white"></div>
                  <div className="w-10 h-[1px] bg-white"></div>
                  <div className="w-10 h-[1px] bg-white"></div>
               </div>
            </div>
         </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
