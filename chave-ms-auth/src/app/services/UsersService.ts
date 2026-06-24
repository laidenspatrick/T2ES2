import Users from '../entities/Users.js';
import Roles from '../entities/Roles.js';
import { Gender } from '../interfaces/iUsers.js';
import { checkIfExistsByEmailAndNotId, getByID, getAll, save } from '../repositories/UserRepository.js';
import { getRoleByName } from '../repositories/RoleRepository.js';
import bcrypt from 'bcrypt';

const createUser = async (payload: {
    name: string,
    birthday: Date,
    gender: Gender,
    email: string,
    password: string,
    confirmationPassword: string
}): Promise<Users> => {
    allUserCreateDataValidations(payload);

    if (await validateClearEmail(null, payload.email)) {
        throw new Error("Email já em uso.");
    }

    let user = new Users();
    user.name = payload.name;
    user.birthday = payload.birthday;
    user.email = payload.email;
    user.gender = payload.gender;
    user.passwordHash = await bcrypt.hash(payload.password, 10);

    // Defininando valores base
    let basicRole = await getRoleByName("geral") as Roles;
    if (basicRole === null) {
        throw new Error("Falha ao localizar função geral no sistema");
    } 
    user.roles = [basicRole];
    user.active = true;

    // Desestruturando o usuário sem o hash da senha
    let { passwordHash: _, ...userWithoutPassword } = await save(user);

    return userWithoutPassword as Users;
}

const allUserCreateDataValidations = (payload: {
    name: string,
    birthday: Date,
    gender: Gender,
    email: string,
    password: string,
    confirmationPassword: string
}) => {
    if (!isValidName(payload.name)) {
        throw new Error("Deve ser informado o nome do usuário.");
    }
    if (!isValidBirthday(payload.birthday)) {
        throw new Error("A data de nascimento deve ser informada e deve ser uma data no passado.");
    }
    if (!isValidPassword(payload.password)) {
        throw new Error("A senha deve conter no mínimo 10 caracteres com pelo menos uma letra maiúscula, uma letra minuscula, um número e um caractere especial");
    }
    if (payload.password !== payload.confirmationPassword) {
        throw new Error("A senha e sua confirmação não são iguais.");
    }
    if (!isValidEmail(payload.email)) {
        throw new Error("O email informado não está em formato de email");
    }
}

const validateClearEmail = async (idUser: number | null, email: string): Promise<boolean> => {
    return checkIfExistsByEmailAndNotId(idUser, email)
}

const isValidName = (name: string): boolean => {
    return name !== null && (
        /^[a-zA-ZÀ-ÿ\s]+$/.test(name) && 
        name.trim().length > 0
    );
};

const isValidBirthday = (birthday: Date): boolean => {
    return birthday !== null && (
        new Date(birthday) <= new Date()
    );
};

const isValidEmail = (email: string): boolean => {
    return email !== null && (
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) &&
        !email.startsWith(".") &&
        !email.endsWith(".") &&
        !email.includes("..")
    );
};

const isValidPassword = (password: string): boolean => {
    return password !== null && (
        password.length >= 10 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
};

const getUserByID = async (idUser: number): Promise<Users> => {
    let user = await getByID(idUser);
    if (user === null) {
        throw new Error(`Usuário com id: ${idUser} não localizado`)
    }
    let { passwordHash: _, ...userWithoutPassword } = user;

    return userWithoutPassword as Users;
};

const getAllUsers = async (): Promise<Users[]> => {
    let users: Users[] = await getAll();
    let usersWithoutPassword: Users[] = users.map((user: Users) => {
        let { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword as Users;
    })
    return usersWithoutPassword;
}

const updateUser = async (idUser: number, payload: {
    name?: string,
    birthday?: Date,
    gender?: Gender,
    email?: string,
}): Promise<Users> => {
    let user = await getByID(idUser);
    if (user === null) {
        throw new Error(`Usuário com id: ${idUser} não localizado`);
    }

    if (payload.name !== undefined) {
        if (!isValidName(payload.name)) {
            throw new Error("Deve ser informado o nome do usuário.");
        }
        user.name = payload.name;
    }

    if (payload.birthday !== undefined) {
        if (!isValidBirthday(payload.birthday)) {
            throw new Error("A data de nascimento deve ser informada e deve ser uma data no passado.");
        }
        user.birthday = payload.birthday;
    }

    if (payload.gender !== undefined) {
        user.gender = payload.gender;
    }

    if (payload.email !== undefined) {
        if (!isValidEmail(payload.email)) {
            throw new Error("O email informado não está em formato de email");
        }
        if (await validateClearEmail(idUser, payload.email)) {
            throw new Error("Email já em uso.");
        }
        user.email = payload.email;
    }

    let { passwordHash: _, ...userWithoutPassword } = await save(user);

    return userWithoutPassword as Users;
};

const checkUserIsAdmin = async (idUser: number): Promise<boolean> => {
    const loggedUser = await getUserByID(idUser);
    let adminId = 2;
    if (loggedUser.roles.some(role => role.idRole === adminId)) {
        return true;
    }
    return false;
};

const copyRoles = async (idUser: number, idLoggedUser: number): Promise<Users> => {
    let userToImprove: Users | null = await getByID(idUser);
    if (!userToImprove) {
        throw new Error("Usuário a receber novos roles não identificado.");
    }
    const userToBeCopiedFrom: Users | null = await getByID(idLoggedUser);
    if (!userToImprove) {
        throw new Error("Não foi possível localizar o usuário a ser copiado.");
    }
    try {
        userToImprove.roles = userToBeCopiedFrom!.roles;
    } catch {
        throw new Error("Falha ao definir novos roles para o usuário");
    }
    
    let { passwordHash: _, ...userWithoutPassword } = await save(userToImprove);

    return userWithoutPassword as Users;
};

const downgradeRoles = async (idUser: number): Promise<Users> => {
    const userToDowngrade: Users | null = await getByID(idUser);
    if (userToDowngrade === null) {
        throw new Error("Usuário a receber novos roles não identificado")
    }
    
    let basicRole = await getRoleByName("geral") as Roles;
    if (basicRole === null) {
        throw new Error("Falha ao localizar função geral no sistema");
    } 
    userToDowngrade.roles = [basicRole];

    let { passwordHash: _, ...userWithoutPassword } = await save(userToDowngrade);

    return userWithoutPassword as Users;
};

export { createUser, getUserByID, updateUser, getAllUsers, copyRoles, downgradeRoles, checkUserIsAdmin };