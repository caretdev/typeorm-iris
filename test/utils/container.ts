// import "reflect-metadata"
// import { IRISContainer, StartedIRISContainer } from "testcontainers-iris";
// import type { TestProject } from 'vitest/node'
// import { IRISConnectionOptions } from "../../src";

// export default async function setup(project: TestProject) {
//   let image = process.env["VITEST_IMAGE"];
//   let connectionOptions = {
//     host: "localhost",
//     port: 1972,
//     user: "_SYSTEM",
//     pwd: "SYS",
//     ns: "USER",
//   }
//   if (image) {
//     const container: StartedIRISContainer = await new IRISContainer(image).withNamespace("TEST").start();
//     // console.log(`IRIS container started at ${container.getConnectionUri()}`);
//     connectionOptions = {
//       host: container.getHost(),
//       port: container.getMappedPort(1972),
//       user: container.getUsername(),
//       pwd: container.getPassword(),
//       ns: container.getNamespace(),
//     }
//   }
//   let dataSourceOptions = {
//     type: "iris",
//     host: connectionOptions.host,
//     port: connectionOptions.port,
//     username: connectionOptions.user,
//     password: connectionOptions.pwd,
//     namespace: connectionOptions.ns,
//     migrationsRun: true,
//     synchronize: true,
//   }
//   // @ts-ignore
//   project.provide('dataSourceOptions', dataSourceOptions);
//   project.provide('connectionOptions', connectionOptions);
// }

// declare module 'vitest' {
//   export interface ProvidedContext {
//     dataSourceOptions: IRISConnectionOptions,
//     connectionOptions: {
//       host: string,
//       port: number,
//       user: string,
//       pwd: string,
//       ns: string,
//     },
//   }
// }
