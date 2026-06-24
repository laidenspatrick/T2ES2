import { LessThan } from "typeorm";
import { AppDataSource } from "../../database/database-config.js";
import RevokedToken from "../entities/RevokedToken.js";

const revokedTokenRepository = AppDataSource.getRepository(RevokedToken);

const save = async (token: string, expiresAt: Date): Promise<void> => {
    const entry = revokedTokenRepository.create({ token, expiresAt });
    await revokedTokenRepository.save(entry);
};

const exists = async (token: string): Promise<boolean> => {
    return revokedTokenRepository.existsBy({ token });
};

const purgeExpired = async (): Promise<void> => {
    await revokedTokenRepository.delete({ expiresAt: LessThan(new Date()) });
};

export { save, exists, purgeExpired };
