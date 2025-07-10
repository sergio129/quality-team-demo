"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaUser, FaSignOutAlt } from "react-icons/fa";

interface UserProfileProps {
  name: string;
  email: string;
  role: string;
}

export default function UserProfile({ name, email, role }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm font-medium text-gray-700 rounded-full hover:text-blue-600 focus:outline-none"
      >
        <span className="sr-only">Abrir menú de usuario</span>
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <FaUser className="text-blue-600" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-60 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-2 px-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
            <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {role}
            </span>
          </div>
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FaSignOutAlt className="mr-2 text-gray-500" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
