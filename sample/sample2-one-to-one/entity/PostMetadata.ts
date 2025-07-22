import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm/index"
import { Post } from "./Post"

@Entity("sample2_post_metadata")
export class PostMetadata {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    description: string

    @OneToOne(() => Post, (post) => post.metadata)
    post: Post
}
