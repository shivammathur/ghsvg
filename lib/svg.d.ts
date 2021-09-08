/// <reference types="node" />
export declare function compareDeps(a: string, b: string): number;
export declare function createSVG(data: Record<string, any>[], ghsOptions: Record<string, any>): Promise<string>;
export declare function getBase64Image(data: Buffer, format: string): string;
export declare function getAvatar(avatarUrl: string, avatarCache: string, format: string): Promise<string>;
