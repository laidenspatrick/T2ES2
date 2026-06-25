export enum Gender {
    M = "Masculino",
    F = "Feminino",
    I = "Indefinido"
}

interface IUsers {
    idUser?: number;
    name: string;
    birthday: Date;
    gender: Gender;
    email: string;
    active: boolean;
}

export default IUsers;