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
        )
        res.rows.should.be.an("array")
        res.rows.should.have.lengthOf(1)
        res.rows[0].should.be.an("object")
        res.rows[0].should.have.property("test1")
        res.rows[0].should.have.property("test2")
        res.rows[0].should.have.property("test1", 1)
        res.rows[0].should.have.property("test2", "2")
    })
})
