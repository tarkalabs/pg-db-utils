import {expect} from "chai";
import { Connection } from "../db/connection";
import { getStructure } from "..";
var deepEqual = require('deep-equal');

describe("Connection", () => {
  it("Should connect to database", async (done) => {
    let connection = new Connection({
      label: "Localhost",
      host: ((process.env.CI_ENV)? "postgres": "127.0.0.1"),
      user: "postgres",
      password: "postgres",
      port:5432,
      database:"dvdrental",
      connectionTimeoutMillis: 1000
    });

    expect(await connection.testConnection()).to.eql(true);
    done();
  })
});

describe("Incorrect Connection Details", () => {
  it("Should fail to connect to database", async (done) => {
    let connection = new Connection({
      label: "Localhost",
      host: ((process.env.CI_ENV)? "postgres": "127.0.0.1"),
      user: "postgres",
      password: "incorrect-password",
      port:5432,
      database:"dvdrental",
      connectionTimeoutMillis: 1000
    });

    expect(await connection.testConnection()).to.eql(false);
    done();
  })
});

describe("structure", () => {
  it("Returns true if structure is queried correctly", async (done) => {
    let connection = new Connection({
      label: "Localhost",
      host: ((process.env.CI_ENV)? "postgres": "127.0.0.1"),
      user: "postgres",
      password: "postgres",
      port:5432,
      database:"dvdrental",
      connectionTimeoutMillis: 1000
    });

    const result = await getStructure(connection);
    if (!result) {
      fail("There was an issue connecting to the database.");
      done();
      return;
    }
    
    let actual = {};
    let debug = "";
    result.tree.schemas.forEach(schema => {
      debug += schema.schemaName + "\n";
      actual[schema.schemaName] = [];
      schema.tables.forEach(table => {
        let actualTable = {
          name: table.tableName,
          columns: []
        }
        debug += "\t- " + table.tableName + "\n";
        table.columns.forEach(column => {
          actualTable.columns.push(column.columnName + " : " + column.data_type + ((column.pk)? " pk": "") + ((column.fk)? " fk": ""));
          debug += "\t\t- " + column.columnName + " : " + column.data_type + ((column.pk)? " pk": "") + ((column.fk)? " fk": "") + "\n";
        });
        actual[schema.schemaName].push(actualTable);
      });
    });

    if (process.env.DEBUG) {
      console.debug("structure: dbStructure => \n" + debug);

      console.debug("Actual: " + JSON.stringify(actual));
    }

    let expected = JSON.parse(`{"public":[{"name":"customer","columns":["customer_id : integer pk","store_id : smallint","email : character varying","last_update : timestamp without time zone","first_name : character varying","activebool : boolean","active : integer","last_name : character varying","address_id : smallint","create_date : date"]},{"name":"actor","columns":["actor_id : integer pk","last_update : timestamp without time zone","first_name : character varying","last_name : character varying"]},{"name":"category","columns":["category_id : integer pk","name : character varying","last_update : timestamp without time zone"]},{"name":"film","columns":["film_id : integer pk","replacement_cost : numeric","rental_duration : smallint","title : character varying","rental_rate : numeric","length : smallint","fulltext : tsvector","release_year : integer","language_id : smallint","last_update : timestamp without time zone","rating : USER-DEFINED","description : text","special_features : ARRAY"]},{"name":"film_actor","columns":["film_id : smallint pk","actor_id : smallint pk","last_update : timestamp without time zone"]},{"name":"film_category","columns":["category_id : smallint pk","film_id : smallint pk","last_update : timestamp without time zone"]},{"name":"address","columns":["address_id : integer pk","district : character varying","postal_code : character varying","address2 : character varying","last_update : timestamp without time zone","phone : character varying","address : character varying","city_id : smallint"]},{"name":"city","columns":["city_id : integer pk","last_update : timestamp without time zone","country_id : smallint","city : character varying"]},{"name":"country","columns":["country_id : integer pk","last_update : timestamp without time zone","country : character varying"]},{"name":"inventory","columns":["inventory_id : integer pk","store_id : smallint","last_update : timestamp without time zone","film_id : smallint"]},{"name":"language","columns":["language_id : integer pk","name : character","last_update : timestamp without time zone"]},{"name":"payment","columns":["payment_id : integer pk","payment_date : timestamp without time zone","staff_id : smallint","rental_id : integer","customer_id : smallint","amount : numeric"]},{"name":"rental","columns":["rental_id : integer pk","return_date : timestamp without time zone","staff_id : smallint","inventory_id : integer","customer_id : smallint","last_update : timestamp without time zone","rental_date : timestamp without time zone"]},{"name":"staff","columns":["staff_id : integer pk","active : boolean","picture : bytea","address_id : smallint","last_name : character varying","first_name : character varying","username : character varying","password : character varying","email : character varying","store_id : smallint","last_update : timestamp without time zone"]},{"name":"store","columns":["store_id : integer pk","last_update : timestamp without time zone","manager_staff_id : smallint","address_id : smallint"]}]}`);

    expect(deepEqual(expected, actual)).to.eql(true);
    done();
  })
})
