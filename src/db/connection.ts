'use strict'

import * as fs from 'fs';
import { ClientConfig, Client } from "pg";
import { IConnection } from './IConnection';
import { erdFieldsSql } from '../sql/erd-fields';
import { QueryResults } from '../structure/interfaces';



export class Connection {
    private static client: Client;
    private static connectionOptions: IConnection;

    public static setup(connectionOptions: IConnection) {
      Connection.connectionOptions = connectionOptions;
    }
    
    private static disconnect() {
      if (Connection.client) {
        Connection.client.end();
      }
    }

    //"postgres://dev:1234@127.0.0.1:5432/example";
    private static async connect() {
      Connection.client = new Client(Connection.connectionOptions);

      await Connection.client.connect();
    }

    public static async runQuery<T>(query: string) {
      Connection.connect();
      try {
        const res: QueryResults | QueryResults[] = await Connection.client.query({ text: query });
        const results: QueryResults[] = Array.isArray(res) ? res : [res];

        return results
      } catch (e) {
        console.error(e);
      } finally {
        Connection.disconnect();
      }
    }
    
    public static async getStructure() {
      let results: QueryResults;

      try {
        const query = erdFieldsSql;
        results = (await Connection.runQuery(query))[1];
      } catch (e) {
        console.error(e);
      } finally {
        return results;
      }
    }   
}