# MySQL MCP Server

A Model Context Protocol (MCP) server that provides MySQL database connectivity for Claude Code.

## Features

- Execute MySQL queries
- List tables in a database
- Describe table structure
- Secure connection handling with automatic cleanup

## Installation

1. Clone the repository:
```bash
git clone git@github.com:heyhayes/mysqlmcp.git
cd mysqlmcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### With Claude Code

After building the project, add the MCP server to Claude Code:

```bash
claude mcp add mysql node /path/to/mysql-mcp-server/dist/index.js
```

Or from within the project directory:
```bash
npm run build
claude mcp add mysql node dist/index.js
```

### As an MCP Server

The server runs on stdio and can be configured in other MCP clients:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/path/to/mysql-mcp-server/dist/index.js"]
    }
  }
}
```

### Available Tools

#### `mysql_query`
Execute any MySQL query.

**Parameters:**
- `query` (required): SQL query to execute
- `host` (optional): MySQL host (default: localhost)
- `port` (optional): MySQL port (default: 3306)
- `user` (required): MySQL username
- `password` (required): MySQL password
- `database` (required): Database name

#### `mysql_list_tables`
List all tables in the database.

**Parameters:**
- `host` (optional): MySQL host (default: localhost)
- `port` (optional): MySQL port (default: 3306)
- `user` (required): MySQL username
- `password` (required): MySQL password
- `database` (required): Database name

#### `mysql_describe_table`
Get the structure of a specific table.

**Parameters:**
- `table` (required): Table name to describe
- `host` (optional): MySQL host (default: localhost)
- `port` (optional): MySQL port (default: 3306)
- `user` (required): MySQL username
- `password` (required): MySQL password
- `database` (required): Database name

## Development

Run in development mode:
```bash
npm run dev
```

## Security Notes

- Credentials are required for each request and are not stored
- Connections are automatically closed after each operation
- Use environment variables or secure credential management in production