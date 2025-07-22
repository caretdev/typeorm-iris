/**
 * IRIS specific connection credential options.
 */
export interface IRISConnectionCredentialsOptions {
    /**
     * Connection url where the connection is performed.
     */
    readonly url?: string

    /**
     * Database host.
     */
    readonly host?: string

    /**
     * Database host port.
     */
    readonly port?: number

    /**
     * Database username.
     */
    readonly username?: string

    /**
     * Database password.
     */
    readonly password?: string

    /**
     * Namespace to connect to.
     */
    readonly namespace?: string

    readonly database?: string

    /**
     * Object with ssl parameters or a string containing name of ssl profile.
     */
    readonly ssl?: null | object | string

    sharedmemory?: boolean
}
