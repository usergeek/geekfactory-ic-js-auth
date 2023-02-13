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
exports.AuthProvider = exports.useAuthProviderContext = void 0;
const React = __importStar(require("react"));
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const use_custom_compare_1 = require("use-custom-compare");
const lodash_1 = __importDefault(require("lodash"));
const PlugAuthProvider_1 = require("./plug/PlugAuthProvider");
const AuthSourceProvider_1 = require("./authSource/AuthSourceProvider");
const InternetIdentityAuthProvider_1 = require("./internetIdentity/InternetIdentityAuthProvider");
const StoicAuthProvider_1 = require("./stoic/StoicAuthProvider");
const NFIDAuthProvider_1 = require("./nfid/NFIDAuthProvider");
const InfinityWalletAuthProvider_1 = require("./infinityWallet/InfinityWalletAuthProvider");
const AuthCommon_1 = require("./AuthCommon");
const initialContextValue = {
    source: undefined,
    status: (0, AuthCommon_1.getInitialContextStatus)(),
    state: (0, AuthCommon_1.getInitialContextState)(),
    login: () => Promise.reject(),
    logout: () => undefined,
    switchAccount: (targetAccount) => undefined,
    getCurrentPrincipal: () => undefined,
    getCurrentAccount: () => undefined,
    createActor: () => Promise.resolve(undefined),
};
const AuthProviderContext = React.createContext(undefined);
const useAuthProviderContext = () => {
    const context = React.useContext(AuthProviderContext);
    if (!context) {
        throw new Error("useAuthProviderContext must be used within a AuthProviderContext.Provider");
    }
    return context;
};
exports.useAuthProviderContext = useAuthProviderContext;
const AuthProvider = (props) => {
    const authSourceProviderContext = (0, AuthSourceProvider_1.useAuthSourceProviderContext)();
    const plugAuthProviderContext = (0, PlugAuthProvider_1.usePlugAuthProviderContext)();
    const stoicAuthProviderContext = (0, StoicAuthProvider_1.useStoicAuthProviderContext)();
    const internetIdentityAuthProviderContext = (0, InternetIdentityAuthProvider_1.useInternetIdentityAuthProviderContext)();
    const nfidInternetIdentityAuthProviderContext = (0, NFIDAuthProvider_1.useNFIDInternetIdentityAuthProviderContext)();
    const infinityWalletAuthProviderContext = (0, InfinityWalletAuthProvider_1.useInfinityWalletAuthProviderContext)();
    const [contextSource, setContextSource] = (0, react_1.useState)(() => {
        return authSourceProviderContext.source;
    });
    const [contextStatus, updateContextStatus] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.status));
    const [contextState, updateContextState] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.state));
    const login = (0, react_1.useCallback)(async (parameters) => {
        const { source, derivationOrigin } = parameters;
        switch (source) {
            case "Plug": {
                return plugAuthProviderContext.login();
            }
            case "II": {
                return internetIdentityAuthProviderContext.login({
                    identityProviderURL: process.env.II_URL,
                    derivationOrigin
                });
            }
            case "NFID": {
                return nfidInternetIdentityAuthProviderContext.login({
                    identityProviderURL: process.env.NFID_II_URL
                });
            }
            case "Stoic": {
                return stoicAuthProviderContext.login();
            }
            case "InfinityWallet": {
                return infinityWalletAuthProviderContext.login();
            }
        }
        return { status: "error", error: new Error("unknownSourceError") };
    }, [plugAuthProviderContext.login, internetIdentityAuthProviderContext.login,
        nfidInternetIdentityAuthProviderContext.login, stoicAuthProviderContext.login,
        infinityWalletAuthProviderContext.login]);
    const logout = (0, react_1.useCallback)(async (source) => {
        switch (source) {
            case "Plug": {
                await plugAuthProviderContext.logout();
                break;
            }
            case "II": {
                await internetIdentityAuthProviderContext.logout();
                break;
            }
            case "NFID": {
                await nfidInternetIdentityAuthProviderContext.logout();
                break;
            }
            case "Stoic": {
                await stoicAuthProviderContext.logout();
                break;
            }
            case "InfinityWallet": {
                await infinityWalletAuthProviderContext.logout();
                break;
            }
        }
        if (props.onLogout && typeof props.onLogout === "function") {
            props.onLogout();
        }
    }, [plugAuthProviderContext.logout, internetIdentityAuthProviderContext.logout,
        nfidInternetIdentityAuthProviderContext.logout, stoicAuthProviderContext.logout,
        infinityWalletAuthProviderContext.logout, props.onLogout]);
    const switchAccount = (0, use_custom_compare_1.useCustomCompareCallback)((targetAccount) => {
        if (contextState.accounts.length > targetAccount) {
            const newContextState = {
                ...contextState,
                currentAccount: targetAccount
            };
            updateContextState(newContextState);
        }
    }, [contextState], lodash_1.default.isEqual);
    const getCurrentPrincipal = (0, use_custom_compare_1.useCustomCompareCallback)(() => {
        if (contextStatus.isReady && contextStatus.isLoggedIn && contextState.principal != undefined) {
            return contextState.principal;
        }
        return undefined;
    }, [contextState.principal, contextStatus], lodash_1.default.isEqual);
    const getCurrentAccount = (0, use_custom_compare_1.useCustomCompareCallback)(() => {
        if (contextState.currentAccount != undefined && contextState.accounts.length > contextState.currentAccount) {
            return contextState.accounts[contextState.currentAccount];
        }
        return undefined;
    }, [contextState], lodash_1.default.isEqual);
    const createActor = (0, use_custom_compare_1.useCustomCompareCallback)(async (canisterId, idlFactory, options) => {
        let actor = undefined;
        switch (contextSource) {
            case "Plug": {
                actor = await plugAuthProviderContext.createActor(canisterId, idlFactory, options);
                break;
            }
            case "II": {
                actor = await internetIdentityAuthProviderContext.createActor(canisterId, idlFactory, options);
                break;
            }
            case "NFID": {
                actor = await nfidInternetIdentityAuthProviderContext.createActor(canisterId, idlFactory, options);
                break;
            }
            case "Stoic": {
                actor = await stoicAuthProviderContext.createActor(canisterId, idlFactory, options);
                break;
            }
            case "InfinityWallet": {
                actor = await infinityWalletAuthProviderContext.createActor(canisterId, idlFactory, options);
                break;
            }
        }
        return actor;
    }, [contextSource], lodash_1.default.isEqual);
    (0, use_custom_compare_1.useCustomCompareEffect)(() => {
        const source = authSourceProviderContext.source;
        let status = lodash_1.default.cloneDeep(initialContextValue.status);
        let state = lodash_1.default.cloneDeep(initialContextValue.state);
        switch (source) {
            case "Plug": {
                status = plugAuthProviderContext.status;
                state = {
                    identity: plugAuthProviderContext.state.identity,
                    principal: plugAuthProviderContext.state.principal,
                    accounts: plugAuthProviderContext.state.accounts,
                    currentAccount: 0,
                };
                break;
            }
            case "II": {
                status = internetIdentityAuthProviderContext.status;
                state = {
                    identity: internetIdentityAuthProviderContext.state.identity,
                    principal: internetIdentityAuthProviderContext.state.principal,
                    accounts: internetIdentityAuthProviderContext.state.accounts,
                    currentAccount: 0,
                };
                break;
            }
            case "NFID": {
                status = nfidInternetIdentityAuthProviderContext.status;
                state = {
                    identity: nfidInternetIdentityAuthProviderContext.state.identity,
                    principal: nfidInternetIdentityAuthProviderContext.state.principal,
                    accounts: nfidInternetIdentityAuthProviderContext.state.accounts,
                    currentAccount: 0,
                };
                break;
            }
            case "Stoic": {
                status = stoicAuthProviderContext.status;
                state = {
                    identity: stoicAuthProviderContext.state.identity,
                    principal: stoicAuthProviderContext.state.principal,
                    accounts: stoicAuthProviderContext.state.accounts,
                    currentAccount: 0,
                };
                break;
            }
            case "InfinityWallet": {
                status = infinityWalletAuthProviderContext.status;
                state = {
                    identity: infinityWalletAuthProviderContext.state.identity,
                    principal: infinityWalletAuthProviderContext.state.principal,
                    accounts: infinityWalletAuthProviderContext.state.accounts,
                    currentAccount: 0,
                };
                break;
            }
            default: {
                const isReady = lodash_1.default.some([
                    plugAuthProviderContext.status,
                    internetIdentityAuthProviderContext.status,
                    nfidInternetIdentityAuthProviderContext.status,
                    stoicAuthProviderContext.status,
                    infinityWalletAuthProviderContext.status,
                ], value => {
                    return value.isReady;
                });
                status.isReady = isReady;
            }
        }
        (0, react_dom_1.unstable_batchedUpdates)(() => {
            setContextSource(source);
            updateContextStatus(status);
            updateContextState(state);
        });
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
    ], lodash_1.default.isEqual);
    const value = (0, use_custom_compare_1.useCustomCompareMemo)(() => ({
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
    ], lodash_1.default.isEqual);
    return React.createElement(AuthProviderContext.Provider, { value: value }, props.children);
};
exports.AuthProvider = AuthProvider;
//# sourceMappingURL=AuthProvider.js.map