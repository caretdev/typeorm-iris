import { IRISDeleteQueryBuilder } from "./IRISDeleteQueryBuilder"
import { IRISInsertQueryBuilder } from "./IRISInsertQueryBuilder"
import { IRISQueryBuilder } from "./IRISQueryBuilder"
import { IRISRelationQueryBuilder } from "./IRISRelationQueryBuilder"
import { IRISSelectQueryBuilder } from "./IRISSelectQueryBuilder"
import { IRISSoftDeleteQueryBuilder } from "./IRISSoftDeleteQueryBuilder"
import { IRISUpdateQueryBuilder } from "./IRISUpdateQueryBuilder"
import { QueryBuilder } from "typeorm/query-builder/QueryBuilder"

export function registerQueryBuilders() {
    QueryBuilder.registerQueryBuilderClass(
        "DeleteQueryBuilder",
        (qb: IRISQueryBuilder<any>) => new IRISDeleteQueryBuilder(qb),
    )
    QueryBuilder.registerQueryBuilderClass(
        "InsertQueryBuilder",
        (qb: IRISQueryBuilder<any>) => new IRISInsertQueryBuilder(qb),
    )
    QueryBuilder.registerQueryBuilderClass(
        "RelationQueryBuilder",
        (qb: IRISQueryBuilder<any>) => new IRISRelationQueryBuilder(qb),
    )
    QueryBuilder.registerQueryBuilderClass(
        "SelectQueryBuilder",
        (qb: IRISQueryBuilder<any>) => new IRISSelectQueryBuilder(qb),
    )
    QueryBuilder.registerQueryBuilderClass(
        "SoftDeleteQueryBuilder",
        (qb: IRISQueryBuilder<any>) => new IRISSoftDeleteQueryBuilder(qb),
    )
    QueryBuilder.registerQueryBuilderClass(
        "UpdateQueryBuilder",
        (qb: IRISQueryBuilder<any>) => new IRISUpdateQueryBuilder(qb),
    )
}
