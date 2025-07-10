"use client";

import { useState } from "react";
import { User } from "@/models/User";
import UserList from "@/components/users/UserList";
import UserForm from "@/components/users/UserForm";
import { Button } from "@/components/ui/button";

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

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
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Administración de Usuarios</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Crear nuevo usuario</Button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-6">
            {selectedUser ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
          <UserForm
            user={selectedUser}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          <UserList onEdit={handleEditUser} />
        </div>
      )}
    </div>
  );
}
