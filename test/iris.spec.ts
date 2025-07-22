import { IRISNative, IRISConnection } from "../src/IRISNative"

describe("IRISNative test", () => {
    let connection: IRISConnection
    before(() => {
        const connectionOptions = global.connectionOptions
        connection = IRISNative.createConnection({ ...connectionOptions })
    })
    after(() => {
        if (connection) {
            connection.close()
        }
    })
    it("should work", async () => {
        const res = await connection.query(
            "SELECT 1 AS test1, '2' AS test2",
            [],
        ).rows
        res.should.be.an("array")
        res.should.have.lengthOf(1)
        res[0].should.be.an("object")
        res[0].should.have.property("test1")
        res[0].should.have.property("test2")
        res[0].should.have.property("test1", 1)
        res[0].should.have.property("test2", "2")
    })
})
