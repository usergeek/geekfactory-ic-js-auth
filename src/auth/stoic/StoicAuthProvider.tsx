import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {IDL} from "@dfinity/candid";
import {useCustomCompareCallback, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash";
import {StoicIdentity} from "ic-stoic-identity";
import {useAuthSourceProviderContext} from "../authSource/AuthSourceProvider";
import {AuthAccount, ContextState, ContextStatus, CreateActorFn, createActorGeneric, CreateActorOptions, getInitialContextState, getInitialContextStatus, LoginFnResult} from "../AuthCommon";

type LoginFn = () => Promise<LoginFnResult>
type LogoutFn = () => Promise<void>

interface Context {
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

const StoicAuthProviderContext = React.createContext<Context | undefined>(undefined)
export const useStoicAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(StoicAuthProviderContext);
    if (!context) {
        throw new Error("useStoicAuthProviderContext must be used within a StoicAuthProviderContext.Provider")
    }
    return context;
};

type Props = {}

export const StoicAuthProvider = (props: PropsWithChildren<Props>) => {
    const authSourceProviderContext = useAuthSourceProviderContext();

    const [contextStatus, updateContextStatus] = useReducer<Reducer<ContextStatus, Partial<ContextStatus>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.status)
    )

    const [contextState, updateContextState] = useReducer<Reducer<ContextState, Partial<ContextState>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.state)
    )

    const login: LoginFn = useCallback<LoginFn>(async () => {
        try {
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource("Stoic")
                updateContextStatus({inProgress: true})
            })
            const identity = await StoicIdentity.connect();
            if (identity) {
                const accounts = await getIdentityAccounts(identity)
                unstable_batchedUpdates(() => {
                    updateContextStatus({isLoggedIn: true, inProgress: false})
                    updateContextState({identity: identity, principal: identity.getPrincipal(), accounts: accounts})
                })
                return {status: "success"}
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, principal: undefined, accounts: []})
            })
            return {status: "error", error: new Error("unknownError")}
        } catch (e) {
            console.error("StoicAuthProvider: login: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, principal: undefined, accounts: []})
            })
            return {status: "error", error: typeof e === "string" ? new Error(e) : e}
        }
    }, [])

    const logout: LogoutFn = useCallback<LogoutFn>(async () => {
        StoicIdentity.disconnect();
        unstable_batchedUpdates(() => {
            authSourceProviderContext.setSource(undefined)
            updateContextStatus({isLoggedIn: false})
            updateContextState({identity: undefined, principal: undefined, accounts: []})
        })
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
                if (authSourceProviderContext.source == "Stoic") {
                    updateContextStatus({inProgress: true})
                    const identity = await StoicIdentity.load();
                    if (identity) {
                        const accounts = await getIdentityAccounts(identity)
                        unstable_batchedUpdates(() => {
                            updateContextStatus({isReady: true, isLoggedIn: true, inProgress: false})
                            updateContextState({identity: identity, principal: identity.getPrincipal(), accounts: accounts})
                        })
                        return
                    }
                }
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "Stoic") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, principal: undefined, accounts: []})
                })
            } catch (e) {
                console.error("StoicAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "Stoic") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, principal: undefined, accounts: []})
                })
            }
        })()
    }, [])

    const value = useCustomCompareMemo<Context, [
        ContextStatus,
        ContextState,
        LoginFn,
        LogoutFn,
        CreateActorFn
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

    return <StoicAuthProviderContext.Provider value={value}>
        {props.children}
    </StoicAuthProviderContext.Provider>
}

const getIdentityAccounts = async (identity: any): Promise<Array<AuthAccount>> => {
    try {
        const accountsResult = JSON.parse(await identity.accounts())
        // noinspection UnnecessaryLocalVariableJS
        const accounts: Array<AuthAccount> = _.map<any, AuthAccount>(accountsResult, v => ({
            name: v.name,
            accountIdentifier: v.address
        }))
        return accounts
    } catch (e) {
        return []
    }
}