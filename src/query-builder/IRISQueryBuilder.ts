import { QueryBuilder } from "typeorm/query-builder/QueryBuilder"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"

export abstract class IRISQueryBuilder<
    Entity extends ObjectLiteral,
> extends QueryBuilder<Entity> {
    // Custom methods or overrides for IRIS-specific query building can be added here
}
