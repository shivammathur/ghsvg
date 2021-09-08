export declare function getRange(
  type: string,
  cliOpts: Record<string, any>,
  configOpts: Record<string, any>
): Promise<string | number[]>;
export declare function getOptions(
  args: string[]
): Promise<Record<string, any>>;
