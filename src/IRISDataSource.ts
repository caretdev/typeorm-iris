import { DataSource, DataSourceOptions } from "typeorm"
import { IRISConnectionOptions } from "./IRISConnectionOptions"
import { IRISDriver } from "./IRISDriver"
import { registerQueryBuilders } from "./query-builder"
// import { AbstractSqliteDriver } from "typeorm/driver/sqlite-abstract/AbstractSqliteDriver"

// class DummyDriver extends AbstractSqliteDriver {
//     constructor(connection?: DataSource) {
//         super(
//             connection ||
//                 new DataSource({
//                     type: "sqlite",
//                     database: ":memory:",
//                 }),
//         )
//         // You can initialize custom properties here if needed
//     }

//     createQueryRunner(mode: ReplicationMode): QueryRunner {
//         throw new Error("Method not implemented.")
//     }

//     // Override connect method if needed
//     async connect(): Promise<void> {
//         return Promise.resolve()
//     }

//     // Override disconnect method if needed
//     async disconnect(): Promise<void> {
//         return Promise.resolve()
//     }

//     // Override preparePersistentValue if needed
//     preparePersistentValue(value: any, columnMetadata: any): any {
//         // Just return the value for dummy
//         return value
//     }

//     // Override prepareHydratedValue if needed
//     prepareHydratedValue(value: any, columnMetadata: any): any {
//         // Just return the value for dummy
//         return value
//     }
// }

export class IRISDataSource extends DataSource {
    // @ts-ignore
    declare readonly options: IRISConnectionOptions
    constructor(options: DataSourceOptions | IRISConnectionOptions) {
        // @ts-ignore
        super({
            ...options,
            // override to something that typeorm can understand
            // @ts-ignore
            type: "sqljs",
            driver: "dummy",
            database: ":memory:",
        })
        registerQueryBuilders()
        this.options = options as IRISConnectionOptions
        // @ts-ignore
        this.driver = new IRISDriver(this as DataSource)
    }

    // createEntityManager(queryRunner?: QueryRunner): EntityManager {
    //   return new IRISEntityManager(this as DataSource, queryRunner)
    // }

    // createQueryBuilder<Entity extends ObjectLiteral>(
    //   entityOrRunner?: EntityTarget<Entity> | QueryRunner,
    //   alias?: string,
    //   queryRunner?: QueryRunner,
    // ): SelectQueryBuilder<Entity> {
    //   let qb: SelectQueryBuilder<Entity>
    //   if (alias) {
    //     alias = DriverUtils.buildAlias(this.driver, undefined, alias)
    //     const metadata = this.getMetadata(entityOrRunner as EntityTarget<Entity>)
    //     qb = new IRISSelectQueryBuilder(this as DataSource, queryRunner)
    //       .select(alias)
    //       .from(metadata.target, alias)
    //   } else {
    //     qb = new IRISSelectQueryBuilder(
    //       this as DataSource,
    //       entityOrRunner as QueryRunner | undefined,
    //     )
    //   }
    //   return qb
    // }
}
