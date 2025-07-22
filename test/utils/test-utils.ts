import { IRISConnectionOptions, IRISDataSource } from "../../src"
import {
    EntitySubscriberInterface,
    InsertEvent,
    Logger,
    NamingStrategyInterface,
    EntitySchema,
} from "typeorm"

export function getTypeOrmConfig(): IRISConnectionOptions[] {
    const globalOptions = global.connectionOptions
    // const options = inject("dataSourceOptions") as IRISConnectionOptions
    return [
        {
            // @ts-ignore
            type: "iris",
            name: "default",
            host: globalOptions.host,
            port: globalOptions.port,
            namespace: globalOptions.ns,
            username: globalOptions.user,
            password: globalOptions.pwd,
        },
    ]
}

export interface TestingOptions {
    /**
     * Dirname of the test directory.
     * If specified, entities will be loaded from that directory.
     */
    __dirname?: string

    /**
     * Connection name to be overridden.
     * This can be used to create multiple connections with single connection configuration.
     */
    name?: string

    /**
     * Entities needs to be included in the connection for the given test suite.
     */
    entities?: (string | Function | EntitySchema<any>)[]

    /**
     * Migrations needs to be included in connection for the given test suite.
     */
    migrations?: (string | Function)[]

    /**
     * Subscribers needs to be included in the connection for the given test suite.
     */
    subscribers?: (string | Function)[]

    /**
     * Indicates if schema sync should be performed or not.
     */
    schemaCreate?: boolean

    /**
     * Indicates if schema should be dropped on connection setup.
     */
    dropSchema?: boolean

    /**
     * Enables or disables logging.
     */
    logging?: boolean

    /**
     * Schema name used for postgres driver.
     */
    schema?: string

    /**
     * Naming strategy defines how auto-generated names for such things like table name, or table column gonna be
     * generated.
     */
    namingStrategy?: NamingStrategyInterface

    /**
     * Typeorm metadata table name, in case of different name from "typeorm_metadata".
     * Accepts single string name.
     */
    metadataTableName?: string

    /**
     * Options that may be specific to a driver.
     * They are passed down to the enabled drivers.
     */
    driverSpecific?: object

    /**
     * Factory to create a logger for each test connection.
     */
    createLogger?: () =>
        | "advanced-console"
        | "simple-console"
        | "formatted-console"
        | "file"
        | "debug"
        | Logger

    relationLoadStrategy?: "join" | "query"

    /**
     * Allows automatic isolation of where clauses
     */
    isolateWhereStatements?: boolean
}

export function setupTestingConnections(
    options?: TestingOptions,
): IRISConnectionOptions[] {
    const ormConfigConnectionOptionsArray = getTypeOrmConfig()

    if (!ormConfigConnectionOptionsArray.length)
        throw new Error(
            `No connections setup in ormconfig.json file. Please create configurations for each database type to run tests.`,
        )

    return ormConfigConnectionOptionsArray.map((connectionOptions) => {
        let newOptions: any = Object.assign(
            {},
            connectionOptions as IRISConnectionOptions,
            {
                name: options && options.name ? options.name : "default",
                entities: options && options.entities ? options.entities : [],
                migrations:
                    options && options.migrations ? options.migrations : [],
                subscribers:
                    options && options.subscribers ? options.subscribers : [],
                dropSchema:
                    options && options.dropSchema !== undefined
                        ? options.dropSchema
                        : false,
            },
        )
        if (options && options.driverSpecific)
            newOptions = Object.assign({}, options.driverSpecific, newOptions)
        if (options && options.schemaCreate)
            newOptions.synchronize = options.schemaCreate
        if (options && options.schema) newOptions.schema = options.schema
        if (options && options.logging !== undefined)
            newOptions.logging = options.logging
        if (options && options.createLogger !== undefined)
            newOptions.logger = options.createLogger()
        if (options && options.__dirname)
            newOptions.entities = [options.__dirname + "/entity/*{.js,.ts}"]
        if (options && options.__dirname)
            newOptions.migrations = [
                options.__dirname + "/migration/*{.js,.ts}",
            ]
        if (options && options.namingStrategy)
            newOptions.namingStrategy = options.namingStrategy
        if (options && options.metadataTableName)
            newOptions.metadataTableName = options.metadataTableName
        if (options && options.relationLoadStrategy)
            newOptions.relationLoadStrategy = options.relationLoadStrategy
        if (options && options.isolateWhereStatements)
            newOptions.isolateWhereStatements = options.isolateWhereStatements

        return newOptions
    })
}

