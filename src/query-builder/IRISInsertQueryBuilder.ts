import { InsertQueryBuilder } from "typeorm/query-builder/InsertQueryBuilder"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata"

export class IRISInsertQueryBuilder<
    Entity extends ObjectLiteral,
> extends InsertQueryBuilder<Entity> {
    readonly "@instanceof" = Symbol.for("IRISInsertQueryBuilder")
    // Custom methods or overrides for IRIS-specific insert query building can be added here

    // @ts-ignore
    getQuery(): string[] {
        const returningExpression = this.createReturningExpression("insert")
        let queries = []
        const valueSets = this.getValueSets()
        valueSets.forEach((valueSet, valueSetIndex) => {
            queries.push(this.createInsertExpression(valueSetIndex))
        })
        if (returningExpression) {
            const tableName = this.getTableName(this.getMainTableName())
            queries.push(
                `SELECT ${returningExpression} FROM ${tableName} WHERE %ID = LAST_IDENTITY()`,
            )
        }
        return queries.map((sql) =>
            this.replacePropertyNamesForTheWholeQuery(sql.trim()),
        )
    }

    getQueryAndParameters(): [string, any[]] {
        const queries = this.getQuery()
        const parameters = this.getParameters()
        const allParameters: any[] = []
        for (let i = 0; i < queries.length; i++) {
            const [query, params] =
                this.connection.driver.escapeQueryWithParameters(
                    queries[i],
                    parameters,
                    this.expressionMap.nativeParameters,
                )
            allParameters.push(params)
            queries[i] = query
        }
        return [queries.join(";\n"), allParameters]
    }

    protected createInsertExpression(valueSetIndex?: number): string {
        const tableName = this.getTableName(this.getMainTableName())
        const valuesExpression = this.createValuesExpression(valueSetIndex)
        const columnsExpression =
            this.createColumnNamesExpression(valueSetIndex)

        let query = `INSERT INTO ${tableName}`
        if (valuesExpression) {
            if (columnsExpression) {
                query += ` (${columnsExpression})`
            }
            query += ` VALUES ${valuesExpression}`
        } else {
            query += ` DEFAULT VALUES`
        }
        // if (this.getValueSets().length > 1) {
        //     const returningExpression = this.createReturningExpression("insert")
        //     query += ` RETURNING ${returningExpression}`
        // }

        return query
    }

    protected createValuesExpression(valueSetIndex?: number): string {
        if (valueSetIndex === undefined) {
            return ""
        }

        const valueSets = this.getValueSets()
        const columns = this.getInsertedColumns(valueSetIndex)

        // if column metadatas are given then apply all necessary operations with values
        if (columns.length > 0) {
            const expression = columns.map((column, columnIndex) =>
                this.createColumnValueExpression(
                    valueSets,
                    valueSetIndex,
                    column,
                ),
            )
            return `(${expression.join(", ")})`
        } else {
            let expression = ""

            valueSets.forEach((valueSet, insertionIndex) => {
                const columns = Object.keys(valueSet)
                columns.forEach((columnName, columnIndex) => {
                    if (columnIndex === 0) {
                        expression += "("
                    }

                    const value = valueSet[columnName]

                    // support for SQL expressions in queries
                    if (typeof value === "function") {
                        expression += value()
                    } else if (value === undefined) {
                        // skip if value for this column was not provided then insert default value
                    } else {
                        expression += this.createParameter(value)
                    }

                    if (columnIndex === Object.keys(valueSet).length - 1) {
                        if (insertionIndex === valueSets.length - 1) {
                            expression += ")"
                        } else {
                            expression += "), "
                        }
                    } else {
                        expression += ", "
                    }
                })
            })
            if (expression === "()") return ""
            return expression
        }
    }

    protected getInsertedColumns(valueSetIndex?: number): ColumnMetadata[] {
        valueSetIndex = valueSetIndex || 0
        if (!this.expressionMap.mainAlias!.hasMetadata) return []
        const valueSet = this.getValueSets()[valueSetIndex] || {}

        return this.expressionMap.mainAlias!.metadata.columns.filter(
            (column) => {
                // if user specified list of columns he wants to insert to, then we filter only them
                if (this.expressionMap.insertColumns.length)
                    return (
                        this.expressionMap.insertColumns.indexOf(
                            column.propertyPath,
                        ) !== -1
                    )

                let value = column.getEntityValue(valueSet)

                // skip columns the user doesn't want included by default
                if (!column.isInsert) {
                    return false
                }
                if (column.isVersion) {
                    return true
                }
                if (
                    column.isGenerated &&
                    column.generationStrategy === "increment"
                )
                    return false

                if (value === undefined || value === null) {
                    return false
                }

                return true
            },
        )
    }

    protected createColumnNamesExpression(valueSetIndex?: number): string {
        valueSetIndex = valueSetIndex || 0
        const columns = this.getInsertedColumns(valueSetIndex)
        if (columns.length > 0)
            return columns
                .map((column) => this.escape(column.databaseName))
                .join(", ")

        // in the case if there are no insert columns specified and table without metadata used
        // we get columns from the inserted value map, in the case if only one inserted map is specified
        if (
            !this.expressionMap.mainAlias!.hasMetadata &&
            !this.expressionMap.insertColumns.length
        ) {
            const valueSets = this.getValueSets()
            if (valueSets.length === 1)
                return Object.keys(valueSets[valueSetIndex])
                    .map((columnName) => this.escape(columnName))
                    .join(", ")
        }

        // get a table name and all column database names
        return this.expressionMap.insertColumns
            .map((columnName) => this.escape(columnName))
            .join(", ")
    }
}
