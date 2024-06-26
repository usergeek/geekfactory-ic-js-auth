import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {IDL} from "@dfinity/candid";
import {Principal} from "@dfinity/principal";
import {useCustomCompareCallback, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash";
import {useAuthSourceProviderContext} from "../authSource/AuthSourceProvider";
import {PlugHelper} from "./plugHelper";
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

const PlugAuthProviderContext = React.createContext<Context | undefined>(undefined)
export const usePlugAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(PlugAuthProviderContext);
    if (!context) {
        throw new Error("usePlugAuthProviderContext must be used within a PlugAuthProviderContext.Provider")
    }
    return context;
};

type Props = {
    whitelist?: Array<string>
    autologinTimeout?: number
}

export const PlugAuthProvider = (props: PropsWithChildren<Props>) => {
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
                authSourceProviderContext.setSource("Plug")
                updateContextStatus({inProgress: true})
            })
            console.log("Plug.login: will call 'await PlugHelper.login' with whitelist", props.whitelist);
            const loginResult: { principal: Principal | undefined/*, agent: HttpAgent | undefined*/ } | undefined = await PlugHelper.login(props.whitelist);
            const {principal/*, agent*/} = loginResult || {}
            console.log("Plug.login: got principal", principal, principal?.toText());
            if (principal != undefined/* && agent != undefined*/) {
                const accounts = await getPrincipalAccounts(principal)
                unstable_batchedUpdates(() => {
                    updateContextStatus({isLoggedIn: true, inProgress: false})
                    updateContextState({agent: undefined/*agent*/, principal: principal, accounts: accounts})
                })
                return {status: "success"}
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({agent: undefined, principal: undefined, accounts: []})
            })
            return {status: "error", error: new Error("unknownError")}
        } catch (e) {
            console.error("PlugAuthProvider: login: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({agent: undefined, principal: undefined, accounts: []})
            })
            return {status: "error", error: typeof e === "string" ? new Error(e) : e}
        }
    }, [props.whitelist], _.isEqual)

    const logout: LogoutFn = useCallback<LogoutFn>(async () => {
        await PlugHelper.logout()
        unstable_batchedUpdates(() => {
            authSourceProviderContext.setSource(undefined)
            updateContextStatus({isLoggedIn: false})
            updateContextState({agent: undefined, principal: undefined, accounts: []})
        })
    }, [])

    const createActor: CreateActorFn = useCustomCompareCallback(async function <T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions) {
        console.log("PlugAuthProvider: start with", {canisterId, idlFactory, options/*, agent: contextState.agent*/});
        const createActorResult = await PlugHelper.createActor<T>(canisterId, idlFactory/*, contextState.agent*/);
        console.log("PlugAuthProvider: createActorResult", createActorResult);
        if (createActorResult != undefined) {
            return createActorResult
        }
    }, [contextState.agent], _.isEqual)

    useEffect(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == "Plug") {
                    updateContextStatus({inProgress: true})
                    const timeoutMillis: number = props.autologinTimeout == undefined ? 30000 : props.autologinTimeout;
                    console.log(`Plug.autologin: will call 'await PlugHelper.getLoggedInPrincipal' with timeout ${timeoutMillis}ms`);
                    const principal = await promiseWithTimeout(PlugHelper.getLoggedInPrincipal(), timeoutMillis, new Error(`PlugHelper.getLoggedInPrincipal timed out in ${timeoutMillis}ms!`))
                    console.log("Plug.autologin: got principal", principal, principal?.toText());
                    if (principal) {
                        const accounts = await getPrincipalAccounts(principal)
                        unstable_batchedUpdates(() => {
                            updateContextStatus({isReady: true, isLoggedIn: true, inProgress: false})
                            updateContextState({agent: undefined, principal: principal, accounts: accounts})
                        })
                        return
                    }
                }
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "Plug") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({agent: undefined, principal: undefined, accounts: []})
                })
            } catch (e) {
                console.error("PlugAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "Plug") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({agent: undefined, principal: undefined, accounts: []})
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

    return <PlugAuthProviderContext.Provider value={value}>
        {props.children}
    </PlugAuthProviderContext.Provider>
}

const getPrincipalAccounts = async (principal: Principal): Promise<Array<AuthAccount>> => {
    try {
        return [{
            name: "Plug",
            accountIdentifier: Util.principalToAccountIdentifier(principal.toText(), 0)
        }]
    } catch (e) {
        return []
    }
}