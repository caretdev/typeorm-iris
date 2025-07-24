const IRISNative = require("@intersystems/intersystems-iris-native")
import { Connection } from "@intersystems/intersystems-iris-native"

export interface IRISConnection extends Connection {
    connectionId: string
    query: (queryString: string, argSets?: any[]) => Promise<any>
    release: () => Promise<void>
}

type IRISConnectionOptions = {
    host: string
    port?: number
    ns: string
    user: string
    pwd: string
    timeout?: number
    sharedmemory?: boolean
    logfile?: string
    sslconfig?: any
}

enum IRISStatementType {
    SELECT = 1,
    INSERT = 2,
    UPDATE = 3,
    DELETE = 4,
    CALL = 45,
}

enum ODBCType {
    BIGINT = -5,
    BINARY = -2,
    BIT = -7,
    CHAR = 1,
    DECIMAL = 3,
    DOUBLE = 8,
    FLOAT = 6,
    GUID = -11,
    INTEGER = 4,
    LONGVARBINARY = -4,
    LONGVARCHAR = -1,
    NUMERIC = 2,
    REAL = 7,
    SMALLINT = 5,
    DATE = 9,
    TIME = 10,
    TIMESTAMP = 11,
    TINYINT = -6,
    TYPE_DATE = 91,
    TYPE_TIME = 92,
    TYPE_TIMESTAMP = 93,
    VARBINARY = -3,
    VARCHAR = 12,
    WCHAR = -8,
    WLONGVARCHAR = -10,
    WVARCHAR = -9,
    DATE_HOROLOG = 1091,
    TIME_HOROLOG = 1092,
    TIMESTAMP_POSIX = 1093,
}

interface Column {
    ODBCType: ODBCType
    clientType: string
    colName: string
    isAliased?: boolean
    isAutoIncrement?: boolean
    isCaseSensitive?: boolean
    isCurrency?: boolean
    isExpression?: boolean
    isHidden?: boolean
    isIdentity?: boolean
    isKeyColumn?: boolean
    isList?: boolean
    isNullable?: boolean
    isReadOnly?: boolean
    isRowId?: boolean
    isRowVersion?: boolean
    isUnique?: boolean
    label?: string
    precision?: number
    // property?: string;
    // qualifier?: string;
    scale?: number
    schemaName?: string
    tableName?: string
    // typeClass?: string;
}

class SQLStatement {
    readonly _st: any

    constructor(public iris: any, public queryString: string) {
        this._st = iris.classMethodValue("%SQL.Statement", "%New", 1)
        const status = this._st.invokeString("%Prepare", this.queryString)
        if (status !== "1") {
            const message = iris.classMethodValue(
                "%SYSTEM.Status",
                "GetOneErrorText",
                status,
            )
            throw new Error(message)
        }
    }

    execute(...args: any[]): ResultSet {
        args = normalizeArgs(args)
        return new ResultSet(this._st, args)
    }
}
class ResultSet {
    readonly _rs: any
    readonly SQLCODE?: number
    readonly Message?: string
    readonly rows: any[] = []
    readonly columns: Column[] = []
    readonly lastInsertId?: any = null
    readonly statementType: IRISStatementType

    constructor(st: any, params: any[]) {
        params = params || []
        this.rows = []
        this._rs = st.invokeObject("%Execute", ...params)
        this.SQLCODE = this._rs.getNumber("%SQLCODE")
        this.Message = this._rs.getString("%Message")
        this.statementType = this._rs.getNumber("%StatementType")
        if (this.statementType === IRISStatementType.INSERT) {
            this.lastInsertId = this._rs.getString("%ROWID")
        }
        if (this.statementType === IRISStatementType.SELECT) {
            this.fetchMetadata()
            this.fetchRows()
        }
    }

