import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import { ActorSubclass, HttpAgent } from "@dfinity/agent";
export declare const PlugHelper: {
    isAvailable: () => boolean;
    getLoggedInPrincipal: () => Promise<Principal | undefined>;
    login: (whitelist?: Array<string> | undefined) => Promise<{
        principal: Principal | undefined;
        agent: HttpAgent | undefined;
    } | undefined>;
    getPrincipal: () => Promise<Principal | undefined>;
    createActor: <T>(canisterId: string, interfaceFactory: IDL.InterfaceFactory) => Promise<ActorSubclass<T> | undefined>;
    logout: () => Promise<void>;
    requestBurnXTC: (amount: number, toCanisterId: string) => Promise<bigint | undefined>;
    requestTransfer: (to: string, amountE8S: number) => Promise<{
        height: number;
    }>;
};
