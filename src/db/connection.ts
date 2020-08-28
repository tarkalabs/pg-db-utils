'use strict'

import { Client } from "pg";
import { erdFieldsSql } from '../sql/erd-fields';
import { QueryResults } from '../structure/interfaces';


export class Connection {
  private client: Client;
  public connected: boolean;

  // Constructor creates a client with supplied connection options
  constructor(connectionOptions) {
    this.client = new Client(connectionOptions);

    this.client.on('end', () => {
      this.connected = false;
    });
    
    this.client.on('error', err => {
      console.error('@tarkalabs/pg-db-utils has encountered an error: ', err.stack)
    });
  }

  // Test Connection tests the clients connectionOptions
  // Returns true if the connection is valid false otherwise
  public async testConnection(): Promise<boolean> {
    try {
      await this.client.connect();
    } catch(err) {
      if (process.env.DEBUG) {
        console.debug("Failed to Test Connection: " + err);
      }
      return false;
    } finally {
      await this.client.end(); 
    }
    return true;
  }

  // Connect returns true if the connection was successful
  public async connect(): Promise<boolean> {
    try {
      await this.client.connect();
    } catch (err) {
      if (process.env.DEBUG) {
        console.debug("Failed to Connect: " + err);
      }
      return false;
    } 
    return true;
  }

  // Runs a query and returns the results.
  // In the case of an unsuccessful connection returns a result with the cooresponding error
  public async runQuery<T>(query: string) {
    try {
      if (!await this.connect()) {
        return {
          rowCount: 0,
          command: "Connect",
          rows: [],
          fields: [],
          message: "Client Failed To Connect"
        };
      }

      const res: QueryResults | QueryResults[] = await this.client.query({ text: query });

      return res
    } catch (e) {
      console.error(e);
    } finally {
      await this.client.end();
    }
  }
  
  // Returns 
  public async getStructure() {
    let res: QueryResults;

    try {
      const query = erdFieldsSql;
      res = await this.runQuery(query);

      const results: QueryResults[] = Array.isArray(res) ? res : [res];
      
      if (results) {
        if (results.length > 1) {
          return results[1];
        } else {
          return results[0];
        }
      }

      return {
        rowCount: 0,
        command: "getStructure",
        rows: [],
        fields: [],
        message: "Client Failed To Query The Database"
      };
    } catch (e) {
      console.error(e);
    }
  }   
}
