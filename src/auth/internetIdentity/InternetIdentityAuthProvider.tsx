import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {Identity} from "@dfinity/agent";
import {IDL} from "@dfinity/candid";
import {useCustomCompareCallback, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash";
import {Source, useAuthSourceProviderContext} from "../authSource/AuthSourceProvider";
import {AuthClientFacade} from "./AuthClientFacade";
import {Util} from "../util";
import {AuthAccount, ContextState, ContextStatus, CreateActorFn, createActorGeneric, CreateActorOptions, getInitialContextState, getInitialContextStatus, LoginFnResult} from "../AuthCommon";

type LoginParameters = {
    derivationOrigin?: string | URL
    maxTimeToLiveNanos?: bigint
}
type LoginFn = (parameters: LoginParameters) => Promise<LoginFnResult>
type LogoutFn = () => void

export interface Context {
    status: ContextStatus
    state: ContextState
    login: LoginFn
    logout: LogoutFn
    createActor: CreateActorFn
}

const initialContextValue: Context = {
    status: getInitialContextStatus(),
    state: getInitialContextState(),
    login: () => Promise.reject(),
    logout: () => undefined,
    createActor: () => Promise.resolve(undefined),
}

export const InternetIdentityAuthProviderContext: React.Context<Context | undefined> = React.createContext<Context | undefined>(undefined)
export const useInternetIdentityAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(InternetIdentityAuthProviderContext);
    if (!context) {
        throw new Error("useInternetIdentityAuthProviderContext must be used within a InternetIdentityAuthProviderContext.Provider")
    }
    return context;
};

export type IISource = Extract<Source, "II" | "NFID">

const source: Source = "II"
type Props = {
    identityProviderURL?: string
}
export const InternetIdentityAuthProvider = (props: PropsWithChildren<Props>) => {

    const authSourceProviderContext = useAuthSourceProviderContext();

    const [contextStatus, updateContextStatus] = useReducer<Reducer<ContextStatus, Partial<ContextStatus>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.status)
    )

    const [contextState, updateContextState] = useReducer<Reducer<ContextState, Partial<ContextState>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.state)
    )

    const login: LoginFn = useCallback<LoginFn>(async (parameters: LoginParameters) => {
        const {derivationOrigin, maxTimeToLiveNanos} = parameters
        try {
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(source)
                updateContextStatus({inProgress: true})
            })
            const authClient = await AuthClientFacade.provideAuthClient();
            if (authClient) {
                const identity: Identity | undefined = await AuthClientFacade.login({
                    authClient,
                    identityProviderURL: props.identityProviderURL,
                    derivationOrigin,
                    source: source,
                    maxTimeToLiveNanos: maxTimeToLiveNanos
                })
                if (identity) {
                    const accounts = await getIdentityAccounts(identity)
                    unstable_batchedUpdates(() => {
                        updateContextStatus({isLoggedIn: true, inProgress: false})
                        updateContextState({identity: identity, principal: identity.getPrincipal(), accounts: accounts})
                    })
                    return {status: "success"}
                }
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, principal: undefined, accounts: []})
            })
            return {status: "error", error: new Error("unknownError")}
        } catch (e) {
            console.error("InternetIdentityAuthProvider: login: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, principal: undefined, accounts: []})
            })
            return {status: "error", error: typeof e === "string" ? new Error(e) : e}
        }
    }, [source, props.identityProviderURL])

    const logout: LogoutFn = useCallback<LogoutFn>(async () => {
        const authClient = await AuthClientFacade.provideAuthClient();
        try {
            if (authClient) {
                await AuthClientFacade.logout(authClient)
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false})
                updateContextState({identity: undefined, principal: undefined, accounts: []})
            })
        } catch (e) {
            console.error("InternetIdentityAuthProvider: logout: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false})
                updateContextState({identity: undefined, principal: undefined, accounts: []})
            })
        }

    }, [])

    const createActor: CreateActorFn = useCustomCompareCallback(async function <T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions) {
        const createActorResult = await createActorGeneric<T>(canisterId, idlFactory, options);
        if (createActorResult != undefined) {
            return createActorResult
        }
    }, [], _.isEqual)

    useEffect(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == source) {
                    updateContextStatus({inProgress: true})
                    const authClient = await AuthClientFacade.provideAuthClient();
                    if (authClient) {
                        const identity = await AuthClientFacade.restoreIdentity(authClient)
                        if (identity) {
                            const accounts = await getIdentityAccounts(identity)
                            unstable_batchedUpdates(() => {
                                updateContextStatus({isReady: true, isLoggedIn: true, inProgress: false})
                                updateContextState({identity: identity, principal: identity.getPrincipal(), accounts: accounts})
                            })
                            return
                        }
                    }
                }
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == source) {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, principal: undefined, accounts: []})
                })
            } catch (e) {
                console.error("InternetIdentityAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == source) {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, principal: undefined, accounts: []})
                })
            }
        })()
    }, [source])

    const value = useCustomCompareMemo<Context, [
        ContextStatus,
        ContextState,
        LoginFn,
        LogoutFn,
        CreateActorFn,
    ]>(() => ({
        status: contextStatus,
        state: contextState,
        login: login,
        logout: logout,
        createActor: createActor,
    }), [
        contextStatus,
        contextState,
        login,
        logout,
        createActor,
    ], _.isEqual)

    return <InternetIdentityAuthProviderContext.Provider value={value}>
        {props.children}
    </InternetIdentityAuthProviderContext.Provider>
}

const getIdentityAccounts = async (identity: Identity): Promise<Array<AuthAccount>> => {
    try {
        return [{
            name: "Internet Identity",
            accountIdentifier: Util.principalToAccountIdentifier(identity.getPrincipal().toText(), 0)
        }]
    } catch (e) {
        return []
    }
}
