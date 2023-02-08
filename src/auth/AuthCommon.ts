import {Actor, ActorConfig, ActorSubclass, HttpAgent, HttpAgentOptions, Identity} from "@dfinity/agent";
import {Principal} from "@dfinity/principal";
import _ from "lodash";
import {IDL} from "@dfinity/candid";

export const getGlobalIC = () => {
    // @ts-ignore
    return window.ic
}
export type AuthAccount = {
    name: string
    accountIdentifier: string
}
export type ContextStatus = {
    inProgress: boolean
    isReady: boolean
    isLoggedIn: boolean
}
export type ContextState = {
    identity: Identity | undefined
    principal: Principal | undefined
    accounts: Array<AuthAccount>
    currentAccount: number | undefined
}

export function getInitialContextStatus(): ContextStatus {
    return _.cloneDeep({
        inProgress: false,
        isReady: false,
        isLoggedIn: false,
    })
}

export function getInitialContextState(): ContextState {
    return _.cloneDeep({
        identity: undefined,
        principal: undefined,
        accounts: [],
        currentAccount: undefined,
    })
}

export type LoginFnResult = { status: "success" } | { status: "error", error: Error | undefined }

export type CreateActorOptions = { agentOptions?: HttpAgentOptions; actorOptions?: ActorConfig }
export type CreateActorFn = <T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions) => Promise<ActorSubclass<T> | undefined>

export function createActorGeneric<T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions): ActorSubclass<T> {
    const agent = new HttpAgent({...options?.agentOptions});

    // Fetch root key for certificate validation during development
    if (process.env.NODE_ENV !== "production") {
        agent.fetchRootKey().catch(err => {
            console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
            console.error(err);
        });
    }

    // Creates an actor with using the candid interface and the HttpAgent
    return Actor.createActor<T>(idlFactory, {
        agent,
        canisterId: canisterId,
        ...options?.actorOptions
    });
}