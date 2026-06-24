import { createContext, useContext } from 'react';
import { ShellAuthContext } from '../types';

/**
 * Contexto de autenticação injetado pelo Shell App.
 *
 * O Shell passa o token JWT e dados do usuário como props para o MFE.
 * O MFE armazena no contexto e disponibiliza via hook.
 */
export const AuthContext = createContext<ShellAuthContext | null>(null);

export function useAuth(): ShellAuthContext {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuth deve ser usado dentro de <AuthContext.Provider>. ' +
        'Certifique-se de que o Shell está passando o token corretamente.',
    );
  }
  return ctx;
}

export function useIsAdmin(): boolean {
  const { roles } = useAuth();
  return roles.includes('ADMIN');
}
