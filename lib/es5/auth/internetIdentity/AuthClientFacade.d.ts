import { Identity } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { IISource } from "./InternetIdentityAuthProvider";
export declare const AuthClientFacade: {
    provideAuthClient: () => Promise<AuthClient | undefined>;
    restoreIdentity: (authClient: AuthClient) => Promise<Identity | undefined>;
    login: (authClient: AuthClient, identityProviderURL: string | undefined, source: IISource) => Promise<Identity | undefined>;
    logout: (authClient: AuthClient, options?: {
        returnTo?: string;
    }) => Promise<void>;
};
