describe('AuthService - Utility Functions', () => {
  describe('validateEmail', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('deve retornar true para email válido', () => {
      const result = validateEmail('usuario@example.com');
      expect(result).toBe(true);
    });

    it('deve retornar false para email inválido', () => {
      const result = validateEmail('email-invalido');
      expect(result).toBe(false);
    });

    it('deve retornar false para email vazio', () => {
      const result = validateEmail('');
      expect(result).toBe(false);
    });
  });

  describe('Password Utilities', () => {
    const hashPassword = async (senha: string): Promise<string> => {
      if (!senha) throw new Error('Senha não pode ser vazia');
      // Simular hash com timestamp para ser diferente cada vez
      return `hash_${senha}_${Date.now()}`;
    };

    const comparePassword = async (senha: string, hash: string): Promise<boolean> => {
      return hash.startsWith(`hash_${senha}_`);
    };

    it('deve gerar hash para senha válida', async () => {
      const senha = 'senha123';
      const hash = await hashPassword(senha);
      
      expect(hash).toContain('hash_senha123');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('deve falhar com senha vazia', async () => {
      await expect(hashPassword('')).rejects.toThrow();
    });

    it('deve retornar true para senha correta', async () => {
      const senha = 'senha123';
      const hash = await hashPassword(senha);
      const resultado = await comparePassword(senha, hash);
      
      expect(resultado).toBe(true);
    });

    it('deve retornar false para senha incorreta', async () => {
      const hash = await hashPassword('senha123');
      const resultado = await comparePassword('outraSenha', hash);
      
      expect(resultado).toBe(false);
    });
  });
});
