import { ErdModel, GenerateERD } from "./structure/utils";
import { MermaidModel } from "./erd/mermaid-utils";
import { Connection } from "./db/connection";
import { IConnection } from "./db/IConnection";

export { ErdModel, getStructure, MermaidModel, Connection, IConnection }

const getStructure = async (connection: Connection) => {
  let model = await new GenerateERD().getSchema(connection);

  return model;
}