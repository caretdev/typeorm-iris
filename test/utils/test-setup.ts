import "source-map-support/register"
import "reflect-metadata"
import { IRISContainer, StartedIRISContainer } from "testcontainers-iris"
import { IRISNative } from "../../src"

import chai from "chai"
import sinonChai from "sinon-chai"
import chaiAsPromised from "chai-as-promised"

declare global {
    var container: StartedIRISContainer | undefined
    var connectionOptions: {
        host: string
        port: number
        user: string
        pwd: string
        ns: string
    }
}

// Tests assume UTC time zone when formatting/parsing dates.
process.env.TZ = "UTC"

chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)

const value = 5
value.should.be.a("number")

before(async () => {
    console.log("Setting up test environment...")
    const image = process.env["IRIS_IMAGE"]
    let connectionOptions = {
        host: "localhost",
        port: 1972,
        user: "_SYSTEM",
        pwd: "SYS",
        ns: "USER",
    }
    if (image) {
        const container: StartedIRISContainer = await new IRISContainer(image)
            .withNamespace("TEST")
            .start()
        console.log(`IRIS container started at ${container.getConnectionUri()}`)
        global.container = container
        connectionOptions = {
            host: container.getHost(),
            port: container.getMappedPort(1972),
            user: container.getUsername(),
            pwd: container.getPassword(),
            ns: container.getNamespace(),
        }
    }
    global.connectionOptions = connectionOptions
    // test connection, if it fails, it will throw an error
    IRISNative.createConnection({ ...connectionOptions, sharedmemory: false })
})

after(async () => {
    console.log("Cleaning up test environment...")
    if (global.container) {
        await global.container.stop()
    }
    delete global.container
})