export function createDataSource(
    options: IRISConnectionOptions,
): IRISDataSource {
    return new IRISDataSource(options)
}

export async function createTestingConnections(
    options?: TestingOptions,
): Promise<IRISDataSource[]> {
    const dataSourceOptions = setupTestingConnections(options)
    const dataSources: IRISDataSource[] = []
    for (const options of dataSourceOptions) {
        const dataSource = createDataSource(options)
        await dataSource.initialize()
        dataSources.push(dataSource)
    }

    await Promise.all(
        dataSources.map(async (connection) => {
            // create new databases
            const databases: string[] = []
            connection.entityMetadatas.forEach((metadata) => {
                if (
                    metadata.database &&
                    databases.indexOf(metadata.database) === -1
                )
                    databases.push(metadata.database)
            })

            const queryRunner = connection.createQueryRunner()

            for (const database of databases) {
                await queryRunner.createDatabase(database, true)
            }

            // create new schemas
            const schemaPaths: Set<string> = new Set()
            connection.entityMetadatas
                .filter((entityMetadata) => !!entityMetadata.schema)
                .forEach((entityMetadata) => {
                    let schema = entityMetadata.schema!

                    if (entityMetadata.database) {
                        schema = `${entityMetadata.database}.${schema}`
                    }

                    schemaPaths.add(schema)
                })

            const schema = connection.driver.options?.hasOwnProperty("schema")
                ? (connection.driver.options as any).schema
                : undefined

            if (schema) {
                schemaPaths.add(schema)
            }

            for (const schemaPath of schemaPaths) {
                try {
                    await queryRunner.createSchema(schemaPath, true)
                } catch (e) {
                    // Do nothing
                }
            }

            await queryRunner.release()
        }),
    )

    return dataSources
}

class GeneratedColumnReplacerSubscriber implements EntitySubscriberInterface {
    static globalIncrementValues: { [entityName: string]: number } = {}
    beforeInsert(event: InsertEvent<any>): Promise<any> | void {
        event.metadata.columns.map((column) => {
            if (column.generationStrategy === "increment") {
                if (
                    !GeneratedColumnReplacerSubscriber.globalIncrementValues[
                        event.metadata.tableName
                    ]
                ) {
                    GeneratedColumnReplacerSubscriber.globalIncrementValues[
                        event.metadata.tableName
                    ] = 0
                }
                GeneratedColumnReplacerSubscriber.globalIncrementValues[
                    event.metadata.tableName
                ] += 1

                column.setEntityValue(
                    event.entity,
                    GeneratedColumnReplacerSubscriber.globalIncrementValues[
                        event.metadata.tableName
                    ],
                )
            } else if (
                (column.isCreateDate || column.isUpdateDate) &&
                !column.getEntityValue(event.entity)
            ) {
                column.setEntityValue(event.entity, new Date())
            } else if (
                !column.isCreateDate &&
                !column.isUpdateDate &&
                !column.isVirtual &&
                column.default !== undefined &&
                column.getEntityValue(event.entity) === undefined
            ) {
                column.setEntityValue(event.entity, column.default)
            }
        })
    }
}

export function reloadTestingDatabases(connections: IRISDataSource[]) {
    GeneratedColumnReplacerSubscriber.globalIncrementValues = {}
    if (!connections || !connections.length) return Promise.resolve()
    return Promise.all(
        connections.map((connection) => connection.synchronize(true)),
    )
}

export function closeTestingConnections(connections: IRISDataSource[]) {
    if (!connections || !connections.length) return Promise.resolve()
    return Promise.all(
        connections.map((connection) =>
            connection && connection.isInitialized
                ? connection.destroy()
                : undefined,
        ),
    )
}
