import { SelectQueryBuilder } from "typeorm/query-builder/SelectQueryBuilder"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"

export class IRISSelectQueryBuilder<
    Entity extends ObjectLiteral,
> extends SelectQueryBuilder<Entity> {
    // Custom methods or overrides for IRIS-specific select query building can be added here
}
