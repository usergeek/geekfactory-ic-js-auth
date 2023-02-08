import { ActorConfig, ActorSubclass, HttpAgentOptions, Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
export declare const getGlobalIC: () => any;
export type AuthAccount = {
    name: string;
    accountIdentifier: string;
};
export type ContextStatus = {
    inProgress: boolean;
    isReady: boolean;
    isLoggedIn: boolean;
};
export type ContextState = {
    identity: Identity | undefined;
    principal: Principal | undefined;
    accounts: Array<AuthAccount>;
    currentAccount: number | undefined;
};
export declare function getInitialContextStatus(): ContextStatus;
export declare function getInitialContextState(): ContextState;
export type LoginFnResult = {
    status: "success";
} | {
    status: "error";
    error: Error | undefined;
};
export type CreateActorOptions = {
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
};
export type CreateActorFn = <T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions) => Promise<ActorSubclass<T> | undefined>;
export declare function createActorGeneric<T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions): ActorSubclass<T>;
