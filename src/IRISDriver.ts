import { Driver, ReturningType } from "typeorm/driver/Driver"
import { DriverUtils } from "typeorm/driver/DriverUtils"
import { CteCapabilities } from "typeorm/driver/types/CteCapabilities"
import { IRISQueryRunner } from "./IRISQueryRunner"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata"
import { DateUtils } from "typeorm/util/DateUtils"
import { OrmUtils } from "typeorm/util/OrmUtils"
import { DataSource } from "typeorm/data-source/DataSource"
import { RdbmsSchemaBuilder } from "typeorm/schema-builder/RdbmsSchemaBuilder"
import { IRISConnectionOptions } from "./IRISConnectionOptions"
import { MappedColumnTypes } from "typeorm/driver/types/MappedColumnTypes"
import { ColumnType } from "typeorm/driver/types/ColumnTypes"
import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults"
import { TableColumn } from "typeorm/schema-builder/table/TableColumn"
import { IRISConnectionCredentialsOptions } from "./IRISConnectionCredentialsOptions"
import { EntityMetadata } from "typeorm/metadata/EntityMetadata"
import { ApplyValueTransformers } from "typeorm/util/ApplyValueTransformers"
import { ReplicationMode } from "typeorm/driver/types/ReplicationMode"
import { Table } from "typeorm/schema-builder/table/Table"
import { View } from "typeorm/schema-builder/view/View"
import { TableForeignKey } from "typeorm/schema-builder/table/TableForeignKey"
import { InstanceChecker } from "typeorm/util/InstanceChecker"
import { UpsertType } from "typeorm/driver/types/UpsertType"
import { TypeORMError } from "typeorm/error/TypeORMError"
import { IRISNative } from "./IRISNative"

/**
 * Organizes communication with InterSystems IRIS.
 */
export class IRISDriver implements Driver {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by driver.
     */
    connection: DataSource

    iris: any

    master: any

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    // @ts-ignore
    options: IRISConnectionOptions

    /**
     * Version of IRIS. Requires a SQL query to the DB, so it is not always set
     */
    version?: string

    /**
     * default schema used to perform all queries.
     */
    schema?: string

    defaultSchema: string

    /**
     * Indicates if replication is enabled.
     */
    isReplicated: boolean = false

    /**
     * Indicates if tree tables are supported by this driver.
     */
    treeSupport = true

    /**
     * Represent transaction support by this driver
     */
    transactionSupport = "nested" as const

    /**
     * Gets list of supported column data types by a driver.
     */
    supportedDataTypes: ColumnType[] = [
        "integer",
        "int",
        "smallint",
        "bigint",
        "numeric",
        "tinyint",
        "decimal",
        "double",
        "real",
        "float",
        "money",
        "char",
        "character",
        "varchar",
        "character varying",
        "double precision",
        "text",
        "binary",
        "date",
        "time",
        "datetime",
        "timestamp",
        "boolean",
        "bit",
        "uniqueidentifier",
    ]

    /**
     * Returns type of upsert supported by driver if any
     */
    supportedUpsertTypes: UpsertType[] = []

    spatialTypes: ColumnType[] = []

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = [
        "char",
        "varchar",
        "nvarchar",
        "binary",
        "varbinary",
    ]

    /**
     * Gets list of column data types that support length by a driver.
     */
    withWidthColumnTypes: ColumnType[] = [
        "bit",
        "tinyint",
        "smallint",
        "mediumint",
        "int",
        "integer",
        "bigint",
    ]

    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[] = [
        "decimal",
        "dec",
        "numeric",
        "fixed",
        "float",
        "double",
        "double precision",
        "real",
        "time",
        "datetime",
        "timestamp",
    ]

    /**
     * Gets list of column data types that supports scale by a driver.
     */
    withScaleColumnTypes: ColumnType[] = [
        "decimal",
        "dec",
        "numeric",
        "fixed",
        "float",
        "double",
        "double precision",
        "real",
    ]

