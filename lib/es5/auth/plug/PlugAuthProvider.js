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
exports.PlugAuthProvider = exports.usePlugAuthProviderContext = void 0;
const React = __importStar(require("react"));
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const use_custom_compare_1 = require("use-custom-compare");
const lodash_1 = __importDefault(require("lodash"));
const AuthSourceProvider_1 = require("../authSource/AuthSourceProvider");
const plugHelper_1 = require("./plugHelper");
const util_1 = require("../util");
const AuthCommon_1 = require("../AuthCommon");
const initialContextValue = {
    status: (0, AuthCommon_1.getInitialContextStatus)(),
    state: (0, AuthCommon_1.getInitialContextState)(),
    login: () => Promise.reject(),
    logout: () => undefined,
    createActor: () => Promise.resolve(undefined),
};
const PlugAuthProviderContext = React.createContext(undefined);
const usePlugAuthProviderContext = () => {
    const context = React.useContext(PlugAuthProviderContext);
    if (!context) {
        throw new Error("usePlugAuthProviderContext must be used within a PlugAuthProviderContext.Provider");
    }
    return context;
};
exports.usePlugAuthProviderContext = usePlugAuthProviderContext;
const PlugAuthProvider = (props) => {
    const authSourceProviderContext = (0, AuthSourceProvider_1.useAuthSourceProviderContext)();
    const [contextStatus, updateContextStatus] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.status));
    const [contextState, updateContextState] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.state));
    const login = (0, use_custom_compare_1.useCustomCompareCallback)(async () => {
        try {
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource("Plug");
                updateContextStatus({ inProgress: true });
            });
            console.log("Plug.login: will call 'await PlugHelper.login' with whitelist", props.whitelist);
            const principal = await plugHelper_1.PlugHelper.login(props.whitelist);
            console.log("Plug.login: got principal", principal, principal === null || principal === void 0 ? void 0 : principal.toText());
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
            console.error("PlugAuthProvider: login: caught error", e);
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
            plugHelper_1.PlugHelper.logout();
            authSourceProviderContext.setSource(undefined);
            updateContextStatus({ isLoggedIn: false });
            updateContextState({ principal: undefined, accounts: [] });
        });
    }, []);
    const createActor = (0, use_custom_compare_1.useCustomCompareCallback)(async function (canisterId, idlFactory, options) {
        console.log("PlugAuthProvider: start with", { canisterId, idlFactory, options });
        const createActorResult = await plugHelper_1.PlugHelper.createActor(canisterId, idlFactory);
        console.log("PlugAuthProvider: createActorResult", createActorResult);
        if (createActorResult != undefined) {
            return createActorResult;
        }
    }, [], lodash_1.default.isEqual);
    (0, react_1.useEffect)(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == "Plug") {
                    updateContextStatus({ inProgress: true });
                    console.log("Plug.autologin: will call 'await PlugHelper.getLoggedInIdentity'");
                    const principal = await plugHelper_1.PlugHelper.getLoggedInPrincipal();
                    console.log("Plug.autologin: got principal", principal, principal === null || principal === void 0 ? void 0 : principal.toText());
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
                    if (authSourceProviderContext.source == "Plug") {
                        authSourceProviderContext.setSource(undefined);
                    }
                    updateContextStatus({ isReady: true, isLoggedIn: false, inProgress: false });
                    updateContextState({ principal: undefined, accounts: [] });
                });
            }
            catch (e) {
                console.error("PlugAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    if (authSourceProviderContext.source == "Plug") {
                        authSourceProviderContext.setSource(undefined);
                    }
                    updateContextStatus({ isReady: true, isLoggedIn: false, inProgress: false });
                    updateContextState({ principal: undefined, accounts: [] });
                });
            }
        })();
    }, []);
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
    return React.createElement(PlugAuthProviderContext.Provider, { value: value }, props.children);
};
exports.PlugAuthProvider = PlugAuthProvider;
const getPrincipalAccounts = async (principal) => {
    try {
        return [{
                name: "Plug",
                accountIdentifier: util_1.Util.principalToAccountIdentifier(principal.toText(), 0)
            }];
    }
    catch (e) {
        return [];
    }
};
//# sourceMappingURL=PlugAuthProvider.js.map