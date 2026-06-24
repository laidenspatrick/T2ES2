import { Request, Response, Router } from 'express';
import Users from '../entities/Users.js';
import { copyRoles, createUser, downgradeRoles, getAllUsers, updateUser, checkUserIsAdmin } from '../services/UsersService.js';
import { signUpLimiter } from '../middlewares/rateLimiter.js';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware.js';

const userRouter = Router();

userRouter.post('/sign-up', signUpLimiter, async (_req: Request, res: Response) => {
    let {
        name, 
        birthday, 
        email, 
        gender, 
        password, 
        confirmationPassword
    } = _req.body;
    
    createUser({
        name: name,
        birthday: birthday,
        email: email,
        gender: gender,
        password: password,
        confirmationPassword: confirmationPassword
    }).then((user: Users) => {
        return res.status(200).json(user);
    }).catch((error: Error) => {
        console.log(error);
        return res.status(500).json({
            status: 500,
            message: "Erro ao tentar criar um novo usuário.",
            error: error.message
        });
    })
    
});

userRouter.put('/save', authMiddleware, async (_req: AuthRequest, res: Response) => {
    const idLoggedUser = _req.loggedUser?.idUser;
    if (idLoggedUser === null || idLoggedUser === undefined) {
        return res.status(401).json({
            status: 401,
            message: "Erro ao tentar salvar os dados do usuário.",
            error: "Não foi possivel authenticar o seu usuário"
        });
    }
    const isAdmin = await checkUserIsAdmin(idLoggedUser);
    if (!isAdmin) {
        return res.status(403).json({
            status: 403,
            message: "Erro ao tentar salvar os dados do usuário.",
            error: "Somente administradores podem realizar essa operação"
        });
    }

    const { idUser, name, birthday, gender, email } = _req.body;
    updateUser(idUser, { name, birthday, gender, email })
        .then((user: Users) => {
            return res.status(200).json(user);
        })
        .catch((error: Error) => {
            console.log(error);
            return res.status(500).json({
                status: 500,
                message: "Erro ao tentar atualizar o usuário.",
                error: error.message
            });
        });
});

userRouter.get('/all', authMiddleware, async (_req: AuthRequest, res: Response) => {
    const idLoggedUser = _req.loggedUser?.idUser;
    if (idLoggedUser === null || idLoggedUser === undefined) {
        return res.status(401).json({
            status: 401,
            message: "Erro ao tentar buscar a lista de usuários disponíveis.",
            error: "Não foi possivel authenticar o seu usuário"
        });
    }
    const isAdmin = await checkUserIsAdmin(idLoggedUser);
    if (!isAdmin) {
        return res.status(403).json({
            status: 403,
            message: "Erro ao tentar buscar a lista de usuários disponíveis.",
            error: "Somente administradores podem realizar essa operação"
        });
    }

    getAllUsers()
    .then((users: Users[]) => {
        return res.status(200).json(users)
    })
    .catch((error: Error) => {
        console.log(error);
        return res.status(500).json({
            status: 500,
            message: "Erro ao tentar passar suas roles para o novo usuário.",
            error: error.message
        });
    })
});

userRouter.put('/copy-roles', authMiddleware, async (_req: AuthRequest, res: Response) => {
    const { idUser } = _req.body;   
    const idLoggedUser = _req.loggedUser?.idUser;
    if (idLoggedUser === null || idLoggedUser === undefined) {
        return res.status(401).json({
            status: 401,
            message: "Erro ao tentar passar suas roles para o novo usuário.",
            error: "Não foi possivel authenticar o seu usuário"
        });
    }
    const isAdmin = await checkUserIsAdmin(idLoggedUser);
    if (!isAdmin) {
        return res.status(403).json({
            status: 403,
            message: "Erro ao tentar passar suas roles para o novo usuário.",
            error: "Somente administradores podem realizar essa operação"
        });
    }

    copyRoles(idUser, idLoggedUser!)
    .then((user: Users) => {
        return res.status(200).json(user);
    })
    .catch((error: Error) => {
        console.log(error);
        return res.status(500).json({
            status: 500,
            message: "Erro ao tentar passar suas roles para o novo usuário.",
            error: error.message
        });
    })
});

userRouter.put('/downgrade-roles', authMiddleware, async (_req: AuthRequest, res: Response) => {
    const { idUser } = _req.body;

    const idLoggedUser = _req.loggedUser?.idUser;
    if (idLoggedUser === null || idLoggedUser === undefined) {
        return res.status(401).json({
            status: 401,
            message: "Erro ao tentar remover privilégios do usuário.",
            error: "Não foi possivel authenticar o seu usuário"
        });
    }
    const isAdmin = await checkUserIsAdmin(idLoggedUser);
    if (!isAdmin) {
        return res.status(403).json({
            status: 403,
            message: "Erro ao tentar remover privilégios do usuário.",
            error: "Somente administradores podem realizar essa operação"
        })
    }

    downgradeRoles(idUser)
    .then((user: Users) => {
        return res.status(200).json(user);
    })
    .catch((error: Error) => {
        console.log(error);
        return res.status(500).json({
            status: 500,
            message: "Erro ao tentar remover privilégios do usuário.",
            error: error.message
        });
    })
});

export { userRouter };