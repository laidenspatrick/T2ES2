import Users from "../entities/Users.js";
import { AppDataSource } from "../../database/database-config.js";
import { Not } from "typeorm";

const userRepository = AppDataSource.getRepository(Users);

const getByEmailAndActive = async (email: string): Promise<Users | null> => {
    return userRepository.findOne({ where: { email, active: true }, relations: ['roles'] });
};

const getByID = async (idUser: number): Promise<Users | null> => {
    return userRepository.findOne({ where: { idUser: idUser}, relations: ['roles'] })
}

const checkIfExistsByEmailAndNotId = async (idUser: number | null, email: string): Promise<boolean> => {
    const where: any = { email };
    if (idUser !== null) {
        where.idUser = Not(idUser);
    }
    const user = await userRepository.findOne({ where: where });
    return user ? true : false;
};

const save = async (user: Users): Promise<Users> => {
    return userRepository.save(user);
};

const getAll = async (): Promise<Users[]> => {
    return userRepository.find({ relations: ['roles'] });
}

export { 
    getByEmailAndActive, 
    getByID,
    checkIfExistsByEmailAndNotId, 
    save,
    getAll
}