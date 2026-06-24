
import { Request, Response, NextFunction } from 'express';

export const errorHandling = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    res.status(500).json({
        status: 500,
        message: "Erro na execução",
        error: err.message
    });
}

