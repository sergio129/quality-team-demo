"use client";

import { useEffect, useState } from "react";
import { User } from "@/models/User";
import { toast } from "sonner";
import { formatDate, createSafeDate } from "@/utils/dateUtils";
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Clock, 
  Edit3, 
  ToggleLeft, 
  ToggleRight, 
  Trash2,
  Crown,
  Activity,
  ChevronRight,
  RefreshCw
} from "lucide-react";

interface UserListProps {
  onEdit: (user: User) => void;
  users?: User[];
  loading?: boolean;
  onRefresh?: () => void;
}

export default function UserList({ onEdit, users: propUsers, loading: propLoading, onRefresh }: UserListProps) {
  const [users, setUsers] = useState<User[]>(propUsers || []);
  const [loading, setLoading] = useState(propLoading ?? true);

  // Load users only if not provided via props
  useEffect(() => {
    if (!propUsers) {
      loadUsers();
    } else {
      setUsers(propUsers);
      setLoading(propLoading || false);
    }
  }, [propUsers, propLoading]);

  // Function to load users
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
      toast.error("Error al cargar la lista de usuarios");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle user deletion
  const handleDelete = async (user: User) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el usuario ${user.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar usuario");
      }

      toast.success("Usuario eliminado correctamente");
      if (onRefresh) {
        onRefresh();
      } else {
        loadUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error al eliminar usuario");
    }
  };

  // Toggle user activation status
  const toggleUserStatus = async (user: User) => {
    try {
      const newStatus = !user.isActive;
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Error al cambiar estado del usuario");
      }

      toast.success(`Usuario ${newStatus ? "activado" : "desactivado"} correctamente`);
      if (onRefresh) {
        onRefresh();
      } else {
        loadUsers();
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Error al actualizar el estado del usuario");
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'QA Leader':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'QA Senior':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'QA Analyst':
        return <UserIcon className="h-4 w-4 text-green-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'QA Leader':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'QA Senior':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'QA Analyst':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <div className="text-lg font-medium text-gray-700">Cargando usuarios...</div>
        <div className="text-sm text-gray-500">Obteniendo información del sistema</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <UserIcon className="h-16 w-16 text-gray-300" />
        <div className="text-xl font-medium text-gray-700">No hay usuarios</div>
        <div className="text-gray-500 text-center max-w-md">
          No se encontraron usuarios en el sistema. Crea el primer usuario para comenzar.
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Header con contador */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
          Usuarios del Sistema ({users.length})
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        )}
      </div>

      {/* Vista de cards */}
      <div className="grid gap-4 md:gap-6">
        {users.map((user) => (
          <div
            key={user.id}
            className={`bg-gradient-to-r ${
              user.isActive 
                ? 'from-white to-green-50 border-green-200 hover:border-green-300' 
                : 'from-white to-red-50 border-red-200 hover:border-red-300'
            } border-2 rounded-xl p-4 sm:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Info principal del usuario */}
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                {/* Avatar */}
                <div className={`p-2 sm:p-3 rounded-xl ${
                  user.isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-600'
                } text-white flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                {/* Detalles del usuario */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h4 className="text-base sm:text-lg font-bold text-gray-800 truncate">{user.name}</h4>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Estado badge */}
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>

                      {/* Role badge */}
                      {user.analyst?.role && (
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user.analyst.role)} flex items-center space-x-1 whitespace-nowrap`}>
                          {getRoleIcon(user.analyst.role)}
                          <span className="hidden sm:inline">{user.analyst.role}</span>
                          <span className="sm:hidden">QA</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    
                    {user.lastLogin && (
                      <div className="flex items-center space-x-2 min-w-0">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          <span className="hidden sm:inline">Último acceso: </span>
                          {createSafeDate(user.lastLogin)?.toLocaleString() || "Nunca"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Información del analista */}
                  {user.analyst && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-xs sm:text-sm">
                        <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-blue-700 font-medium truncate">
                          <span className="hidden sm:inline">Analista: </span>
                          {user.analyst.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end space-x-1 sm:space-x-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(user)}
                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors group"
                  title="Editar usuario"
                >
                  <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                </button>

                <button
                  onClick={() => toggleUserStatus(user)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors group ${
                    user.isActive
                      ? 'text-yellow-600 hover:bg-yellow-100'
                      : 'text-green-600 hover:bg-green-100'
                  }`}
                  title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                >
                  {user.isActive ? (
                    <ToggleRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(user)}
                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors group"
                  title="Eliminar usuario"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                </button>

                <ChevronRight className="h-3 w-3 sm:h-5 sm:w-5 text-gray-300" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
