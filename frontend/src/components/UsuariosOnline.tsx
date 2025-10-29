import React from 'react';
import { Users, Circle } from 'lucide-react';

interface Usuario {
  id: string;
  nome?: string;
}

interface UsuariosOnlineProps {
  usuarios: Usuario[];
  conectado: boolean;
}

const UsuariosOnline: React.FC<UsuariosOnlineProps> = ({ usuarios, conectado }) => {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
            <Users size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Online Agora</h3>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-full">
          <Circle
            size={8}
            className={conectado ? 'text-green-500 fill-green-500 animate-pulse' : 'text-gray-400 fill-gray-400'}
          />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {conectado ? 'Ativo' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {usuarios.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum usuário conectado</p>
          </div>
        ) : (
          usuarios.map((usuario, index) => (
            <div
              key={usuario.id}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl hover:scale-105 transition-transform cursor-pointer animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  {usuario.nome ? usuario.nome[0].toUpperCase() : 'U'}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white block">
                  {usuario.nome || `Usuário ${usuario.id.substring(0, 6)}`}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Ativo agora</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Total Conectados
          </p>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">
            {usuarios.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UsuariosOnline;

