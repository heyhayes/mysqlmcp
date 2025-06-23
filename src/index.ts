#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

class MySQLMCPServer {
  private server: Server;
  private connection: mysql.Connection | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "mysql-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private async connect(config: DatabaseConfig): Promise<void> {
    try {
      this.connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
      });
    } catch (error) {
      throw new Error(`Failed to connect to MySQL: ${error}`);
    }
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "mysql_query",
          description: "Execute a MySQL query and return results",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "SQL query to execute",
              },
              host: {
                type: "string",
                description: "MySQL host",
                default: "localhost",
              },
              port: {
                type: "number",
                description: "MySQL port",
                default: 3306,
              },
              user: {
                type: "string",
                description: "MySQL username",
              },
              password: {
                type: "string",
                description: "MySQL password",
              },
              database: {
                type: "string",
                description: "Database name",
              },
            },
            required: ["query", "user", "password", "database"],
          },
        },
        {
          name: "mysql_describe_table",
          description: "Describe the structure of a MySQL table",
          inputSchema: {
            type: "object",
            properties: {
              table: {
                type: "string",
                description: "Table name to describe",
              },
              host: {
                type: "string",
                description: "MySQL host",
                default: "localhost",
              },
              port: {
                type: "number",
                description: "MySQL port",
                default: 3306,
              },
              user: {
                type: "string",
                description: "MySQL username",
              },
              password: {
                type: "string",
                description: "MySQL password",
              },
              database: {
                type: "string",
                description: "Database name",
              },
            },
            required: ["table", "user", "password", "database"],
          },
        },
        {
          name: "mysql_list_tables",
          description: "List all tables in the database",
          inputSchema: {
            type: "object",
            properties: {
              host: {
                type: "string",
                description: "MySQL host",
                default: "localhost",
              },
              port: {
                type: "number",
                description: "MySQL port",
                default: 3306,
              },
              user: {
                type: "string",
                description: "MySQL username",
              },
              password: {
                type: "string",
                description: "MySQL password",
              },
              database: {
                type: "string",
                description: "Database name",
              },
            },
            required: ["user", "password", "database"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const config: DatabaseConfig = {
          host: args.host || "localhost",
          port: args.port || 3306,
          user: args.user,
          password: args.password,
          database: args.database,
        };

        await this.connect(config);

        switch (name) {
          case "mysql_query":
            return await this.executeQuery(args.query);

          case "mysql_describe_table":
            return await this.describeTable(args.table);

          case "mysql_list_tables":
            return await this.listTables();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      } finally {
        if (this.connection) {
          await this.connection.end();
          this.connection = null;
        }
      }
    });
  }

  private async executeQuery(query: string) {
    if (!this.connection) {
      throw new Error("No database connection");
    }

    const [rows] = await this.connection.execute(query);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  }

  private async describeTable(tableName: string) {
    if (!this.connection) {
      throw new Error("No database connection");
    }

    const [rows] = await this.connection.execute(`DESCRIBE ${tableName}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  }

  private async listTables() {
    if (!this.connection) {
      throw new Error("No database connection");
    }

    const [rows] = await this.connection.execute("SHOW TABLES");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      if (this.connection) {
        await this.connection.end();
      }
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MySQL MCP server running on stdio");
  }
}

const server = new MySQLMCPServer();
server.run().catch(console.error);
