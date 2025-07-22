import { Entity, PrimaryColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryColumn("int")
    id: number

    @Column("varchar")
    name: string

    constructor(id: number, name: string) {
        this.id = id
        this.name = name
    }
}
