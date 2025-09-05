"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { FaUser, FaSignOutAlt, FaCrown, FaShieldAlt } from "react-icons/fa";
import { useUserStats } from "@/hooks/useUserStats";

interface UserProfileProps {
  name: string;
  email: string;
  role: string;
}

export default function UserProfile({ name, email, role }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userStats = useUserStats(email);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  // Get role icon and color
  const getRoleConfig = (role: string) => {
    switch (role.toLowerCase()) {
      case 'qa leader':
        return { icon: FaCrown, color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' };
      case 'admin':
        return { icon: FaShieldAlt, color: 'from-red-400 to-pink-500', bgColor: 'bg-red-50', textColor: 'text-red-700' };
      default:
        return { icon: FaUser, color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700' };
    }
  };

  const roleConfig = getRoleConfig(role);
  const RoleIcon = roleConfig.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <div className={`relative h-10 w-10 rounded-xl bg-gradient-to-br ${roleConfig.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105`}>
          <span className="text-white text-lg font-bold">
            {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-white group-hover:text-blue-100 transition-colors">
            {name.split(' ')[0]}
          </p>
          <p className="text-xs text-white/70">
            {role}
          </p>
        </div>
        <svg 
          className="w-4 h-4 text-white/70 transition-transform duration-200 group-hover:text-white"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute -right-4 sm:right-0 z-50 mt-3 w-[95vw] sm:w-80 max-w-sm origin-top-right animate-in slide-in-from-top-2 duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Header with gradient */}
            <div className={`bg-gradient-to-br ${roleConfig.color} px-4 sm:px-6 py-4 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-white/10"></div>
              <div className="relative z-10 flex items-center space-x-3 sm:space-x-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg sm:text-xl font-bold">
                    {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">{name}</h3>
                  <p className="text-white/80 text-xs sm:text-sm truncate">{email}</p>
                </div>
              </div>
            </div>

            {/* User Info Section */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg ${roleConfig.bgColor} flex-shrink-0`}>
                    <RoleIcon className={`w-4 h-4 ${roleConfig.textColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800">Rol del Sistema</p>
                    <p className={`text-sm font-medium ${roleConfig.textColor} truncate`}>{role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500 hidden sm:inline">En línea</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-xl">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{userStats.totalProjects}</div>
                  <div className="text-xs text-blue-600/70 font-medium">Proyectos</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-green-50 rounded-xl">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{userStats.completedProjects}</div>
                  <div className="text-xs text-green-600/70 font-medium">Completados</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <div className="p-1 bg-red-100 rounded-lg">
                  <FaSignOutAlt className="w-4 h-4" />
                </div>
                <span>Cerrar sesión</span>
                <div className="ml-auto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
