import { Column, Entity, PrimaryGeneratedColumn } from "typeorm/index"

@Entity("sample2_post_category")
export class PostCategory {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
