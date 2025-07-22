import { Column, PrimaryGeneratedColumn } from "typeorm"
import { Index } from "typeorm/decorator/Index"

@Index("my_index_with_id_and_text", ["id", "text"])
export class BasePost {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    text: string

    @Index()
    @Column()
    extra: string
}
