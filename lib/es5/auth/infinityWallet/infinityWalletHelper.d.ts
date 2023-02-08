import { ActorSubclass } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
export declare const InfinityWalletHelper: {
    isAvailable: () => boolean;
    getLoggedInPrincipal: (whitelist?: Array<string> | undefined) => Promise<Principal | undefined>;
    login: (whitelist?: Array<string> | undefined) => Promise<Principal | undefined>;
    getPrincipal: () => Promise<Principal | undefined>;
    createActor: <T>(canisterId: string, interfaceFactory: IDL.InterfaceFactory) => Promise<ActorSubclass<T>>;
    logout: () => Promise<void>;
    requestTransfer: (to: string, amountE8S: bigint) => Promise<any>;
};
