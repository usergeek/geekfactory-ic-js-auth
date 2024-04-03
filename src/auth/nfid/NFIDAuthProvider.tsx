import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer} from "react";
import {NFID} from "@nfid/embed";
import {AuthAccount, ContextState, ContextStatus, CreateActorFn, createActorGeneric, CreateActorOptions, getInitialContextState, getInitialContextStatus, LoginFnResult} from "../AuthCommon";
import _ from "lodash"
import {Source, useAuthSourceProviderContext} from "../authSource/AuthSourceProvider";
import {unstable_batchedUpdates} from "react-dom";
import {Identity} from "@dfinity/agent";
import {useCustomCompareCallback, useCustomCompareMemo} from "use-custom-compare";
import {IDL} from "@dfinity/candid";
import {Util} from "../util";
import {NFIDConfig} from "@nfid/embed/src/lib/types";

type LoginParameters = {
    derivationOrigin?: string | URL
    maxTimeToLiveNanos?: bigint
}
type LoginFn = (parameters: LoginParameters) => Promise<LoginFnResult>
type LogoutFn = () => Promise<void>

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

export const NFIDAuthProviderContext: React.Context<Context | undefined> = React.createContext<Context | undefined>(undefined)
export const useNFIDAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(NFIDAuthProviderContext);
    if (!context) {
        throw new Error("useNFIDAuthProviderContext must be used within a NFIDAuthProviderContext.Provider")
    }
    return context;
};

const source: Source = "NFID"

type Props = {
    applicationName: string
    applicationLogo: string
}

const initializeNFID = async (applicationName: string, applicationLogo: string) => {
    const params: NFIDConfig = {
        application: {
            name: applicationName,
            logo: applicationLogo
        }
    };
    if (!!process.env.IS_TEST_SERVER) {
        console.log("NFIDAuthProvider.initializeNFID: will call 'await NFID.init' with params", params);
    }
    const nfid = await NFID.init(params);
    if (!!process.env.IS_TEST_SERVER) {
        console.log("NFIDAuthProvider.initializeNFID: got nfid", {nfid, params});
    }
    return nfid;
}

/**
 * @see https://docs.nfid.one/integration/quickstart
 */
export const NFIDAuthProvider = (props: PropsWithChildren<Props>) => {

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
            if (!!process.env.IS_TEST_SERVER) {
                console.log("NFIDAuthProvider.login: will call 'await initializeNFID' with parameters", parameters);
            }
            const nfid = await initializeNFID(props.applicationName, props.applicationLogo);
            if (!!process.env.IS_TEST_SERVER) {
                console.log("NFIDAuthProvider.login: got nfid", {nfid});
            }

            const identity: Identity = await nfid.getDelegation({
                derivationOrigin: derivationOrigin,
                maxTimeToLive: maxTimeToLiveNanos
            });
            const principal = identity.getPrincipal();
            const isAnonymous = principal.isAnonymous()
            if (!!process.env.IS_TEST_SERVER) {
                console.log("NFIDAuthProvider.login: got identity", {nfid, isAuthenticated: nfid.isAuthenticated, getDelegationType: nfid.getDelegationType(), isAnonymous, getIdentityPrincipal: principal.toText()});
            }
            if (identity) {
                const accounts = await getIdentityAccounts(identity)
                unstable_batchedUpdates(() => {
                    updateContextStatus({isLoggedIn: true, inProgress: false})
                    updateContextState({identity: identity, principal: principal, accounts: accounts})
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
            console.error("NFIDAuthProvider: login: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, principal: undefined, accounts: []})
            })
            return {status: "error", error: typeof e === "string" ? new Error(e) : e}
        }
    }, [source, props.applicationName, props.applicationLogo])

    const logout: LogoutFn = useCallback<LogoutFn>(async () => {
        try {
            if (!!process.env.IS_TEST_SERVER) {
                console.log("NFIDAuthProvider.logout: will call 'await initializeNFID'");
            }
            const nfid = await initializeNFID(props.applicationName, props.applicationLogo);
            if (!!process.env.IS_TEST_SERVER) {
                console.log("NFIDAuthProvider.logout: got nfid", {nfid});
            }
            await nfid.logout()
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false})
                updateContextState({identity: undefined, principal: undefined, accounts: []})
            })
        } catch (e) {
            console.error("NFIDAuthProvider.logout: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false})
                updateContextState({identity: undefined, principal: undefined, accounts: []})
            })
        }
    }, [props.applicationName, props.applicationLogo])

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
                    if (!!process.env.IS_TEST_SERVER) {
                        console.log("NFIDAuthProvider.useEffect: will call 'await initializeNFID'");
                    }
                    const nfid = await initializeNFID(props.applicationName, props.applicationLogo);
                    const principal = nfid.getIdentity().getPrincipal();
                    const isAnonymous = principal.isAnonymous()
                    if (!!process.env.IS_TEST_SERVER) {
                        console.log("NFIDAuthProvider.useEffect: got nfid", {nfid, isAuthenticated: nfid.isAuthenticated, getDelegationType: nfid.getDelegationType(), isAnonymous, getIdentityPrincipal: principal.toText()});
                    }
                    if (nfid.isAuthenticated) {
                        const identity = nfid.getIdentity();
                        if (identity && !isAnonymous) {
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
                console.error("NFIDAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == source) {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, principal: undefined, accounts: []})
                })
            }
        })()
    }, [source, props.applicationName, props.applicationLogo])

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

    return <NFIDAuthProviderContext.Provider value={value}>
        {props.children}
    </NFIDAuthProviderContext.Provider>
}

const getIdentityAccounts = async (identity: Identity): Promise<Array<AuthAccount>> => {
    try {
        return [{
            name: "NFID",
            accountIdentifier: Util.principalToAccountIdentifier(identity.getPrincipal().toText(), 0)
        }]
    } catch (e) {
        return []
    }
}