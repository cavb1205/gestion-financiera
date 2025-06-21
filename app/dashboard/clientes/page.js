// app/clientes/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiSearch, FiPlus, FiEdit, FiEye, FiFilter, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

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
        `https://api.carterafinanciera.com/clientes/tienda/${selectedStore.tienda.id}/`, 
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
      setClientes(data);
      setFilteredClientes(data);
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
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Activo</span>;
      case 'Inactivo':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Inactivo</span>;
      case 'Moroso':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Moroso</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{status}</span>;
    }
  };

  if (loading || !isAuthenticated || !selectedStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600">
              Tienda: <span className="font-medium">{selectedStore.tienda.nombre}</span> | 
              Total de clientes: <span className="font-medium">{filteredClientes.length}</span>
            </p>
          </div>
          
          <button 
            onClick={() => router.push('/clientes/nuevo')}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <FiPlus className="mr-2" />
            Nuevo Cliente
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar clientes por nombre, teléfono o negocio..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <FiFilter className="mr-2" />
              Filtros
            </button>
          </div>
          
          {/* Panel de filtros */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-700">Filtros avanzados</h3>
                <button 
                  onClick={resetFilters}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                >
                  <FiX className="mr-1" /> Limpiar filtros
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) => setFilters({...filters, estado: e.target.value})}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="Todos">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Moroso">Moroso</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={filters.telefono}
                    onChange={(e) => setFilters({...filters, telefono: e.target.value})}
                    placeholder="Filtrar por teléfono"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="ml-4 text-gray-600">Cargando clientes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button 
              onClick={fetchClientes}
              className="mt-3 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Tabla de clientes - Columnas reducidas */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Local/Negocio
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentClientes.length > 0 ? (
                      currentClientes.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <FiUser className="text-indigo-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {cliente.nombres} {cliente.apellidos}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {cliente.direccion}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatPhone(cliente.telefono_principal)}
                            </div>
                            {cliente.telefono_opcional && (
                              <div className="text-sm text-gray-500">
                                {formatPhone(cliente.telefono_opcional)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{cliente.nombre_local}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(cliente.estado_cliente)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => router.push(`/dashboard/clientes/${cliente.id}`)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Ver detalles"
                              >
                                <FiEye size={18} />
                              </button>
                              <button
                                onClick={() => router.push(`/clientes/${cliente.id}/editar`)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Editar"
                              >
                                <FiEdit size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                          No se encontraron clientes que coincidan con los filtros
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {filteredClientes.length > itemsPerPage && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="text-sm text-gray-700">
                  Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredClientes.length)} de {filteredClientes.length} clientes
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 border border-gray-300 rounded-md ${
                      currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    Anterior
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`px-3 py-1 min-w-[40px] border rounded-md ${
                          currentPage === pageNumber
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-3 py-1 flex items-center">...</span>
                  )}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => paginate(totalPages)}
                      className={`px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50`}
                    >
                      {totalPages}
                    </button>
                  )}
                  
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 border border-gray-300 rounded-md ${
                      currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    Siguiente
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