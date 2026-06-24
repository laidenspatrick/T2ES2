import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.JWT_SECRET ?? 'change_me';

export interface AuthRequest extends Request {
  loggedUser?: {
    idUser: number;
    email: string;
    roles: string[];
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET) as AuthRequest['loggedUser'];
    // Normaliza roles para UPPERCASE para não depender do que o banco guardou
    if (decoded && Array.isArray(decoded.roles)) {
      decoded.roles = decoded.roles.map((r) => r.toUpperCase());
    }
    req.loggedUser = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.loggedUser?.roles?.includes('ADMIN')) {
    res.status(403).json({ message: 'Acesso restrito a administradores.' });
    return;
  }
  next();
};
