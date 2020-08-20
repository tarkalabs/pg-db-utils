import { Connection } from "../db/connection";
import { Map, DbStructure, Table, QueryResults, Row, Column, Relationship, Schema, Function, RelationshipType, PgTree } from "./interfaces";

export class GenerateERD {
  dbStructure: DbStructure;
  tables: Map<Table>;
  columns: Map<Column>;
  relationships: Map<Relationship>;
  schemas: Map<Schema>;
  functions: Map<Function>;

  public async getSchema() {
    let results = await Connection.getStructure();
    let model: ErdModel = new ErdModel(results);

    this.parseResults(model);
    this.generateTreeStructure(model);

    /* comment this line out for simple tree view of schemas
    let str = "";
    for (let key in model.dbStructure.schemas.items) {
      let schema = model.dbStructure.schemas.items[key];
      str += schema.name + "\n";
      schema.tables.forEach(tableId => {
        let table = model.getItemById(model.dbStructure.tables, tableId);
        str += "\t-" + table.name + "\n";
        table.columns.forEach(columnId => {
          let column = model.getItemById(model.dbStructure.columns, columnId) as Column;
          str += "\t\t-" + column.name + ((column.options.primaryKey)? " pk": "") + ((column.options.foreignKey)? " fk": "") + "\n";
        });
      });
    }

    console.log(str);
    //*/

    //Set Relationship Type
    for(let key in model.dbStructure.relationships.items) {
      let relationship = model.dbStructure.relationships.items[key];

      setRelationshipType(model, relationship);
    };

    return model;
  }

  generateTreeStructure(model: ErdModel) {
    let tree: PgTree = {
      schemas: []
    };
  
    for (let key in model.dbStructure.schemas.items) {
      let schema = model.dbStructure.schemas.items[key];
  
      tree.schemas.push({
        schemaName: schema.name,
        tables: schema.tables.map(tableId => {
          let table = model.dbStructure.tables.items[tableId];
          let newTable = {
            tableName: table.name,
            isTable: true,
            columns: table.columns.map(columnId => {
              let column = model.dbStructure.columns.items[columnId];
              return {
                columnName: column.name,
                pk: column.options.primaryKey,
                fk: column.options.foreignKey,
                data_type: column.data_type
              }
            })
          };
          return newTable;
        }),
        functions: []
      });
  
      model.tree = tree;
    }
  }

  parseResults(model: ErdModel) {
    let toDoRelationships = [];

    model.queryResults.rows.forEach(row => {
      let schema = model.parseSchema(row);
      let table = model.parseTable(row) as Table;
      let column = model.parseColumn(row);

      if (RowResult.fk_table_name(row)) {
        toDoRelationships.push(row);
      }
    }); 

    toDoRelationships.forEach(row => {
      let relationship = model.parseRelationship(row);
    });
  }
}

export class ErdModel {
  dbStructure: DbStructure;
  queryResults: QueryResults;
  tree: PgTree;

  uniqueSchemaName: number = 0;
  uniqueTableId: number = 0;
  uniqueColumnId: number = 0;
  uniqueRelationshipId: number = 0;
  ordinal_position: number = 0;

  constructor(queryResults: QueryResults) {
      this.dbStructure = {
          database: {
            name: RowResult.table_catalog(queryResults.rows[0]),
            schemas: [],
            id: RowResult.table_catalog(queryResults.rows[0]) + ":1"
          },
          schemas: new Map(),
          tables: new Map(),
          columns: new Map(),
          relationships: new Map(),
          functions: new Map()
      };
      this.queryResults = queryResults;
  }

  parseSchema(row: Row) {
    let schemaName = RowResult.table_schema(row);
    let schema = this.getSchemaByName(schemaName);
    if (!schema) {
      schema = {
        name: schemaName,
        tables: [],
        functions: [],
        relationships: [],
        id: schemaName + ":" + this.uniqueSchemaName++
      }
      this.addItem(schema, this.dbStructure.schemas, schema.id, schema.name, "");
    }
    return schema;
  }

