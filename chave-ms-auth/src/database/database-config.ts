import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import Users from '../app/entities/Users.js';
import Roles from '../app/entities/Roles.js';
import RevokedToken from '../app/entities/RevokedToken.js';
dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) ?? 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [
        Users,
        Roles,
        RevokedToken
    ],
    migrations: [
        
    ],
    subscribers: []
});