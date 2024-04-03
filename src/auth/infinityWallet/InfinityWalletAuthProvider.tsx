import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {IDL} from "@dfinity/candid";
import {Principal} from "@dfinity/principal";
import {useCustomCompareCallback, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash";
import {useAuthSourceProviderContext} from "../authSource/AuthSourceProvider";
import {InfinityWalletHelper} from "./infinityWalletHelper";
import {Util} from "../util";
import {AuthAccount, ContextState, ContextStatus, CreateActorFn, CreateActorOptions, getInitialContextState, getInitialContextStatus, LoginFnResult} from "../AuthCommon";
import {promiseWithTimeout} from "geekfactory-js-util";

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

const InfinityWalletAuthProviderContext = React.createContext<Context | undefined>(undefined)
export const useInfinityWalletAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(InfinityWalletAuthProviderContext);
    if (!context) {
        throw new Error("useInfinityWalletAuthProviderContext must be used within a InfinityWalletAuthProviderContext.Provider")
    }
    return context;
};

type Props = {
    whitelist?: Array<string>
    autologinTimeout?: number
}

export const InfinityWalletAuthProvider = (props: PropsWithChildren<Props>) => {
    const authSourceProviderContext = useAuthSourceProviderContext();

    const [contextStatus, updateContextStatus] = useReducer<Reducer<ContextStatus, Partial<ContextStatus>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.status)
    )

    const [contextState, updateContextState] = useReducer<Reducer<ContextState, Partial<ContextState>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.state)
    )

    const login: LoginFn = useCustomCompareCallback<LoginFn, [Array<string> | undefined]>(async () => {
        try {
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource("InfinityWallet")
                updateContextStatus({inProgress: true})
            })
            console.log("InfinityWallet.login: will call 'await InfinityWalletHelper.login' with whitelist", props.whitelist);
            const principal = await InfinityWalletHelper.login(props.whitelist)
            console.log("InfinityWallet.login: got principal", principal, principal?.toText());
            if (principal) {
                const accounts = await getPrincipalAccounts(principal)
                unstable_batchedUpdates(() => {
                    updateContextStatus({isLoggedIn: true, inProgress: false})
                    updateContextState({principal: principal, accounts: accounts})
                })
                return {status: "success"}
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({principal: undefined, accounts: []})
            })
            return {status: "error", error: new Error("unknownError")}
        } catch (e) {
            console.error("InfinityWalletAuthProvider: login: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({principal: undefined, accounts: []})
            })
            return {status: "error", error: typeof e === "string" ? new Error(e) : e}
        }
    }, [props.whitelist], _.isEqual)

    const logout: LogoutFn = useCallback<LogoutFn>(async () => {
        await InfinityWalletHelper.logout()
        unstable_batchedUpdates(() => {
            authSourceProviderContext.setSource(undefined)
            updateContextStatus({isLoggedIn: false})
            updateContextState({principal: undefined, accounts: []})
        })
    }, [])

    const createActor: CreateActorFn = useCustomCompareCallback(async function <T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions) {
        console.log("InfinityWalletAuthProvider: start with", {canisterId, idlFactory, options});
        const createActorResult = await InfinityWalletHelper.createActor<T>(canisterId, idlFactory);
        console.log("InfinityWalletAuthProvider: createActorResult", createActorResult);
        if (createActorResult != undefined) {
            return createActorResult
        }
    }, [], _.isEqual)

    useEffect(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == "InfinityWallet") {
                    updateContextStatus({inProgress: true})
                    const timeoutMillis: number = props.autologinTimeout == undefined ? 30000 : props.autologinTimeout;
                    console.log(`InfinityWallet.autologin: will call 'await InfinityWalletHelper.getLoggedInPrincipal' with timeout ${timeoutMillis}ms, whitelist`, props.whitelist);
                    const principal = await promiseWithTimeout(InfinityWalletHelper.getLoggedInPrincipal(props.whitelist), timeoutMillis, new Error(`InfinityWalletHelper.getLoggedInPrincipal timed out in ${timeoutMillis}ms!`))
                    console.log("InfinityWallet.autologin: got principal", principal, principal?.toText());
                    if (principal) {
                        const accounts = await getPrincipalAccounts(principal)
                        unstable_batchedUpdates(() => {
                            updateContextStatus({isReady: true, isLoggedIn: true, inProgress: false})
                            updateContextState({principal: principal, accounts: accounts})
                        })
                        return
                    }
                }
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "InfinityWallet") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({principal: undefined, accounts: []})
                })
            } catch (e) {
                console.error("InfinityWalletAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "InfinityWallet") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({principal: undefined, accounts: []})
                })
            }
        })()
    }, [props.autologinTimeout])

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
        createActor
    ], _.isEqual)

    return <InfinityWalletAuthProviderContext.Provider value={value}>
        {props.children}
    </InfinityWalletAuthProviderContext.Provider>
}

const getPrincipalAccounts = async (principal: Principal): Promise<Array<AuthAccount>> => {
    try {
        return [{
            name: "Infinity Wallet",
            accountIdentifier: Util.principalToAccountIdentifier(principal.toText(), 0)
        }]
    } catch (e) {
        return []
    }
}