  parseTable(row: Row) {
      let schemaName = RowResult.table_schema(row);
      let tableName = RowResult.table_name(row);
      let schema = this.getSchemaByName(schemaName);
      let table = this.getItemByName(this.dbStructure.tables, tableName, schemaName);
      if (!table) {
          table = {
            name: tableName,
            schema: schema.id,
            columns: [],
            ordinal_position: "" + this.ordinal_position++,
            id: tableName + ":" + this.uniqueTableId++
          };
          schema.tables.push(table.id);
          this.addItem(table, this.dbStructure.tables, table.id, table.name, schemaName);
      }
      return table;
  }

  parseColumn(row: Row) {
    let schemaName = RowResult.table_schema(row);
    let tableName = RowResult.table_name(row);
    let columnName = RowResult.column_name(row);
    let table = this.getItemByName(this.dbStructure.tables, tableName, schemaName) as Table;
    let column = this.getItemByName(this.dbStructure.columns, columnName, schemaName + "." + tableName) as Column; // FIX THIS
  
    if (!column) {
      column = {
        name: columnName,
        table: table.id,
        data_type: RowResult.data_type(row),
        ordinal_position: RowResult.ordinal_position(row),
        options: {
          autoIncrement: false,
          primaryKey: false,
          foreignKey: false,
          unique: false,
          notNull: false
        },
        id: columnName + ":" + this.uniqueColumnId++
      };
      table.columns.push(column.id);
      this.addItem(column, this.dbStructure.columns, column.id, column.name, schemaName + "." + tableName);
    }
    column.options = Object.assign(column.options, this.getOptions(row));
  }

  parseRelationship(row: Row) {
    let startSchemaName = RowResult.table_schema(row);
    let startTableName = RowResult.table_name(row);
    let startColumnName = RowResult.column_name(row);
    let startTableId = this.getItemId(this.dbStructure.tables, startTableName, startSchemaName);
    let startColumnId = this.getItemId(this.dbStructure.columns, startColumnName, startSchemaName + "." + startTableName);

    let endSchemaName = RowResult.fk_table_schema(row);
    let endTableName = RowResult.fk_table_name(row);
    let endColumnName = RowResult.fk_column_name(row);
    let endTableId = this.getItemId(this.dbStructure.tables, endTableName, endSchemaName);
    let endColumnId = this.getItemId(this.dbStructure.columns, endColumnName, endSchemaName + "." + endTableName);

    let relationshipId = this.getRelationshipId(startSchemaName, startTableName, endSchemaName, endTableName);

    let relationship = this.getItemById(this.dbStructure.relationships, relationshipId);
    if (!relationship) {
      relationship = {
        startTable: {
            id: startTableId,
            columns: [
              startColumnId
            ]
        },
        endTable: {
            id: endTableId,
            columns: [
              endColumnId
            ]
        },
        relationshipType: RelationshipType.OneOnlyToOneOnly,
        id: relationshipId
      };

      this.addItem(relationship, this.dbStructure.relationships, relationshipId, "", "");
    } else {
      let done = false;
      if (!done) {
        if (relationship.startTable.id == startTableId) {
          relationship.startTable.columns.push(startColumnId);
          relationship.endTable.columns.push(endColumnId);
        } else {
          relationship.endTable.columns.push(startColumnId);
          relationship.startTable.columns.push(endColumnId);
        }
      }
      relationship.relationshipType = RelationshipType.OneOnlyToOneOnly;
    }
  }

  public getRelationshipId(startSchemaName, startTableName, endSchemaName, endTableName) {
    if (startSchemaName + "." + startTableName < endSchemaName + "." + endTableName) {
      return startSchemaName + "." + startTableName + "=>" + endSchemaName + "." + endTableName;
    }
    return endSchemaName + "." + endTableName + "=>" + startSchemaName + "." + startTableName;
  }

  public getOptions(row: Row) {
    let options = {
      autoIncrement: false,
      primaryKey: RowResult.constraint_pk(row),
      foreignKey: RowResult.constraint_fk(row),
      unique: RowResult.constraint_unique(row),
      notNull: RowResult.notnull(row)
    }

    return options;
  }

