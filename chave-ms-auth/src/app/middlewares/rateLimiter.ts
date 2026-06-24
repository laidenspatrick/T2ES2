import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { status: 429, message: 'Muitas requisições. Tente novamente em breve.' }
});

export const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { status: 429, message: 'Muitas tentativas de login. Tente novamente em 5 minutos.' }
});

export const signUpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { status: 429, message: 'Limite de cadastros atingido. Tente novamente em 1 hora.' }
});
