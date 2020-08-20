import { ErdModel, GenerateERD } from "./structure/utils";
import { PgTree } from "./structure/interfaces";


export const getStructure = async () => {
  let model = await new GenerateERD().getSchema();

  return model;
}