  public getSchemaByName(name) {
    if (!this.dbStructure.schemas.ids[""]) {
      return undefined;
    }
    let id = this.dbStructure.schemas.ids[""][name];
    return this.dbStructure.schemas.items[id];
  }
  public getSchemaById(id) {
    return this.dbStructure.schemas.items[id];
  }
  public getSchemaId(name) {
    if (!this.dbStructure.schemas.ids[""]) {
      return undefined;
    }
    return this.dbStructure.schemas.ids[""][name];
  }

  public getItemByName(map: Map<any>, name, schemaName) {
    let id = this.getItemId(map, name, schemaName);
    if (!id) {
      return undefined;
    }
    return this.getItemById(map, id);
  }
  public getItemById(map: Map<any>, id) {
    return map.items[id];
  }
  public getItemId(map: Map<any>, name, schemaName) {
    if (!map.ids[schemaName]) {
      return undefined;
    }
    return map.ids[schemaName][name];
  }

  public addItem(item: any, map: Map<any>, id, name, schemaName) {
    map.items[id] = item;
    if (!map.ids[schemaName]) {
        map.ids[schemaName] = {};
    }
    map.ids[schemaName][name] = id;
  }
}

export class RowResult {
  public static dbms(row: Row) {return row["dbms"]}
  public static table_catalog(row: Row) {return row["table_catalog"]}
  public static table_schema(row: Row) {return row["table_schema"]}
  public static table_name(row: Row) {return row["table_name"]}
  public static column_name(row: Row) {return row["column_name"]}
  public static ordinal_position(row: Row) {return row["ordinal_position"]}
  public static data_type(row: Row) {return row["data_type"]}
  public static character_maximum_length(row: Row) {return row["character_maximum_length"]}
  public static constraint(row: Row) {return row["constraint_type"]}
  public static constraint_pk(row: Row) {return row["constraint_type"] == "PRIMARY KEY"}
  public static constraint_fk(row: Row) {return row["constraint_type"] == "FOREIGN KEY"}
  public static constraint_unique(row: Row) {return row["constraint_type"] == "UNIQUE"}
  public static fk_table_schema(row: Row) {return row["fk_table_schema"]}
  public static fk_table_name(row: Row) {return row["fk_table_name"]}
  public static fk_column_name(row: Row) {return row["fk_column_name"]}
  public static notnull(row: Row) {return row["notnull"]}
}
/*
  ZeroOneToOneOnly = "|o..||",    // N/A : fk U
  ZeroOneToZeroN = "|o..o{",      // N/A : fk N
  OneOnlyToZeroOne = "||..o|",    // fk U : N/A
  OneOnlyToOneOnly = "||..||",    // fk U N-N : N/A    OR     N/A : fk U N-N
  OneOnlyToZeroN = "||..o{",      // N/A : fk N-N
  ZeroNToZeroOne = "}o..o|",      // fk N : N/A
  ZeroNToOneOnly = "}o..||",      // fk N-N : N/A
*/
function setRelationshipType(model: ErdModel, relationship: Relationship) {
  relationship.startTable.columns.forEach(columnId => {
    let column = model.dbStructure.columns.items[columnId];
    if (column.options.foreignKey) {
      if (column.options.notNull) {
        if (column.options.unique) {
          relationship.relationshipType = RelationshipType.OneOnlyToOneOnly;
          return;
        } else {
          relationship.relationshipType = RelationshipType.ZeroNToOneOnly;
          return;
        }
      } else {
        if (column.options.unique) {
          relationship.relationshipType = RelationshipType.OneOnlyToZeroOne;
          return;
        } else {
          relationship.relationshipType = RelationshipType.ZeroNToZeroOne;
          return;
        }
      }
    }
  });

  relationship.endTable.columns.forEach(columnId => {
    let column = model.dbStructure.columns.items[columnId];
    if (column.options.foreignKey) {
      if (column.options.notNull) {
        if (column.options.unique) {
          relationship.relationshipType = RelationshipType.OneOnlyToOneOnly;
          return;
        } else {
          relationship.relationshipType = RelationshipType.OneOnlyToZeroN;
          return;
        }
      } else {
        if (column.options.unique) {
          relationship.relationshipType = RelationshipType.ZeroOneToOneOnly;
          return;
        } else {
          relationship.relationshipType = RelationshipType.ZeroOneToZeroN;
          return;
        }
      }
    }
  });
}