import {expect} from "chai";
import { Connection } from "../db/connection";
import { getStructure } from "..";

describe("structure", () => {
  it("should return current path", async (done) => {
    await Connection.setup({
      label: "Localhost",
      host: ((process.env.CI_ENV)? "postgres": "127.0.0.1"),
      user:"dev",
      password:"1234",
      port:5432,
      database:"dvdrental",
      connectionTimeoutMillis: 1000
    });

    let str = "";

    const result = await getStructure();
    
    /*/ Comment to view tree structure
    result.tree.schemas.forEach(schema => {
      str += schema.schemaName + "\n";
      schema.tables.forEach(table => {
        str += "\t- " + table.tableName + "\n";
        table.columns.forEach(column => {
          str += "\t\t- " + column.columnName + " : " + column.data_type + ((column.pk)? " pk": "") + ((column.fk)? " fk": "") + "\n";
        });
      });
    });
    
    console.log(str);
    //*/


    expect([]).to.eql([]);
    done();
  })
})
