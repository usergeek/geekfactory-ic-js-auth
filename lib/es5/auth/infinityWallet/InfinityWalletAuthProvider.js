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
exports.InfinityWalletAuthProvider = exports.useInfinityWalletAuthProviderContext = void 0;
const React = __importStar(require("react"));
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const use_custom_compare_1 = require("use-custom-compare");
const lodash_1 = __importDefault(require("lodash"));
const AuthSourceProvider_1 = require("../authSource/AuthSourceProvider");
const infinityWalletHelper_1 = require("./infinityWalletHelper");
const util_1 = require("../util");
const AuthCommon_1 = require("../AuthCommon");
const geekfactory_js_util_1 = require("geekfactory-js-util");
const initialContextValue = {
    status: (0, AuthCommon_1.getInitialContextStatus)(),
    state: (0, AuthCommon_1.getInitialContextState)(),
    login: () => Promise.reject(),
    logout: () => undefined,
    createActor: () => Promise.resolve(undefined),
};
const InfinityWalletAuthProviderContext = React.createContext(undefined);
const useInfinityWalletAuthProviderContext = () => {
    const context = React.useContext(InfinityWalletAuthProviderContext);
    if (!context) {
        throw new Error("useInfinityWalletAuthProviderContext must be used within a InfinityWalletAuthProviderContext.Provider");
    }
    return context;
};
exports.useInfinityWalletAuthProviderContext = useInfinityWalletAuthProviderContext;
const InfinityWalletAuthProvider = (props) => {
    const authSourceProviderContext = (0, AuthSourceProvider_1.useAuthSourceProviderContext)();
    const [contextStatus, updateContextStatus] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.status));
    const [contextState, updateContextState] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.state));
    const login = (0, use_custom_compare_1.useCustomCompareCallback)(async () => {
        try {
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource("InfinityWallet");
                updateContextStatus({ inProgress: true });
            });
            console.log("InfinityWallet.login: will call 'await InfinityWalletHelper.login' with whitelist", props.whitelist);
            const principal = await infinityWalletHelper_1.InfinityWalletHelper.login(props.whitelist);
            console.log("InfinityWallet.login: got principal", principal, principal === null || principal === void 0 ? void 0 : principal.toText());
            if (principal) {
                const accounts = await getPrincipalAccounts(principal);
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    updateContextStatus({ isLoggedIn: true, inProgress: false });
                    updateContextState({ principal: principal, accounts: accounts });
                });
                return { status: "success" };
            }
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false, inProgress: false });
                updateContextState({ principal: undefined, accounts: [] });
            });
            return { status: "error", error: new Error("unknownError") };
        }
        catch (e) {
            console.error("InfinityWalletAuthProvider: login: caught error", e);
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false, inProgress: false });
                updateContextState({ principal: undefined, accounts: [] });
            });
            return { status: "error", error: typeof e === "string" ? new Error(e) : e };
        }
    }, [props.whitelist], lodash_1.default.isEqual);
    const logout = (0, react_1.useCallback)(async () => {
        (0, react_dom_1.unstable_batchedUpdates)(() => {
            infinityWalletHelper_1.InfinityWalletHelper.logout();
            authSourceProviderContext.setSource(undefined);
            updateContextStatus({ isLoggedIn: false });
            updateContextState({ principal: undefined, accounts: [] });
        });
    }, []);
    const createActor = (0, use_custom_compare_1.useCustomCompareCallback)(async function (canisterId, idlFactory, options) {
        console.log("InfinityWalletAuthProvider: start with", { canisterId, idlFactory, options });
        const createActorResult = await infinityWalletHelper_1.InfinityWalletHelper.createActor(canisterId, idlFactory);
        console.log("InfinityWalletAuthProvider: createActorResult", createActorResult);
        if (createActorResult != undefined) {
            return createActorResult;
        }
    }, [], lodash_1.default.isEqual);
    (0, react_1.useEffect)(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == "InfinityWallet") {
                    updateContextStatus({ inProgress: true });
                    const timeoutMillis = props.autologinTimeout == undefined ? 30000 : props.autologinTimeout;
                    console.log(`InfinityWallet.autologin: will call 'await InfinityWalletHelper.getLoggedInPrincipal' with timeout ${timeoutMillis}ms, whitelist`, props.whitelist);
                    const principal = await (0, geekfactory_js_util_1.promiseWithTimeout)(infinityWalletHelper_1.InfinityWalletHelper.getLoggedInPrincipal(props.whitelist), timeoutMillis, new Error(`InfinityWalletHelper.getLoggedInPrincipal timed out in ${timeoutMillis}ms!`));
                    console.log("InfinityWallet.autologin: got principal", principal, principal === null || principal === void 0 ? void 0 : principal.toText());
                    if (principal) {
                        const accounts = await getPrincipalAccounts(principal);
                        (0, react_dom_1.unstable_batchedUpdates)(() => {
                            updateContextStatus({ isReady: true, isLoggedIn: true, inProgress: false });
                            updateContextState({ principal: principal, accounts: accounts });
                        });
                        return;
                    }
                }
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    if (authSourceProviderContext.source == "InfinityWallet") {
                        authSourceProviderContext.setSource(undefined);
                    }
                    updateContextStatus({ isReady: true, isLoggedIn: false, inProgress: false });
                    updateContextState({ principal: undefined, accounts: [] });
                });
            }
            catch (e) {
                console.error("InfinityWalletAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    if (authSourceProviderContext.source == "InfinityWallet") {
                        authSourceProviderContext.setSource(undefined);
                    }
                    updateContextStatus({ isReady: true, isLoggedIn: false, inProgress: false });
                    updateContextState({ principal: undefined, accounts: [] });
                });
            }
        })();
    }, [props.autologinTimeout]);
    const value = (0, use_custom_compare_1.useCustomCompareMemo)(() => ({
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
    ], lodash_1.default.isEqual);
    return React.createElement(InfinityWalletAuthProviderContext.Provider, { value: value }, props.children);
};
exports.InfinityWalletAuthProvider = InfinityWalletAuthProvider;
const getPrincipalAccounts = async (principal) => {
    try {
        return [{
                name: "Infinity Wallet",
                accountIdentifier: util_1.Util.principalToAccountIdentifier(principal.toText(), 0)
            }];
    }
    catch (e) {
        return [];
    }
};
//# sourceMappingURL=InfinityWalletAuthProvider.js.map