    /**
     * Gets list of column data types that supports UNSIGNED and ZEROFILL attributes.
     */
    unsignedAndZerofillTypes: ColumnType[] = [
        "int",
        "integer",
        "smallint",
        "tinyint",
        "mediumint",
        "bigint",
        "decimal",
        "dec",
        "numeric",
        "float",
        "double",
        "double precision",
        "real",
    ]

    /**
     * ORM has special columns and we need to know what database column types should be for those columns.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "datetime",
        createDatePrecision: 0,
        createDateDefault: "CURRENT_TIMESTAMP",
        updateDate: "datetime",
        updateDatePrecision: 0,
        updateDateDefault: "CURRENT_TIMESTAMP",
        deleteDate: "datetime",
        deleteDatePrecision: 0,
        deleteDateNullable: true,
        version: "int",
        treeLevel: "int",
        migrationId: "int",
        migrationName: "varchar",
        migrationTimestamp: "bigint",
        cacheId: "int",
        cacheIdentifier: "varchar",
        cacheTime: "bigint",
        cacheDuration: "int",
        cacheQuery: "text",
        cacheResult: "text",
        metadataType: "varchar",
        metadataDatabase: "varchar",
        metadataSchema: "varchar",
        metadataTable: "varchar",
        metadataName: "varchar",
        metadataValue: "text",
    }

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults = {
        varchar: { length: 255 },
        nvarchar: { length: 255 },
        "national varchar": { length: 255 },
        char: { length: 1 },
        binary: { length: 1 },
        varbinary: { length: 255 },
        decimal: { precision: 10, scale: 0 },
        dec: { precision: 10, scale: 0 },
        numeric: { precision: 10, scale: 0 },
        fixed: { precision: 10, scale: 0 },
        float: { precision: 12 },
        double: { precision: 22 },
        time: { precision: 0 },
        datetime: { precision: 0 },
        timestamp: { precision: 0 },
        bit: { width: 1 },
        int: { width: 11 },
        integer: { width: 11 },
        tinyint: { width: 4 },
        smallint: { width: 6 },
        mediumint: { width: 9 },
        bigint: { width: 20 },
    }

    /**
     * Max length allowed by IRIS for aliases.
     */
    maxAliasLength = 63

    cteCapabilities: CteCapabilities = {
        enabled: false,
        requiresRecursiveHint: true,
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource) {
        this.connection = connection
        this.options = connection.options as IRISConnectionOptions
        this.isReplicated = this.options.replication ? true : false

        this.defaultSchema = "SQLUser"
        this.schema = DriverUtils.buildDriverOptions(this.options).schema
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        this.master = await this.createConnection(this.options, this.options)

        const queryRunner = this.createQueryRunner("master")

        this.version = await queryRunner.getVersion()

        if (!this.schema) {
            this.schema = await queryRunner.getCurrentSchema()
        }

        await queryRunner.release()
    }

    protected async createConnection(
        options: IRISConnectionOptions,
        credentials: IRISConnectionCredentialsOptions,
    ): Promise<any> {
        const { logger } = this.connection
        logger.log("info", "Creating connection...")
        credentials = Object.assign({}, credentials)
        const connectionOptions = Object.assign(
            {},
            {
                host: credentials.host,
                port: credentials.port,
                user: credentials.username,
                pwd: credentials.password,
                ns: credentials.namespace || credentials.database,
                sharedmemory: credentials.sharedmemory || false,
                timeout: options.connectTimeout || 10,
            },
            options.extra || {},
        )
        const conn = IRISNative.createConnection(connectionOptions)
        return Promise.resolve(conn)
    }

    /**
     * Makes any action after connection.
     */
    afterConnect(): Promise<void> {
        return Promise.resolve()
    }

