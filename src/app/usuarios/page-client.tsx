"use client";

import { useState, useEffect } from "react";
import { User } from "@/models/User";
import UserList from "@/components/users/UserList";
import UserForm from "@/components/users/UserForm";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserPlus, 
  Shield, 
  UserCheck, 
  UserX, 
  Activity,
  Search,
  Filter,
  X
} from "lucide-react";

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);

  // Cargar usuarios
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle edit
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  // Function to handle form cancellation
  const handleCancel = () => {
    setSelectedUser(undefined);
    setShowForm(false);
  };

  // Function to handle form success
  const handleSuccess = () => {
    setSelectedUser(undefined);
    setShowForm(false);
    loadUsers(); // Recargar la lista
  };

  // Calcular estadísticas
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    withAnalyst: users.filter(u => u.analyst).length,
    admins: users.filter(u => u.analyst?.role === 'QA Leader').length
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.analyst?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && user.isActive) ||
                         (filterActive === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header con gradiente y estadísticas */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 mb-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <p className="text-blue-100 mt-1">Administra las cuentas y permisos del sistema</p>
              </div>
            </div>
            
            {!showForm && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
              >
                <UserPlus className="h-5 w-5" />
                <span>Crear Usuario</span>
              </Button>
            )}
          </div>

          {/* Panel de estadísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <Users className="h-6 w-6 text-blue-200" />
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-blue-200">Total</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <UserCheck className="h-6 w-6 text-green-300" />
              </div>
              <div className="text-2xl font-bold text-green-300">{stats.active}</div>
              <div className="text-xs text-blue-200">Activos</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <UserX className="h-6 w-6 text-red-300" />
              </div>
              <div className="text-2xl font-bold text-red-300">{stats.inactive}</div>
              <div className="text-xs text-blue-200">Inactivos</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <Activity className="h-6 w-6 text-yellow-300" />
              </div>
              <div className="text-2xl font-bold text-yellow-300">{stats.withAnalyst}</div>
              <div className="text-xs text-blue-200">Con Analista</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <Shield className="h-6 w-6 text-purple-300" />
              </div>
              <div className="text-2xl font-bold text-purple-300">{stats.admins}</div>
              <div className="text-xs text-blue-200">Líderes QA</div>
            </div>
          </div>
        </div>

        {showForm ? (
          /* Modal de formulario */
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedUser ? "Editar Usuario" : "Nuevo Usuario"}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {selectedUser ? "Modifica la información del usuario" : "Crea una nueva cuenta de usuario"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <UserForm
                  user={selectedUser}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Contenido principal */
          <>
            {/* Barra de búsqueda y filtros */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o analista..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="text-gray-400 h-5 w-5" />
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as any)}
                    className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
              </div>
              
              {searchTerm && (
                <div className="mt-3 text-sm text-gray-600">
                  Mostrando {filteredUsers.length} de {users.length} usuarios
                </div>
              )}
            </div>

            {/* Lista de usuarios */}
            <div className="bg-white rounded-xl shadow-lg">
              <UserList 
                onEdit={handleEditUser} 
                users={filteredUsers}
                loading={loading}
                onRefresh={loadUsers}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
