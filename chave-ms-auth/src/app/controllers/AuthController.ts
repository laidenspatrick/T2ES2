import { Request, Response, Router } from 'express';
import Users from '../entities/Users.js';
import { login, generateJWT, revokeToken } from '../services/AuthService.js';
import { getUserByID } from '../services/UsersService.js';
import Roles from '../entities/Roles.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware.js';

const authRouter = Router();

authRouter.post('/login', loginLimiter, async (_req: Request, res: Response) => {
    const { email, password } = _req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    login(email, password)
    .then((user: Users) => {
        let token = generateJWT(user);
        return res.status(200).json({
            email: user.email,
            roles: user.roles.map((role: Roles) => role.name),
            token: token
        });
    })
    .catch((error: Error) => {
        console.log(error);
        return res.status(500).json({
            status: 500,
            message: "Erro ao tentar criar um novo usuário.",
            error: error.message
        });
    })
});

authRouter.post('/logout', authMiddleware, async (_req: AuthRequest, res: Response) => {
    if (_req.headers.authorization === null || _req.headers.authorization === undefined) {
        return res.status(400).json({ message: 'Authorization obrigatório' });
    }
    const token = _req.headers.authorization.split(' ')[1];

    revokeToken(token)
    .then(() => {
        return res.status(200).json({ message: 'Logout realizado com sucesso.' });
    })
    .catch((error: Error) => {
        return res.status(500).json({
            status: 500,
            message: 'Erro ao realizar logout.',
            error: error.message
        });
    });
});

authRouter.get('/me', authMiddleware, (_req: AuthRequest, res: Response) => {
    if (_req.loggedUser === null || _req.loggedUser === undefined) {
        return res.status(401).json({
            status: 401,
            message: "Erro ao buscar informações sobre o usuário logado.",
            error: "Não foi possível authenticar o seu usuário."
        });
    }

    getUserByID(_req.loggedUser.idUser)
    .then((user: Users) => {
        return res.status(200).json(user);
    })
    .catch((error: Error) => {
        return res.status(500).json({
            status: 500,
            message: "Erro ao buscar informações sobre o usuário logado.",
            error: error.message
        });
    })
});

export { authRouter };