import { SoftDeleteQueryBuilder } from "typeorm/query-builder/SoftDeleteQueryBuilder"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"

export class IRISSoftDeleteQueryBuilder<
    Entity extends ObjectLiteral,
> extends SoftDeleteQueryBuilder<Entity> {
    // Custom methods or overrides for IRIS-specific soft delete query building can be added here
}
