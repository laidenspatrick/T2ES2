import Roles from "../entities/Roles.js";
import { AppDataSource } from "../../database/database-config.js";
import { Not } from "typeorm";

const roleRepository = AppDataSource.getRepository(Roles);

const getRoleByName = async (name: string): Promise<Roles | null> => {
    return roleRepository.findOne({ where: { name } });
};

export { 
    getRoleByName
}