    fetchMetadata() {
        const metadata = this._rs.invokeObject("%GetMetadata")
        this.columns.length = 0
        if (!metadata) {
            return
        }
        const columns = metadata.getObject("columns")
        const colCount = metadata.getNumber("columnCount")
        for (let i = 0; i < colCount; i++) {
            const columnInfo = columns.invokeObject(`GetAt`, i + 1)
            let column: Column = {
                ODBCType: columnInfo.getNumber("ODBCType"),
                clientType: columnInfo.getNumber("clientType"),
                colName: columnInfo.getString("colName"),
                isAliased: columnInfo.getBoolean("isAliased"),
                isAutoIncrement: columnInfo.getBoolean("isAutoIncrement"),
                isCaseSensitive: columnInfo.getBoolean("isCaseSensitive"),
                isCurrency: columnInfo.getBoolean("isCurrency"),
                isExpression: columnInfo.getBoolean("isExpression"),
                isHidden: columnInfo.getBoolean("isHidden"),
                isIdentity: columnInfo.getBoolean("isIdentity"),
                isKeyColumn: columnInfo.getBoolean("isKeyColumn"),
                isList: columnInfo.getBoolean("isList"),
                isNullable: columnInfo.getBoolean("isNullable"),
                isReadOnly: columnInfo.getBoolean("isReadOnly"),
                isRowId: columnInfo.getBoolean("isRowId"),
                isRowVersion: columnInfo.getBoolean("isRowVersion"),
                isUnique: columnInfo.getBoolean("isUnique"),
                label: columnInfo.getString("label"),
                precision: columnInfo.getNumber("precision"),
                // property: columnInfo.getObject("property"),
                // qualifier: columnInfo.getString("qualifier"),
                scale: columnInfo.getNumber("scale"),
                schemaName: columnInfo.getString("schemaName"),
                tableName: columnInfo.getString("tableName"),
                // typeClass: columnInfo.getObject("typeClass"),
            }
            this.columns.push(column)
        }
    }
    fetchRows() {
        this.rows.length = 0
        while (this._rs.invokeBoolean("%Next")) {
            const row: any = {}
            this.columns.forEach((col) => {
                const colName = col.colName
                let value
                switch (col.ODBCType) {
                    case ODBCType.INTEGER:
                    case ODBCType.SMALLINT:
                    case ODBCType.TINYINT:
                        value = this._rs.invokeNumber("%Get", colName)
                        break
                    case ODBCType.DATE:
                    case ODBCType.TIMESTAMP:
                        value = this._rs.invokeString("%Get", colName)
                        value = new Date(value)
                        break
                    case ODBCType.TIME:
                        value = this._rs.invokeString("%Get", colName)
                        break
                    case ODBCType.DATE_HOROLOG:
                    case ODBCType.TIME_HOROLOG:
                        value = this._rs.invokeNumber("%Get", colName)
                        break
                    case ODBCType.BIGINT:
                        value = this._rs.invokeString("%Get", colName)
                        break
                    case ODBCType.NUMERIC:
                        value = this._rs.invokeString("%Get", colName)
                        break
                    case ODBCType.FLOAT:
                    case ODBCType.REAL:
                    case ODBCType.DOUBLE:
                        value = this._rs.invokeNumber("%Get", colName)
                        break
                    case ODBCType.DECIMAL:
                        value = this._rs.invokeDecimal("%Get", colName)
                        break
                    case ODBCType.BINARY:
                    case ODBCType.LONGVARBINARY:
                    case ODBCType.LONGVARCHAR:
                        value = this._rs.invokeIRISList("%Get", colName)
                        break
                    case ODBCType.BIT:
                        value = this._rs.invokeBoolean("%Get", colName)
                        break
                    case ODBCType.VARCHAR:
                        value = this._rs.invokeString("%Get", colName)
                        break
                    default:
                        value = this._rs.invokeString("%Get", colName)
                }
                row[colName] = value
            })
            this.rows.push(row)
        }
    }
}

function dateToString(date: Date): string {
    const offset = date.getTimezoneOffset()
    return new Date(date.getTime() - offset * 60 * 1000)
        .toISOString()
        .replace("T", " ")
        .replace("Z", "")
}

function normalizeArgs(args: any[]) {
    if (!args || !args.length) {
        return []
    }
    const normalized: any[] = args.map((arg) => {
        if (arg === null || arg === undefined) {
            return null
        }
        if (typeof arg === "string") {
            return arg
        }
        if (typeof arg === "number") {
            return arg.toString()
        }
        if (typeof arg === "boolean") {
            return arg ? "1" : "0"
        }
        if (Buffer.isBuffer(arg)) {
            return arg.toString("binary")
        }
        if (arg instanceof Date) {
            return dateToString(arg)
            // return arg.getTime() * 1000 + 1152921504606846976
        }
        return arg
    })
    return normalized
}

