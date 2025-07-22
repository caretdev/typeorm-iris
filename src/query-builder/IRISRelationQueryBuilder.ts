import { RelationQueryBuilder } from "typeorm/query-builder/RelationQueryBuilder"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"

export class IRISRelationQueryBuilder<
    Entity extends ObjectLiteral,
> extends RelationQueryBuilder<Entity> {
    // Custom methods or overrides for IRIS-specific relation query building can be added here
}
