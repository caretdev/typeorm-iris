import { UpdateQueryBuilder } from "typeorm/query-builder/UpdateQueryBuilder"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"

export class IRISUpdateQueryBuilder<
    Entity extends ObjectLiteral,
> extends UpdateQueryBuilder<Entity> {
    // Custom methods or overrides for IRIS-specific update query building can be added here
}
