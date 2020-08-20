export interface DbStructure {
    database: Database;
    schemas: Map<Schema>;
    tables: Map<Table>;
    columns: Map<Column>;
    relationships: Map<Relationship>;
    functions: Map<Function>;
};

export interface Database {
    name;
    schemas: Array<string>;
    id;
};
export interface Schema {
    name: string;
    tables: Array<string>;
    functions: Array<string>;
    relationships: Array<string>;
    id;
};
export interface Table {
    name;
    schema;
    ordinal_position;
    columns: Array<string>;
    id;
};
export interface Column {
    name;
    table;
    data_type;
    ordinal_position;
    options: {
        autoIncrement: boolean;
        primaryKey: boolean;
        foreignKey: boolean;
        unique: boolean;
        notNull: boolean;
    };
    id;
};
export interface Relationship {
    startTable: {
        id;
        columns: Array<string>;
    }
    endTable: {
        id;
        columns: Array<string>;
    }
    relationshipType;
    id;
};
export interface Function {
    name;
    id;
};

export class Map<T> {
    ids: {
        [parentId:string]: {
            [name:string]:string;
        };
    };
    items: {
        [id:string]: T;
    };

    constructor() {
        this.ids = { };
        this.items = { };
    }
}

export interface PgTree {
    schemas: {
      schemaName: string,
      tables: {
        tableName: string,
        isTable: boolean,
        columns: {
          columnName: string
          pk: boolean,
          fk: boolean,
          data_type: string
        }[]
      }[],
      functions: {
        functionName: string
      }[]
    }[]
};

export enum RelationshipType {      // start : end
    ZeroOneToOneOnly = "|o..||",    // N/A : fk U
    ZeroOneToZeroN = "|o..o{",      // N/A : fk N
    OneOnlyToZeroOne = "||..o|",    // fk U : N/A
    OneOnlyToOneOnly = "||..||",    // fk U N-N : N/A    OR     N/A : fk U N-N
    OneOnlyToZeroN = "||..o{",      // N/A : fk N-N
    ZeroNToZeroOne = "}o..o|",      // fk N : N/A
    ZeroNToOneOnly = "}o..||",      // fk N-N : N/A
}
/* Every relationship
    ZeroOneToOneOnly = "|o..||",    // N/A : fk U
    ZeroOneToZeroN = "|o..o{",      // N/A : fk N
    ZeroOneToOneN = "|o..|{",       // Impossible to infer, implemented programatically
    OneOnlyToZeroOne = "||..o|",    // fk U : N/A
    OneOnlyToOneOnly = "||..||",    // fk U N-N : N/A    OR     N/A : fk U N-N
    OneOnlyToZeroN = "||..o{",      // N/A : fk N-N
    OneOnlyToOneN = "||..|{",       // Impossible
    ZeroNToZeroOne = "}o..o|",      // fk N : N/A
    ZeroNToOneOnly = "}o..||",      // fk N-N : N/A
    ZeroNToZeroN = "}o..o{",        // Impossible to infer, implemented w/ a junction table
    ZeroNToOneN = "}o..|{",         // Impossible to infer, implemented w/ a junction table
    OneNToZeroOne = "}|..o|",       // Impossible to infer, implemented programatically
    OneNToOneOnly = "}|..||",       // Impossible
    OneNToZeroN = "}|..o{",         // Impossible to infer, implemented w/ a junction table
    OneNToOneN = "}|..|{"           // Impossible
*/


//=================================================================
// Query Result Interfaces
//=================================================================

export interface Row {
    dbms: string,
    table_catalog: string,
    table_schema: string,
    table_name: string,
    column_name: string,
    ordinal_position: number,
    data_type: string,
    character_maximum_length: number,
    constraint_type: string,
    nullable: string
  }
  
  export interface FieldInfo {
    columnID: number;
    dataTypeID: number;
    dataTypeModifier: number;
    dataTypeSize: number;
    format: string;
    name: string;
    tableID: number;
    display_type?: string;
  };
  
  export interface QueryResults {
    rowCount: number;
    command: string;
    rows?: Row[]; 
    fields?: FieldInfo[];
    flaggedForDeletion?: boolean;
    message?: string;
  };
  
  export interface TypeResult {
    oid: number;
    typname: string;
    display_type?: string;
  };
  
  export interface TypeResults {
    rowCount: number;
    command: string;
    rows?: TypeResult[];
    fields?: FieldInfo[];
  }