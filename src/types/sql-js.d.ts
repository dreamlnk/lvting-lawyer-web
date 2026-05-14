declare module "sql.js" {
  interface Database {
    run(sql: string, params?: any): void;
    exec(sql: string): Array<{ columns: string[]; values: any[][] }>;
    prepare(sql: string): any;
    export(): Uint8Array;
    close(): void;
  }

  interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  export default function initSqlJs(
    options?: { locateFile?: (file: string, prefix?: string) => string }
  ): Promise<SqlJsStatic>;
}
