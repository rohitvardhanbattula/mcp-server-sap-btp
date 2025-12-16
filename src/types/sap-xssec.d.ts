declare module '@sap/xssec' {
    export interface SecurityContext { getUserName(): string; getEmail(): string; }
    export function createSecurityContext(token: string, creds: any, cb: (err: any, ctx: any) => void): void;
}