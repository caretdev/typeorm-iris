import { IRISDataSource, IRISConnectionOptions } from "../src"

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
