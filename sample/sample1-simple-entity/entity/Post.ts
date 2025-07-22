import { Column, Entity } from "typeorm"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Generated } from "typeorm/decorator/Generated"

@Entity("sample01_post")
export class Post {
    @PrimaryColumn()
    @Generated()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @Column({ nullable: false })
    likesCount: number
}
