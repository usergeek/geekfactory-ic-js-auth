import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer, useState} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {ActorSubclass} from "@dfinity/agent";
import {IDL} from '@dfinity/candid';
import {Principal} from "@dfinity/principal";
import {useCustomCompareCallback, useCustomCompareEffect, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash"
import {usePlugAuthProviderContext} from "./plug/PlugAuthProvider";
import {Source, useAuthSourceProviderContext} from "./authSource/AuthSourceProvider";
import {useInternetIdentityAuthProviderContext} from "./internetIdentity/InternetIdentityAuthProvider";
import {useStoicAuthProviderContext} from "./stoic/StoicAuthProvider";
import {useNFIDAuthProviderContext} from "./nfid/NFIDAuthProvider";
import {useInfinityWalletAuthProviderContext} from "./infinityWallet/InfinityWalletAuthProvider";
import {AuthAccount, ContextState, ContextStatus, CreateActorFn, CreateActorOptions, getInitialContextState, getInitialContextStatus, LoginFnResult} from "./AuthCommon";

type LoginParameters = {
    source: Source
    derivationOrigin?: string | URL
    maxTimeToLiveNanos?: bigint
}
type LoginFn = (parameters: LoginParameters) => Promise<LoginFnResult>
type LogoutFn = (source: Source) => Promise<void>
type SwitchAccountFn = (targetAccount: number) => void
type GetCurrentPrincipalFn = () => Principal | undefined
type GetCurrentAccountFn = () => AuthAccount | undefined

interface Context {
    source: Source
    status: ContextStatus
    state: ContextState
    login: LoginFn
    logout: LogoutFn
    switchAccount: SwitchAccountFn
    getCurrentPrincipal: GetCurrentPrincipalFn
    getCurrentAccount: GetCurrentAccountFn
    createActor: CreateActorFn
}

const initialContextValue: Context = {
    source: undefined,
    status: getInitialContextStatus(),
    state: getInitialContextState(),
    login: () => Promise.reject(),
    logout: () => undefined,
    switchAccount: (targetAccount: number) => undefined,
    getCurrentPrincipal: () => undefined,
    getCurrentAccount: () => undefined,
    createActor: () => Promise.resolve(undefined),
}


const AuthProviderContext = React.createContext<Context | undefined>(undefined)

export const useAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(AuthProviderContext)
    if (!context) {
        throw new Error("useAuthProviderContext must be used within a AuthProviderContext.Provider")
    }
    return context;
};

