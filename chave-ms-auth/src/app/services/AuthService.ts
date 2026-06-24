import Users from '../entities/Users.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getByEmailAndActive } from '../repositories/UserRepository.js';
import { save as saveRevokedToken } from '../repositories/RevokedTokenRepository.js';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.JWT_SECRET ?? 'change_me';

const login = async (email: string, password: string): Promise<Users> => {
    const user = await getByEmailAndActive(email);

    if (!user) {
        throw new Error('Email ou senha não batem.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        throw new Error('Email ou senha não batem.');
    }

    let { passwordHash: _, ...userWithoutPassword } = user;

    return userWithoutPassword as Users;
};

const generateJWT = (user: Users): string => {
    return jwt.sign(
        {
            idUser: user.idUser,
            email: user.email,
            roles: user.roles.map(r => r.name)
        },
        SECRET,
        { expiresIn: '4h' }
    );
}

const revokeToken = async (token: string): Promise<void> => {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) throw new Error('Token inválido.');
    const expiresAt = new Date(decoded.exp * 1000);
    await saveRevokedToken(token, expiresAt);
};

export { login, generateJWT, revokeToken };