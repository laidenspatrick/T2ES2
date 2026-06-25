import { Request, Response, NextFunction } from 'express';

export const errorHandling = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro interno do servidor.', details: err.message });
};
