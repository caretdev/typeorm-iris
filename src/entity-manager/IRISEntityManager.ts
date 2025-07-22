import { EntityManager } from "typeorm/entity-manager/EntityManager"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"
import { QueryRunner } from "typeorm/query-runner/QueryRunner"
import { EntityTarget } from "typeorm/common/EntityTarget"
import { SelectQueryBuilder } from "typeorm/query-builder/SelectQueryBuilder"

export class IRISEntityManager extends EntityManager {
    // Custom methods or overrides for IRIS-specific entity management can be added here

    createQueryBuilder<Entity extends ObjectLiteral>(
        entityClass?: EntityTarget<Entity> | QueryRunner,
        alias?: string,
        queryRunner?: QueryRunner,
    ): SelectQueryBuilder<Entity> {
        let queryBuilder: SelectQueryBuilder<Entity>
        if (alias) {
            queryBuilder = this.connection.createQueryBuilder(
                entityClass as EntityTarget<Entity>,
                alias,
                queryRunner || this.queryRunner,
            )
        } else {
            queryBuilder = this.connection.createQueryBuilder(
                (entityClass as QueryRunner | undefined) ||
                    queryRunner ||
                    this.queryRunner,
            )
        }
        return queryBuilder
    }
}
