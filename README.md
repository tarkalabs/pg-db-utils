# @tarkalabs/pg-db-utils

 Database utility functions for querying the abstract structure of a postgresql database

# Install

---

`$ npm install @tarkalabs/pg-db-utils`

---
# Documentation
---
## Features
- Compatible with typescript
- Provides a simple Connection class for quick and easy sql queries
- Returns structure of a database that can be used to generate ER Diagrams
- Structure also provides a tree object which can be used for tree views

## Exported Members
- getStructure()
  - This function returns a JSON object that includes linked maps for every table in the selected database
  - The JSON object is type ErdModel from "pg-db-utils/structure/interfaces"

---
## Example
#### Connecting and Getting the Structure
```
function() => {
    Connection.setup({
      label: "Localhost",
      host: "127.0.0.1",
      user:"postgres",
      password:"postgres",
      port:5432,
      database:"my_db_name"
    });

    const result = await getStructure();
```
#### Accessing data from the ErdModel
```
    const erdModel = await getStructure();

    erdModel.tree.schemas.forEach(schema => {
      str += schema.schemaName + "\n";
      schema.tables.forEach(table => {
        str += "\t- " + table.tableName + "\n";
        table.columns.forEach(column => {
          str += "\t\t- " + column.columnName + " : " + column.data_type + ((column.pk)? " pk": "") + ((column.fk)? " fk": "") + "\n";
        });
      });
    });
    
    console.log(str);
```

---