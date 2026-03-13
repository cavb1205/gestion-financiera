// app/clientes/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiUsers, FiSearch, FiPlus, FiEdit, FiEye, FiFilter, FiX, FiPhone, FiMapPin, FiActivity, FiChevronLeft, FiChevronRight, FiShield, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from "../../components/LoadingSpinner";

export default function ClientesPage() {
  const router = useRouter();
  const { token, selectedStore, isAuthenticated, loading } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    estado: 'Todos',
    telefono: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Redirigir si no está autenticado o no tiene tienda seleccionada
    if (!loading && (!isAuthenticated || !selectedStore)) {
      router.push('/select-store');
      return;
    }

    // Cargar clientes solo si está autenticado y tiene tienda seleccionada
    if (selectedStore && token && !loading) {
      fetchClientes();
    }
  }, [loading, isAuthenticated, selectedStore, token, router]);

  const fetchClientes = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clientes/tienda/${selectedStore.tienda.id}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener los clientes');
      }

      const data = await response.json();
      const clientesData = Array.isArray(data) ? data : [];
      setClientes(clientesData);
      setFilteredClientes(clientesData);
    } catch (err) {
      setError(err.message || 'Error al cargar los clientes');
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Aplicar filtros y búsqueda
    let result = [...clientes];
    
    // Aplicar búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(cliente => 
        (cliente.nombres?.toLowerCase().includes(term) || '') ||
        (cliente.apellidos?.toLowerCase().includes(term) || '') ||
        (cliente.telefono_principal?.toLowerCase().includes(term) || '') ||
        (cliente.nombre_local?.toLowerCase().includes(term) || '')
      );
    }
    
    // Aplicar filtros
    if (filters.estado !== 'Todos') {
      result = result.filter(cliente => cliente.estado_cliente === filters.estado);
    }
    
    if (filters.telefono) {
      result = result.filter(cliente => 
        (cliente.telefono_principal?.includes(filters.telefono) || false) ||
        (cliente.telefono_opcional?.includes(filters.telefono) || false)
      );
    }
    
    setFilteredClientes(result);
    setCurrentPage(1); // Resetear a la primera página al cambiar filtros
  }, [clientes, searchTerm, filters]);

  // Calcular clientes para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClientes = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  // Cambiar página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const getPageNumbers = (current, total) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, 5];
    if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  // Resetear filtros
  const resetFilters = () => {
    setFilters({
      estado: 'Todos',
      telefono: ''
    });
    setSearchTerm('');
  };

  // Formatear teléfono
  const formatPhone = (phone) => {
    if (!phone) return '';
    
    // Eliminar cualquier carácter no numérico
    const cleaned = phone.replace(/\D/g, '');
    
    // Manejar diferentes longitudes de números
    if (cleaned.length === 10) {
      return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    } else if (cleaned.length === 12) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
    }
    
    // Si no coincide con los formatos esperados, devolver el original
    return phone;
  };

  // Estado para el cliente
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Activo':
        return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Activo
        </span>;
      case 'Inactivo':
        return <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Inactivo
        </span>;
      case 'Bloqueado':
        return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Bloqueado
        </span>;
      default:
        return <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit leading-none">
          {status}
        </span>;
    }
  };

  if (loading || !isAuthenticated || !selectedStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-[1.5rem] shadow-xl shadow-indigo-200 dark:shadow-none">
               <FiUsers className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Comunidad de Clientes</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                {selectedStore.tienda.nombre} • <span className="text-indigo-500">{filteredClientes.length} Registros</span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/dashboard/clientes/crear')}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <FiPlus size={20} />
            Añadir Cliente
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><FiUsers size={24} /></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">{clientes.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clientes Registrados</p>
            </div>
            <div className="absolute -right-5 -bottom-5 text-indigo-500/5 group-hover:scale-110 transition-transform"><FiUsers size={100} /></div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl"><FiShield size={24} /></div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Activos</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {clientes.filter(c => c.estado_cliente === 'Activo').length}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuentas Operativas</p>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl"><FiAlertCircle size={24} /></div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Bloqueados</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {clientes.filter(c => c.estado_cliente === 'Bloqueado' || c.estado_cliente === 'Inactivo').length}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuentas Restringidas</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass p-6 md:p-8 rounded-[2.5rem] mb-10 border-white/60 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <FiSearch size={20} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Identificación, nombre o establecimiento..."
                className="block w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-3 px-6 py-4.5 rounded-2xl font-black text-sm transition-all border ${
                  showFilters 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FiFilter className={showFilters ? "animate-bounce" : ""} />
                Filtros
              </button>
              
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="p-4.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900/30"
                >
                  <FiX size={20} />
                </button>
              )}
            </div>
          </div>
          
          {/* Panel de filtros */}
          {showFilters && (
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                  Estado Operativo
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Todos', 'Activo', 'Inactivo', 'Bloqueado'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilters({...filters, estado: status})}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                        filters.estado === status
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-indigo-300"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                  Contacto Telefónico
                </label>
                <input
                  type="text"
                  value={filters.telefono}
                  onChange={(e) => setFilters({...filters, telefono: e.target.value})}
                  placeholder="Número a buscar..."
                  className="block w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-end">
                <button 
                  onClick={resetFilters}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all"
                >
                  Limpiar Análisis
                </button>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-96 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0"></div>
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Procesando Registros...</p>
          </div>
        ) : error ? (
          <div className="glass bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
             <div className="bg-rose-100 dark:bg-rose-900/40 p-4 rounded-2xl mb-4">
                <FiX className="text-3xl text-rose-600" />
             </div>
             <p className="text-slate-800 dark:text-white font-black text-lg mb-2">Error de Sincronización</p>
             <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md">{error}</p>
             <button 
                onClick={fetchClientes}
                className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
              >
                Reintentar Operación
              </button>
          </div>
        ) : (
          <>
            {/* Tabla de clientes */}
            <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad Cliente</th>
                      <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto Directo</th>
                      <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Establecimiento</th>
                      <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Canales</th>
                      <th className="px-4 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentClientes.length > 0 ? (
                      currentClientes.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-4 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <FiUser className="text-indigo-600 text-xl" />
                              </div>
                              <div className="ml-5">
                                <div className="text-[15px] font-black text-slate-800 dark:text-white tracking-tight">
                                  {cliente.nombres} {cliente.apellidos}
                                </div>
                                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                                  <FiMapPin className="text-indigo-400" />
                                  {cliente.direccion}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-6 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <div className="text-[13px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <FiPhone className="text-slate-400" size={12} />
                                {formatPhone(cliente.telefono_principal)}
                              </div>
                              {cliente.telefono_opcional && (
                                <div className="text-[11px] font-bold text-slate-400 pl-5">
                                  {formatPhone(cliente.telefono_opcional)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-6 whitespace-nowrap text-[13px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                            {cliente.nombre_local || "N/A"}
                          </td>
                          <td className="px-4 py-6 whitespace-nowrap">
                            {getStatusBadge(cliente.estado_cliente)}
                          </td>
                          <td className="px-4 py-6 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => router.push(`/dashboard/clientes/${cliente.id}`)}
                                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                title="Ficha Técnica"
                              >
                                <FiEye size={16} />
                              </button>
                              <button
                                onClick={() => router.push(`/dashboard/clientes/${cliente.id}/editar`)}
                                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title="Modificar Datos"
                              >
                                <FiEdit size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-8 py-20 text-center">
                          <FiActivity className="mx-auto text-4xl text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest italic">No se encontraron registros activos</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
                  {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredClientes.length)} de {filteredClientes.length}
                </p>
                <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  {getPageNumbers(currentPage, totalPages).map(n => (
                    <button
                      key={n}
                      onClick={() => paginate(n)}
                      className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
                        currentPage === n
                          ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg'
                          : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}