type Props = {
    onLogout?: () => void
}
export const AuthProvider = (props: PropsWithChildren<Props>) => {
    const authSourceProviderContext = useAuthSourceProviderContext();
    const plugAuthProviderContext = usePlugAuthProviderContext();
    const stoicAuthProviderContext = useStoicAuthProviderContext()
    const internetIdentityAuthProviderContext = useInternetIdentityAuthProviderContext();
    const nfidInternetIdentityAuthProviderContext = useNFIDAuthProviderContext();
    const infinityWalletAuthProviderContext = useInfinityWalletAuthProviderContext();

    const [contextSource, setContextSource] = useState<Source>(() => {
        return authSourceProviderContext.source
    })

    const [contextStatus, updateContextStatus] = useReducer<Reducer<ContextStatus, Partial<ContextStatus>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.status)
    )

    const [contextState, updateContextState] = useReducer<Reducer<ContextState, Partial<ContextState>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.state)
    )

    const login: LoginFn = useCallback<LoginFn>(async (parameters: LoginParameters) => {
        const {source, derivationOrigin, maxTimeToLiveNanos} = parameters
        switch (source) {
            case "Plug": {
                return plugAuthProviderContext.login()
            }
            case "II": {
                return internetIdentityAuthProviderContext.login({
                    derivationOrigin,
                    maxTimeToLiveNanos
                })
            }
            case "NFID": {
                return nfidInternetIdentityAuthProviderContext.login({
                    derivationOrigin,
                    maxTimeToLiveNanos
                })
            }
            case "Stoic": {
                return stoicAuthProviderContext.login()
            }
            case "InfinityWallet": {
                return infinityWalletAuthProviderContext.login()
            }
        }
        return {status: "error", error: new Error("unknownSourceError")}
    }, [plugAuthProviderContext.login, internetIdentityAuthProviderContext.login,
        nfidInternetIdentityAuthProviderContext.login, stoicAuthProviderContext.login,
        infinityWalletAuthProviderContext.login])

    const logout: LogoutFn = useCallback<LogoutFn>(async (source: Source): Promise<void> => {
        switch (source) {
            case "Plug": {
                await plugAuthProviderContext.logout()
                break
            }
            case "II": {
                await internetIdentityAuthProviderContext.logout()
                break
            }
            case "NFID": {
                await nfidInternetIdentityAuthProviderContext.logout()
                break
            }
            case "Stoic": {
                await stoicAuthProviderContext.logout()
                break
            }
            case "InfinityWallet": {
                await infinityWalletAuthProviderContext.logout()
                break
            }
        }
        if (props.onLogout && typeof props.onLogout === "function") {
            props.onLogout()
        }
    }, [plugAuthProviderContext.logout, internetIdentityAuthProviderContext.logout,
        nfidInternetIdentityAuthProviderContext.logout, stoicAuthProviderContext.logout,
        infinityWalletAuthProviderContext.logout, props.onLogout])

    const switchAccount: SwitchAccountFn = useCustomCompareCallback((targetAccount: number) => {
        if (contextState.accounts.length > targetAccount) {
            const newContextState = {
                ...contextState,
                currentAccount: targetAccount
            };
            updateContextState(newContextState)
        }
    }, [contextState], _.isEqual)

    const getCurrentPrincipal: GetCurrentPrincipalFn = useCustomCompareCallback(() => {
        if (contextStatus.isReady && contextStatus.isLoggedIn && contextState.principal != undefined) {
            return contextState.principal
        }
        return undefined
    }, [contextState.principal, contextStatus], _.isEqual)

    const getCurrentAccount: GetCurrentAccountFn = useCustomCompareCallback(() => {
        if (contextState.currentAccount != undefined && contextState.accounts.length > contextState.currentAccount) {
            return contextState.accounts[contextState.currentAccount]
        }
        return undefined
    }, [contextState], _.isEqual)

    const createActor: CreateActorFn = useCustomCompareCallback(async (canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions) => {
        let actor: ActorSubclass<any> | undefined = undefined
        switch (contextSource) {
            case "Plug": {
                actor = await plugAuthProviderContext.createActor(canisterId, idlFactory, options)
                break;
            }
            case "II": {
                actor = await internetIdentityAuthProviderContext.createActor(canisterId, idlFactory, options)
                break;
            }
            case "NFID": {
                actor = await nfidInternetIdentityAuthProviderContext.createActor(canisterId, idlFactory, options)
                break;
            }
            case "Stoic": {
                actor = await stoicAuthProviderContext.createActor(canisterId, idlFactory, options)
                break;
            }
            case "InfinityWallet": {
                actor = await infinityWalletAuthProviderContext.createActor(canisterId, idlFactory, options)
                break;
            }
        }
        return actor
    }, [contextSource], _.isEqual)

    useCustomCompareEffect(() => {
        const source = authSourceProviderContext.source;
        let status: ContextStatus = _.cloneDeep(initialContextValue.status)
        let state: ContextState = _.cloneDeep(initialContextValue.state)
        switch (source) {
            case "Plug": {
                status = plugAuthProviderContext.status
                state = {
                    identity: plugAuthProviderContext.state.identity,
                    agent: plugAuthProviderContext.state.agent,
                    principal: plugAuthProviderContext.state.principal,
                    accounts: plugAuthProviderContext.state.accounts,
                    currentAccount: 0,
                }
                break
            }
            case "II": {
                status = internetIdentityAuthProviderContext.status
                state = {
                    identity: internetIdentityAuthProviderContext.state.identity,
                    agent: undefined,
                    principal: internetIdentityAuthProviderContext.state.principal,
                    accounts: internetIdentityAuthProviderContext.state.accounts,
                    currentAccount: 0,
                }
                break
            }
            case "NFID": {
                status = nfidInternetIdentityAuthProviderContext.status
                state = {
                    identity: nfidInternetIdentityAuthProviderContext.state.identity,
                    agent: undefined,
                    principal: nfidInternetIdentityAuthProviderContext.state.principal,
                    accounts: nfidInternetIdentityAuthProviderContext.state.accounts,
                    currentAccount: 0,
                }
                break
            }
            case "Stoic": {
                status = stoicAuthProviderContext.status
                state = {
                    identity: stoicAuthProviderContext.state.identity,
                    agent: undefined,
                    principal: stoicAuthProviderContext.state.principal,
                    accounts: stoicAuthProviderContext.state.accounts,
                    currentAccount: 0,
                }
                break
            }
            case "InfinityWallet": {
                status = infinityWalletAuthProviderContext.status
                state = {
                    identity: infinityWalletAuthProviderContext.state.identity,
                    agent: undefined,
                    principal: infinityWalletAuthProviderContext.state.principal,
                    accounts: infinityWalletAuthProviderContext.state.accounts,
                    currentAccount: 0,
                }
                break
            }
            default: {
                const isReady = _.some([
                    plugAuthProviderContext.status,
                    internetIdentityAuthProviderContext.status,
                    nfidInternetIdentityAuthProviderContext.status,
                    stoicAuthProviderContext.status,
                    infinityWalletAuthProviderContext.status,
                ], value => {
                    return value.isReady
                });
                status.isReady = isReady
            }
        }
        unstable_batchedUpdates(() => {
            setContextSource(source)
            updateContextStatus(status)
            updateContextState(state)
        })
    }, [
        authSourceProviderContext.source,
        plugAuthProviderContext.status,
        plugAuthProviderContext.state,
        internetIdentityAuthProviderContext.status,
        internetIdentityAuthProviderContext.state,
        nfidInternetIdentityAuthProviderContext.status,
        nfidInternetIdentityAuthProviderContext.state,
        stoicAuthProviderContext.status,
        stoicAuthProviderContext.state,
        infinityWalletAuthProviderContext.status,
        infinityWalletAuthProviderContext.state,
    ], _.isEqual)

    const value = useCustomCompareMemo<Context, [
        Source,
        ContextStatus,
        ContextState,
        LoginFn,
        LogoutFn,
        SwitchAccountFn,
        GetCurrentPrincipalFn,
        GetCurrentAccountFn,
        CreateActorFn,
    ]>(() => ({
        source: contextSource,
        status: contextStatus,
        state: contextState,
        login: login,
        logout: logout,
        switchAccount: switchAccount,
        getCurrentPrincipal: getCurrentPrincipal,
        getCurrentAccount: getCurrentAccount,
        createActor: createActor,
    }), [
        contextSource,
        contextStatus,
        contextState,
        login,
        logout,
        switchAccount,
        getCurrentPrincipal,
        getCurrentAccount,
        createActor,
    ], _.isEqual)

    return <AuthProviderContext.Provider value={value}>
        {props.children}
    </AuthProviderContext.Provider>
}

