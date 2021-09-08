// This is a wrapper file to check if current system can use import

export async function importDefault(filepath: string): Promise<any> {
  return (await import(filepath)).default;
}
