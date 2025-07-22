// import { describe, beforeAll, afterAll, it, expect } from "vitest";
// import { inject } from 'vitest'
// // import { assert } from "chai";
// import { IRISNative } from "../src/IRISNative";

// describe("IRISNative test", () => {
//   let connection;
//   beforeAll(() => {
//     connection = IRISNative.createConnection({...inject('connectionOptions')})
//     expect(connection).toBeDefined();
//   });
//   afterAll(() => {
//     if (connection) {
//       connection.close();
//     }
//   });
//   it("should work", async () => {
//     const res = await connection.query("SELECT 1 AS test1, '2' AS test2", []).rows;
//     expect(res).to.be.an("array");
//     expect(res).to.have.lengthOf(1);
//     expect(res[0]).to.be.an("object");
//     expect(res[0]).to.have.property("test1");
//     expect(res[0]).to.have.property("test2");
//     expect(res[0]).to.have.property("test1", 1);
//     expect(res[0]).to.have.property("test2", "2");
//   });
// });
