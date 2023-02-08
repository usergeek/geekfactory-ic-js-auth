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
exports.StoicAuthProvider = exports.useStoicAuthProviderContext = void 0;
const React = __importStar(require("react"));
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const use_custom_compare_1 = require("use-custom-compare");
const lodash_1 = __importDefault(require("lodash"));
const ic_stoic_identity_1 = require("ic-stoic-identity");
const AuthSourceProvider_1 = require("../authSource/AuthSourceProvider");
const AuthCommon_1 = require("../AuthCommon");
const initialContextValue = {
    status: (0, AuthCommon_1.getInitialContextStatus)(),
    state: (0, AuthCommon_1.getInitialContextState)(),
    login: () => Promise.reject(),
    logout: () => undefined,
    createActor: () => Promise.resolve(undefined),
};
const StoicAuthProviderContext = React.createContext(undefined);
const useStoicAuthProviderContext = () => {
    const context = React.useContext(StoicAuthProviderContext);
    if (!context) {
        throw new Error("useStoicAuthProviderContext must be used within a StoicAuthProviderContext.Provider");
    }
    return context;
};
exports.useStoicAuthProviderContext = useStoicAuthProviderContext;
const StoicAuthProvider = (props) => {
    const authSourceProviderContext = (0, AuthSourceProvider_1.useAuthSourceProviderContext)();
    const [contextStatus, updateContextStatus] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.status));
    const [contextState, updateContextState] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.state));
    const login = (0, react_1.useCallback)(async () => {
        try {
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource("Stoic");
                updateContextStatus({ inProgress: true });
            });
            const identity = await ic_stoic_identity_1.StoicIdentity.connect();
            if (identity) {
                const accounts = await getIdentityAccounts(identity);
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    updateContextStatus({ isLoggedIn: true, inProgress: false });
                    updateContextState({ identity: identity, principal: identity.getPrincipal(), accounts: accounts });
                });
                return { status: "success" };
            }
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false, inProgress: false });
                updateContextState({ identity: undefined, principal: undefined, accounts: [] });
            });
            return { status: "error", error: new Error("unknownError") };
        }
        catch (e) {
            console.error("StoicAuthProvider: login: caught error", e);
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false, inProgress: false });
                updateContextState({ identity: undefined, principal: undefined, accounts: [] });
            });
            return { status: "error", error: typeof e === "string" ? new Error(e) : e };
        }
    }, []);
    const logout = (0, react_1.useCallback)(async () => {
        ic_stoic_identity_1.StoicIdentity.disconnect();
        (0, react_dom_1.unstable_batchedUpdates)(() => {
            authSourceProviderContext.setSource(undefined);
            updateContextStatus({ isLoggedIn: false });
            updateContextState({ identity: undefined, principal: undefined, accounts: [] });
        });
    }, []);
    const createActor = (0, use_custom_compare_1.useCustomCompareCallback)(async function (canisterId, idlFactory, options) {
        const createActorResult = await (0, AuthCommon_1.createActorGeneric)(canisterId, idlFactory, options);
        if (createActorResult != undefined) {
            return createActorResult;
        }
    }, [], lodash_1.default.isEqual);
    (0, react_1.useEffect)(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == "Stoic") {
                    updateContextStatus({ inProgress: true });
                    const identity = await ic_stoic_identity_1.StoicIdentity.load();
                    if (identity) {
                        const accounts = await getIdentityAccounts(identity);
                        (0, react_dom_1.unstable_batchedUpdates)(() => {
                            updateContextStatus({ isReady: true, isLoggedIn: true, inProgress: false });
                            updateContextState({ identity: identity, principal: identity.getPrincipal(), accounts: accounts });
                        });
                        return;
                    }
                }
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    if (authSourceProviderContext.source == "Stoic") {
                        authSourceProviderContext.setSource(undefined);
                    }
                    updateContextStatus({ isReady: true, isLoggedIn: false, inProgress: false });
                    updateContextState({ identity: undefined, principal: undefined, accounts: [] });
                });
            }
            catch (e) {
                console.error("StoicAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    if (authSourceProviderContext.source == "Stoic") {
                        authSourceProviderContext.setSource(undefined);
                    }
                    updateContextStatus({ isReady: true, isLoggedIn: false, inProgress: false });
                    updateContextState({ identity: undefined, principal: undefined, accounts: [] });
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
        createActor,
    ], lodash_1.default.isEqual);
    return React.createElement(StoicAuthProviderContext.Provider, { value: value }, props.children);
};
exports.StoicAuthProvider = StoicAuthProvider;
const getIdentityAccounts = async (identity) => {
    try {
        const accountsResult = JSON.parse(await identity.accounts());
        // noinspection UnnecessaryLocalVariableJS
        const accounts = lodash_1.default.map(accountsResult, v => ({
            name: v.name,
            accountIdentifier: v.address
        }));
        return accounts;
    }
    catch (e) {
        return [];
    }
};
//# sourceMappingURL=StoicAuthProvider.js.map