function createQuery(connection: any) {
    const iris = connection.createIris()
    return async function (queryString: string, argSets: any[]): Promise<any> {
        argSets =
            argSets && argSets.length && Array.isArray(argSets[0])
                ? argSets
                : [argSets]
        argSets = argSets.map((args) => normalizeArgs(args || []))
        const queries = queryString
            .split(";")
            .map((q) => q.trim())
            .filter((q) => q.length > 0)
        let resultSet: ResultSet | null = null
        let st: SQLStatement | null = null
        const insertedIds: string[] = []
        for (let query of queries) {
            const args = argSets.shift() || []
            if (resultSet?.statementType === IRISStatementType.INSERT) {
                insertedIds.push(resultSet.lastInsertId || "")
            }
            if (
                query.includes("%ID = LAST_IDENTITY()") &&
                resultSet?.lastInsertId
            ) {
                query = query.replace(
                    "= LAST_IDENTITY()",
                    `in (${Array(insertedIds.length).fill("?")})`,
                )
                args.push(...insertedIds)
            }
            if (!st || st?.queryString !== query) {
                st = new SQLStatement(iris, query)
            }
            resultSet = st.execute(...args)
            if (resultSet.Message) {
                return Promise.resolve(resultSet)
            }
        }
        return Promise.resolve(resultSet)
    }
}

const createConnection = IRISNative.createConnection

IRISNative.createConnection = (
    options: IRISConnectionOptions,
): IRISConnection => {
    const connection = createConnection({ sharedmemory: false, ...options })
    connection.query = createQuery(connection)
    return connection
}
IRISNative.connect = IRISNative.createConnection

class IRISConnectionPool {
    private options: IRISConnectionOptions
    private maxConnections: number
    private pool: IRISConnection[] = []
    private activeConnections: Set<IRISConnection> = new Set()
    private connectionCount: number = 0

    constructor(options: IRISConnectionOptions, maxConnections: number = 5) {
        this.options = options
        this.maxConnections = maxConnections
    }

    async getConnection(): Promise<IRISConnection> {
        // Try to reuse an existing connection from pool
        if (this.pool.length > 0) {
            const connection = this.pool.pop()!
            this.activeConnections.add(connection)
            return connection
        }

        // Create new connection if under limit
        if (this.connectionCount < this.maxConnections) {
            try {
                const connection = await new Promise<IRISConnection>(
                    (resolve, reject) => {
                        try {
                            const conn = IRISNative.createConnection(
                                this.options,
                            )
                            this.connectionCount++
                            conn.connectionId = `conn-${this.connectionCount}`
                            conn.release = () => {
                                this.releaseConnection(conn)
                                return Promise.resolve()
                            }
                            resolve(conn)
                        } catch (error) {
                            reject(error)
                        }
                    },
                )
                this.activeConnections.add(connection)
                return connection
            } catch (error) {
                console.error("Failed to create connection:", error)
                throw error
            }
        }

        // Wait for a connection to become available
        // throw new Error("Max connections reached, please try again later.")
        return new Promise<IRISConnection>((resolve) => {
            const checkPool = (): void => {
                if (this.pool.length > 0) {
                    const connection = this.pool.pop()!
                    this.activeConnections.add(connection)
                    resolve(connection)
                } else {
                    setTimeout(checkPool, 100)
                }
            }
            checkPool()
        })
    }

    releaseConnection(connection: IRISConnection): void {
        if (this.activeConnections.has(connection)) {
            this.activeConnections.delete(connection)
            this.pool.push(connection)
        }
    }

    async closeAll(): Promise<void> {
        // Close active connections
        for (const connection of this.activeConnections) {
            try {
                connection.close()
            } catch (error) {
                console.error("Error closing active connection:", error)
            }
        }
        this.activeConnections.clear()

        // Close pooled connections
        for (const connection of this.pool) {
            try {
                connection.close()
            } catch (error) {
                console.error("Error closing pooled connection:", error)
            }
        }
        this.pool.length = 0
        this.connectionCount = 0

        // Force garbage collection if available
        if ((global as any).gc) {
            ;(global as any).gc()
            console.log("Forced garbage collection")
        }
    }

    getPoolStats(): { active: number; pooled: number; total: number } {
        return {
            active: this.activeConnections.size,
            pooled: this.pool.length,
            total: this.connectionCount,
        }
    }
}

export { IRISNative, IRISConnectionPool }
