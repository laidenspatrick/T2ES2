import IRoles from "../interfaces/iRoles.js";
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, CreateDateColumn, UpdateDateColumn, JoinTable } from "typeorm";
import Users from "./Users.js";

@Entity('roles')
class Roles implements IRoles {
    @PrimaryGeneratedColumn('increment', { name: 'id_role' })
    idRole: number;

    @Column({ name: 'name', nullable: false })
    name: string;

    @Column({ name: 'description', nullable: false })
    description: string;
    
    @Column({name: 'active', type: 'boolean', nullable: false, default: true })
    active: boolean;

    @ManyToMany(() => Users, (user) => user.roles)
    users?: Users[]
}

export default Roles;