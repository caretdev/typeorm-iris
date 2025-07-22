import "reflect-metadata"
import { Post } from "./entity/Post"
import { BasePost } from "./entity/BasePost"
import { createDataSource } from "../datasource"

const options = {
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post, BasePost],
}

async function main() {
    const dataSource = createDataSource(options)

    try {
        await dataSource.initialize()

        const post = new Post()
        post.text = "Hello how are you?"
        post.title = "hello"
        post.likesCount = 0
        post.extra = "extra value"

        const postRepository = dataSource.getRepository(Post)

        try {
            await postRepository.save(post)
            console.log("Post has been saved")
        } catch (error) {
            console.log("Cannot save post: ", error)
        }
    } catch (error) {
        console.log("Cannot connect: ", error)
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy()
        }
    }
}

void main()
