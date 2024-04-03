import { Identity } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { IISource } from "./InternetIdentityAuthProvider";
type LoginParameters = {
    authClient: AuthClient;
    identityProviderURL: string | undefined;
    source: IISource;
    derivationOrigin?: string | URL;
    maxTimeToLiveNanos?: bigint;
};
export declare const AuthClientFacade: {
    provideAuthClient: () => Promise<AuthClient | undefined>;
    restoreIdentity: (authClient: AuthClient) => Promise<Identity | undefined>;
    login: (parameters: LoginParameters) => Promise<Identity | undefined>;
    logout: (authClient: AuthClient, options?: {
        returnTo?: string;
    }) => Promise<void>;
};
export {};
