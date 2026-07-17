// src/components/Login.tsx
import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/login', { email, password });
      localStorage.setItem('access_token', response.data.access_token);
      onLoginSuccess();
    } catch (error) {
      alert('Credenciales incorrectas');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <form onSubmit={handleLogin} className="p-8 bg-gray-800 rounded shadow-md">
        <h2 className="text-2xl mb-4">Iniciar Sesión</h2>
        <input type="email" placeholder="Email" className="block w-full p-2 mb-4 bg-gray-700 rounded" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Contraseña" className="block w-full p-2 mb-4 bg-gray-700 rounded" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="w-full p-2 bg-blue-600 rounded">Entrar</button>
      </form>
    </div>
  );
};

export default Login;