"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternetIdentityAuthProvider = exports.useInternetIdentityAuthProviderContext = exports.InternetIdentityAuthProviderContext = void 0;
const React = __importStar(require("react"));
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const use_custom_compare_1 = require("use-custom-compare");
const lodash_1 = __importDefault(require("lodash"));
const AuthSourceProvider_1 = require("../authSource/AuthSourceProvider");
const AuthClientFacade_1 = require("./AuthClientFacade");
const util_1 = require("../util");
const AuthCommon_1 = require("../AuthCommon");
const initialContextValue = {
    status: (0, AuthCommon_1.getInitialContextStatus)(),
    state: (0, AuthCommon_1.getInitialContextState)(),
    login: () => Promise.reject(),
    logout: () => undefined,
    createActor: () => Promise.resolve(undefined),
};
exports.InternetIdentityAuthProviderContext = React.createContext(undefined);
const useInternetIdentityAuthProviderContext = () => {
    const context = React.useContext(exports.InternetIdentityAuthProviderContext);
    if (!context) {
        throw new Error("useInternetIdentityAuthProviderContext must be used within a InternetIdentityAuthProviderContext.Provider");
    }
    return context;
};
exports.useInternetIdentityAuthProviderContext = useInternetIdentityAuthProviderContext;
const source = "II";
const InternetIdentityAuthProvider = (props) => {
    console.log("InternetIdentityAuthProvider.render: props=", props);
    const authSourceProviderContext = (0, AuthSourceProvider_1.useAuthSourceProviderContext)();
    (0, react_1.useEffect)(() => {
        console.log("InternetIdentityAuthProvider: useEffect[]: will call 'AuthClientFacade.createAuthClient()'");
        // noinspection JSIgnoredPromiseFromCall
        AuthClientFacade_1.AuthClientFacade.createAuthClient();
    }, []);
    const [contextStatus, updateContextStatus] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.status));
    const [contextState, updateContextState] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.state));
    const login = (0, react_1.useCallback)(async (parameters) => {
        const { derivationOrigin, maxTimeToLiveNanos } = parameters;
        try {
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(source);
                updateContextStatus({ inProgress: true });
            });
            let authClient = AuthClientFacade_1.AuthClientFacade.getAuthClient();
            console.log("InternetIdentityAuthProvider: login: will call 'await AuthClientFacade.login' with ", { authClient, identityProviderURL: props.identityProviderURL, derivationOrigin, maxTimeToLiveNanos });
            if (authClient == undefined) {
                console.log("InternetIdentityAuthProvider: login: still no authClient 'await AuthClientFacade.createAuthClient'");
                authClient = await AuthClientFacade_1.AuthClientFacade.createAuthClient();
            }
            if (authClient) {
                const identity = await AuthClientFacade_1.AuthClientFacade.login({
                    authClient,
                    identityProviderURL: props.identityProviderURL,
                    derivationOrigin,
                    source: source,
                    maxTimeToLiveNanos: maxTimeToLiveNanos
                });
                if (identity) {
                    const accounts = getIdentityAccounts(identity);
                    (0, react_dom_1.unstable_batchedUpdates)(() => {
                        updateContextStatus({ isLoggedIn: true, inProgress: false });
                        updateContextState({ identity: identity, principal: identity.getPrincipal(), accounts: accounts });
                    });
                    return { status: "success" };
                }
            }
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false, inProgress: false });
                updateContextState({ identity: undefined, principal: undefined, accounts: [] });
            });
            return { status: "error", error: new Error("unknownError") };
        }
        catch (e) {
            console.error("InternetIdentityAuthProvider: login: caught error", e);
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false, inProgress: false });
                updateContextState({ identity: undefined, principal: undefined, accounts: [] });
            });
            return { status: "error", error: typeof e === "string" ? new Error(e) : e };
        }
    }, [source, props.identityProviderURL]);
    (0, react_1.useEffect)(() => {
        console.log("InternetIdentityAuthProvider: useEffect[login]: login changed", login);
    }, [login]);
    const logout = (0, react_1.useCallback)(async () => {
        try {
            const authClient = AuthClientFacade_1.AuthClientFacade.getAuthClient();
            if (authClient) {
                await AuthClientFacade_1.AuthClientFacade.logout(authClient);
                await AuthClientFacade_1.AuthClientFacade.createAuthClient();
            }
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false });
                updateContextState({ identity: undefined, principal: undefined, accounts: [] });
            });
        }
        catch (e) {
            console.error("InternetIdentityAuthProvider: logout: caught error", e);
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false });
                updateContextState({ identity: undefined, principal: undefined, accounts: [] });
            });
        }
    }, []);
    const createActor = (0, use_custom_compare_1.useCustomCompareCallback)(async function (canisterId, idlFactory, options) {
        const createActorResult = (0, AuthCommon_1.createActorGeneric)(canisterId, idlFactory, options);
        if (createActorResult != undefined) {
            return createActorResult;
        }
    }, [], lodash_1.default.isEqual);
    (0, react_1.useEffect)(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == source) {
                    updateContextStatus({ inProgress: true });
                    const authClient = await AuthClientFacade_1.AuthClientFacade.createAuthClient();
                    if (authClient) {
                        const identity = await AuthClientFacade_1.AuthClientFacade.restoreIdentity(authClient);
                        if (identity) {
                            const accounts = await getIdentityAccounts(identity);
                            (0, react_dom_1.unstable_batchedUpdates)(() => {
                                updateContextStatus({ isReady: true, isLoggedIn: true, inProgress: false });
                                updateContextState({ identity: identity, principal: identity.getPrincipal(), accounts: accounts });
                            });
                            return;
                        }
                    }
                }
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    if (authSourceProviderContext.source == source) {
                        authSourceProviderContext.setSource(undefined);
                    }
                    updateContextStatus({ isReady: true, isLoggedIn: false, inProgress: false });
                    updateContextState({ identity: undefined, principal: undefined, accounts: [] });
                });
            }
            catch (e) {
                console.error("InternetIdentityAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    if (authSourceProviderContext.source == source) {
                        authSourceProviderContext.setSource(undefined);
                    }
                    updateContextStatus({ isReady: true, isLoggedIn: false, inProgress: false });
                    updateContextState({ identity: undefined, principal: undefined, accounts: [] });
                });
            }
        })();
    }, [source]);
    const value = (0, use_custom_compare_1.useCustomCompareMemo)(() => ({
        status: contextStatus,
        state: contextState,
        login,
        logout,
        createActor,
    }), [
        contextStatus,
        contextState,
        login,
        logout,
        createActor,
    ], lodash_1.default.isEqual);
    return React.createElement(exports.InternetIdentityAuthProviderContext.Provider, { value: value }, props.children);
};
exports.InternetIdentityAuthProvider = InternetIdentityAuthProvider;
const getIdentityAccounts = (identity) => {
    try {
        return [{
                name: "Internet Identity",
                accountIdentifier: util_1.Util.principalToAccountIdentifier(identity.getPrincipal().toText(), 0)
            }];
    }
    catch (e) {
        return [];
    }
};
//# sourceMappingURL=InternetIdentityAuthProvider.js.map