    /**
     * Closes connection with the database.
     */
    async disconnect(): Promise<void> {}

    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection)
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode) {
        return new IRISQueryRunner(this, mode)
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(
        sql: string,
        parameters: ObjectLiteral,
        nativeParameters: ObjectLiteral,
    ): [string, any[]] {
        const escapedParameters: any[] = Object.keys(nativeParameters).map(
            (key) => nativeParameters[key],
        )
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters]

        sql = sql.replace(
            /:(\.\.\.)?([A-Za-z0-9_.]+)/g,
            (full, isArray: string, key: string): string => {
                if (!parameters.hasOwnProperty(key)) {
                    return full
                }

                const value: any = parameters[key]

                if (isArray) {
                    return value
                        .map((v: any) => {
                            escapedParameters.push(v)
                            return this.createParameter(
                                key,
                                escapedParameters.length - 1,
                            )
                        })
                        .join(", ")
                }

                if (typeof value === "function") {
                    return value()
                }

                escapedParameters.push(value)
                return this.createParameter(key, escapedParameters.length - 1)
            },
        ) // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters]
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return '"' + columnName + '"'
    }

    /**
     * Build full table name with database name, schema name and table name.
     */
    buildTableName(tableName: string, schema?: string): string {
        const tablePath = [tableName]

        if (schema) {
            tablePath.unshift(schema)
        }

        return tablePath.join(".")
    }

    /**
     * Parse a target table name or other types and return a normalized table definition.
     */
    parseTableName(
        target: EntityMetadata | Table | View | TableForeignKey | string,
    ): { schema?: string; tableName: string } {
        const driverSchema = this.schema || this.defaultSchema

        if (InstanceChecker.isTable(target) || InstanceChecker.isView(target)) {
            const parsed = this.parseTableName(target.name)

            return {
                schema: target.schema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isTableForeignKey(target)) {
            const parsed = this.parseTableName(target.referencedTableName)

            return {
                schema:
                    target.referencedSchema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isEntityMetadata(target)) {
            // EntityMetadata tableName is never a path

            return {
                schema: target.schema || driverSchema,
                tableName: target.tableName,
            }
        }

        const parts = target.split(".")

        return {
            schema: driverSchema,
            tableName: parts.length > 1 ? parts[1] : parts[0],
        }
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        // console.log(
        //   "IRISDriver.preparePersistentValue:",[
        //   columnMetadata.databaseName,
        //   columnMetadata.type,
        //   typeof value,
        //   value,
        // ])
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(
                columnMetadata.transformer,
                value,
            )

        if (value === null || value === undefined) return value

        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0
        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value)
        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value)
        } else if (columnMetadata.type === "numeric") {
            if (typeof value === "string") {
                return parseFloat(value)
            }
            // } else if (
            //   columnMetadata.type === "timestamp" ||
            //   columnMetadata.type === "datetime" ||
            //   columnMetadata.type === Date
            // ) {
            //   return DateUtils.mixedDateToDate(value)
        } else if (columnMetadata.type === Number) {
            // convert to number if number
            value = !isNaN(+value) ? parseInt(value) : value
        }

        return value
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        // console.log("IRISDriver.prepareHydratedValue:", [
        //   columnMetadata.databaseName,
        //   columnMetadata.type,
        //   typeof value,
        //   value,
        // ])
        if (value === null || value === undefined)
            return columnMetadata.transformer
                ? ApplyValueTransformers.transformFrom(
                      columnMetadata.transformer,
                      value,
                  )
                : value

        if (
            columnMetadata.type === Boolean ||
            columnMetadata.type === "bool" ||
            columnMetadata.type === "boolean"
        ) {
            value = value ? true : false
        } else if (
            columnMetadata.type === "datetime" ||
            columnMetadata.type === Date
        ) {
            value = DateUtils.normalizeHydratedDate(value)
        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value)
        } else if (columnMetadata.type === "time") {
            value = DateUtils.mixedTimeToString(value)
        } else if (columnMetadata.type === Number) {
            // convert to number if number
            value = !isNaN(+value) ? parseInt(value) : value
        }

        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(
                columnMetadata.transformer,
                value,
            )

        return value
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: {
        type: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
        generationStrategy?: string | null
    }): string {
        if (column.type === Number || column.type === "integer") {
            if (column.generationStrategy === "increment") {
                return "bigint"
            }
            return "integer"
        } else if (column.type === String) {
            return "varchar"
        } else if (column.type === Date) {
            return "datetime"
        } else if (column.type === Boolean) {
            return "bit"
        } else if (
            column.type === "double precision" ||
            column.type === "real"
        ) {
            return "double"
        } else if (
            column.type === "dec" ||
            column.type === "numeric" ||
            column.type === "fixed"
        ) {
            return "decimal"
        } else if (column.type === "bool" || column.type === "boolean") {
            return "tinyint"
        } else if (
            column.type === "nvarchar" ||
            column.type === "character varying"
        ) {
            return "varchar"
        } else if (column.type === "nchar" || column.type === "national char") {
            return "char"
        } else if (column.type === "uuid") {
            return "uniqueidentifier"
        } else {
            return (column.type as string) || ""
        }
    }

    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
        const defaultValue = columnMetadata.default

        if (defaultValue === null) {
            return undefined
        }

        if (typeof defaultValue === "boolean") {
            return defaultValue ? "1" : "0"
        }

        if (typeof defaultValue === "function") {
            const value = defaultValue()
            return this.normalizeDatetimeFunction(value)
        }

        if (defaultValue === undefined) {
            return undefined
        }

        return `${defaultValue}`
    }

    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.entityMetadata.indices.some(
            (idx) =>
                idx.isUnique &&
                idx.columns.length === 1 &&
                idx.columns[0] === column,
        )
    }

    /**
     * Returns default column lengths, which is required on column creation.
     */
    getColumnLength(column: ColumnMetadata | TableColumn): string {
        if (column.length) return column.length.toString()

        switch (column.type) {
            case String:
            case "varchar":
            case "nvarchar":
            case "national varchar":
                return "255"
            case "varbinary":
                return "255"
            default:
                return ""
        }
    }

    /**
     * Creates column type definition including length, precision and scale
     */
    createFullType(column: TableColumn): string {
        let type = column.type

        // used 'getColumnLength()' method, because IRIS requires column length for `varchar`, `nvarchar` and `varbinary` data types
        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`
        } else if (column.width) {
            type += `(${column.width})`
        } else if (
            column.precision !== null &&
            column.precision !== undefined &&
            column.scale !== null &&
            column.scale !== undefined
        ) {
            type += `(${column.precision},${column.scale})`
        } else if (
            column.precision !== null &&
            column.precision !== undefined
        ) {
            type += `(${column.precision})`
        }

        if (column.isArray) type += " array"

        return type
    }

    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection(): Promise<any> {
        if (!this.master) {
            throw new TypeORMError("Driver not Connected")
        }
        // return this.createConnection(this.options, this.options)
        return Promise.resolve(this.master)
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any> {
        return this.obtainMasterConnection()
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(
        metadata: EntityMetadata,
        insertResult: any,
        entityIndex: number,
    ): ObjectLiteral | undefined {
        if (!insertResult) return undefined

        return Object.keys(insertResult).reduce((map, key) => {
            const column = metadata.findColumnWithDatabaseName(key)
            if (column) {
                OrmUtils.mergeDeep(
                    map,
                    column.createValueMap(insertResult[key]),
                )
            }
            return map
        }, {} as ObjectLiteral)
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(
        tableColumns: TableColumn[],
        columnMetadatas: ColumnMetadata[],
    ): ColumnMetadata[] {
        return columnMetadatas.filter((columnMetadata) => {
            const tableColumn = tableColumns.find(
                (c) => c.name === columnMetadata.databaseName,
            )
            if (!tableColumn) return false // we don't need new columns, we only need exist and changed

            const isColumnChanged =
                tableColumn.name !== columnMetadata.databaseName ||
                tableColumn.type !== this.normalizeType(columnMetadata) ||
                tableColumn.length !== columnMetadata.length ||
                tableColumn.width !== columnMetadata.width ||
                (columnMetadata.precision !== undefined &&
                    tableColumn.precision !== columnMetadata.precision) ||
                (columnMetadata.scale !== undefined &&
                    tableColumn.scale !== columnMetadata.scale) ||
                tableColumn.unsigned !== columnMetadata.unsigned ||
                tableColumn.asExpression !== columnMetadata.asExpression ||
                tableColumn.generatedType !== columnMetadata.generatedType ||
                tableColumn.isPrimary !== columnMetadata.isPrimary ||
                !this.compareNullableValues(columnMetadata, tableColumn) ||
                tableColumn.isUnique !==
                    this.normalizeIsUnique(columnMetadata) ||
                false

            // if (isColumnChanged) {
            //     console.log("findChangedColumns", tableColumn.name, [
            //         tableColumn.isPrimary,
            //         columnMetadata.isPrimary,
            //         columnMetadata.generationStrategy == "increment",
            //         tableColumn.isPrimary !==
            //             (columnMetadata.isPrimary ||
            //                 columnMetadata.generationStrategy == "increment"),
            //     ])

            //     console.log(
            //         `Column ${tableColumn.name} changed: ${isColumnChanged}`,
            //     )
            // }
            return isColumnChanged
        })
    }

    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(returningType: ReturningType): boolean {
        return true
    }

    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean {
        return true
    }

    /**
     * Returns true if driver supports fulltext indices.
     */
    isFullTextColumnTypeSupported(): boolean {
        return true
    }

    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string {
        return "?"
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new connection pool for a given database credentials.
     */
    protected createConnectionOptions(
        options: IRISConnectionOptions,
        credentials: IRISConnectionCredentialsOptions,
    ): Promise<any> {
        credentials = Object.assign(
            {},
            credentials,
            DriverUtils.buildDriverOptions(credentials),
        ) // todo: do it better way

        // build connection options for the driver
        return Object.assign(
            {},
            {
                charset: options.charset,
                connectTimeout: options.connectTimeout,
                debug: options.debug,
                trace: options.trace,
                multipleStatements: options.multipleStatements,
                flags: options.flags,
            },
            {
                host: credentials.host,
                user: credentials.username,
                password: credentials.password,
                namespace: credentials.namespace,
                port: credentials.port,
                ssl: options.ssl,
            },
            options.acquireTimeout === undefined
                ? {}
                : { acquireTimeout: options.acquireTimeout },
            { connectionLimit: options.poolSize },
            options.extra || {},
        )
    }

    /**
     * Checks if "DEFAULT" values in the column metadata and in the database are equal.
     */
    protected compareDefaultValues(
        columnMetadataValue: string | undefined,
        databaseValue: string | undefined,
    ): boolean {
        if (
            typeof columnMetadataValue === "string" &&
            typeof databaseValue === "string"
        ) {
            // we need to cut out "'" because in IRIS we can understand returned value is a string or a function
            // as result compare cannot understand if default is really changed or not
            columnMetadataValue = columnMetadataValue.replace(/^'+|'+$/g, "")
            databaseValue = databaseValue.replace(/^'+|'+$/g, "")
        }

        return columnMetadataValue === databaseValue
    }

    compareNullableValues(
        columnMetadata: ColumnMetadata,
        tableColumn: TableColumn,
    ): boolean {
        return columnMetadata.isNullable === tableColumn.isNullable
    }

    /**
     * If parameter is a datetime function, e.g. "CURRENT_TIMESTAMP", normalizes it.
     * Otherwise returns original input.
     */
    protected normalizeDatetimeFunction(value?: string) {
        if (!value) return value

        // check if input is datetime function
        const isDatetimeFunction =
            value.toUpperCase().indexOf("CURRENT_TIMESTAMP") !== -1 ||
            value.toUpperCase().indexOf("NOW") !== -1

        if (isDatetimeFunction) {
            // extract precision, e.g. "(3)"
            const precision = value.match(/\(\d+\)/)
            return precision
                ? `CURRENT_TIMESTAMP${precision[0]}`
                : "CURRENT_TIMESTAMP"
        } else {
            return value
        }
    }

    /**
     * Escapes a given comment.
     */
    protected escapeComment(comment?: string) {
        if (!comment) return comment

        return comment
    }

    public get driver() {
        return class {
            // driver implementation
        }
    }
}
