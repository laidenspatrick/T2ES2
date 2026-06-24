import IUsers, { Gender } from "../interfaces/iUsers.js";
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, CreateDateColumn, UpdateDateColumn, JoinTable } from "typeorm";
import { Exclude } from 'class-transformer';
import Roles from "./Roles.js";

@Entity('users')
class Users implements IUsers {
    @PrimaryGeneratedColumn('increment', { name: 'id_user' })
    idUser: number;

    @Column({ name: 'name', nullable: false })
    name: string;

    @Column({ name: 'birthday', type: "date", nullable: false })
    birthday: Date;

    @Column({ name: 'gender', type: "enum", enum: Gender, nullable: false })
    gender: Gender;

    @Column({ name: 'email', nullable: false })
    email: string;

    @Exclude()
    @Column({name: 'password_hash', nullable: false })
    passwordHash: string;

    @Column({name: 'active', type: 'boolean', nullable: false, default: true })
    active: boolean;

    @ManyToMany(() => Roles, (role) => role.users)
    @JoinTable({
        name:"users_roles",
        joinColumn: {
            name: "id_user", 
            referencedColumnName: "idUser"
        },
        inverseJoinColumn: {
            name: "id_role",
            referencedColumnName: "idRole"
        }
    })
    roles: Roles[]
}

export default Users;