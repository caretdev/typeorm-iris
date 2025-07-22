import "reflect-metadata"
import { Post } from "./entity/Post"
import { createDataSource } from "../datasource"

async function main() {
    const dataSource = createDataSource({
        logging: true,
        synchronize: true,
        entities: [Post as any],
    })

    try {
        await dataSource.initialize()
    } catch (error) {
        console.log("Cannot connect: ", error)
        return
    }

    const post = new Post()
    post.text = "Hello how are you?"
    post.title = "hello"
    post.likesCount = 100

    const postRepository = dataSource.getRepository(Post)

    try {
        await postRepository.save(post)
        console.log("Post has been saved: ", post)
    } catch (error) {
        console.log("Cannot save. Error: ", error)
    }

    await dataSource.destroy()
}

void main()
