import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";

@Entity('revoked_tokens')
class RevokedToken {
    @PrimaryColumn({ name: 'token', type: 'text' })
    token: string;

    @Column({ name: 'expires_at', type: 'timestamptz', nullable: false })
    expiresAt: Date;

    @CreateDateColumn({ name: 'revoked_at' })
    revokedAt: Date;
}

export default RevokedToken;
