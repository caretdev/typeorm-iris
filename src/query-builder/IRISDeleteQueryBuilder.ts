import { DeleteQueryBuilder } from "typeorm/query-builder/DeleteQueryBuilder"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"

export class IRISDeleteQueryBuilder<
    Entity extends ObjectLiteral,
> extends DeleteQueryBuilder<Entity> {
    // Custom methods or overrides for IRIS-specific delete query building can be added here
}
