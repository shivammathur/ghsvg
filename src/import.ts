// This is a wrapper file to check if current system can use import

export async function importDefault(filepath: string) {
  return (await import(filepath)).default;
}
