# TypeORM-IRIS

A TypeORM driver for InterSystems IRIS database, providing seamless integration between TypeORM and IRIS databases.

## Overview

This driver enables you to use TypeORM with InterSystems IRIS databases, supporting both traditional SQL operations and IRIS-specific features. It includes connection pooling for high-performance applications.

## Installation

```bash
npm install typeorm-iris
```

## Quick Start

### Basic Connection

```typescript
import { IRISDataSource, IRISConnectionOptions } from "typeorm-iris"

const dataSourceOptions: IRISConnectionOptions = {
    name: "iris",
    type: "iris",
    host: "localhost",
    port: 1972,
    username: "_SYSTEM",
    password: "SYS",
    namespace: "USER",
    logging: true,
    dropSchema: true,
}

export function createDataSource(options: any): IRISDataSource {
    // @ts-ignore
    const dataSource = new IRISDataSource({ ...dataSourceOptions, ...options })
    return dataSource
}
```

### Entity Definition

```typescript
import { Column, Entity } from "typeorm"
import { PrimaryColumn } from "typeorm"
import { Generated } from "typeorm"

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
```

### Basic Operations

```typescript
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
```

## Configuration Options

```typescript
interface IRISConnectionOptions {
    type: "iris"
    host?: string
    port?: number
    username?: string
    password?: string
    namespace?: string
    sharedmemory?: boolean // Default: false (required for 2025.2+)
    poolSize?: number // Default: 5
    connectTimeout?: number // Default: 10 seconds
    entities?: EntitySchema[] // Entity definitions
    synchronize?: boolean // Auto-create tables
    logging?: boolean // Enable query logging
}
```

## Connection Pooling

The driver includes built-in connection pooling to prevent memory leaks:

```typescript
import { IRISConnectionPool } from "typeorm-iris"

const pool = new IRISConnectionPool(
    {
        host: "localhost",
        port: 1972,
        ns: "USER",
        user: "_SYSTEM",
        pwd: "SYS",
        sharedmemory: false,
    },
    5,
) // Max 5 connections

// Get connection from pool
const connection = await pool.getConnection()

try {
    // Use connection
    const iris = connection.createIris()
    // ... database operations
} finally {
    // Always release connection back to pool
    pool.releaseConnection(connection)
}

// Clean shutdown
await pool.closeAll()
```

## Examples

The repository includes several example files:

-   `sample/` - TypeORM entity examples

## Supported Data Types

The driver supports all standard SQL data types plus IRIS-specific types:

| TypeORM Type       | IRIS Type  | Notes                    |
| ------------------ | ---------- | ------------------------ |
| `integer`          | `INTEGER`  | Auto-increment supported |
| `varchar`          | `VARCHAR`  | Default length: 255      |
| `text`             | `TEXT`     | Large text fields        |
| `datetime`         | `DATETIME` | Timestamps               |
| `boolean`          | `BIT`      | True/false values        |
| `decimal`          | `DECIMAL`  | Precision and scale      |
| `uniqueidentifier` | `UUID`     | GUID support             |

## Development

### Building the Project

```bash
npm run build
```

### Running Tests

Start IRIS

```
docker compose up -d iris
```

```bash
npm test
```

Optionally tests can run with testcontainers, image needs to be passed as envionment variable

```bash
export IRIS_IMAGE=containers.intersystems.com/intersystems/iris-community:latest-preview
```

### Type Checking

```bash
npm run typecheck
```

### Running Examples

```bash
# Basic demo
node build/compiled/sample1-simple-entity/app.js

node build/compiled/sample2-one-to-one/app.js

node build/compiled/sample3-many-to-one/app.js

node build/compiled/sample4-many-to-many/app.js

node build/compiled/sample16-indexes/app.js

```

## Requirements

-   Node.js 20+
-   InterSystems IRIS 2025.1+
-   TypeORM 0.3+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

-   [IRIS Documentation](https://docs.intersystems.com/)
-   [TypeORM Documentation](https://typeorm.io/)
-   [GitHub Issues](https://github.com/caretdev/typeorm-iris/issues)
