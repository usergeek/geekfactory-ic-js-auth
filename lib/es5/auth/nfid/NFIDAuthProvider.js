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
exports.NFIDAuthProvider = exports.useNFIDAuthProviderContext = exports.NFIDAuthProviderContext = void 0;
const React = __importStar(require("react"));
const react_1 = require("react");
const embed_1 = require("@nfid/embed");
const AuthCommon_1 = require("../AuthCommon");
const lodash_1 = __importDefault(require("lodash"));
const AuthSourceProvider_1 = require("../authSource/AuthSourceProvider");
const react_dom_1 = require("react-dom");
const use_custom_compare_1 = require("use-custom-compare");
const util_1 = require("../util");
const initialContextValue = {
    status: (0, AuthCommon_1.getInitialContextStatus)(),
    state: (0, AuthCommon_1.getInitialContextState)(),
    login: () => Promise.reject(),
    logout: () => undefined,
    createActor: () => Promise.resolve(undefined),
};
exports.NFIDAuthProviderContext = React.createContext(undefined);
const useNFIDAuthProviderContext = () => {
    const context = React.useContext(exports.NFIDAuthProviderContext);
    if (!context) {
        throw new Error("useNFIDAuthProviderContext must be used within a NFIDAuthProviderContext.Provider");
    }
    return context;
};
exports.useNFIDAuthProviderContext = useNFIDAuthProviderContext;
const source = "NFID";
const initializeNFID = async (applicationName, applicationLogo) => {
    const params = {
        application: {
            name: applicationName,
            logo: applicationLogo
        }
    };
    if (!!process.env.IS_TEST_SERVER) {
        console.log("NFIDAuthProvider.initializeNFID: will call 'await NFID.init' with params", params);
    }
    const nfid = await embed_1.NFID.init(params);
    if (!!process.env.IS_TEST_SERVER) {
        console.log("NFIDAuthProvider.initializeNFID: got nfid", { nfid, params });
    }
    return nfid;
};
/**
 * @see https://docs.nfid.one/integration/quickstart
 */
const NFIDAuthProvider = (props) => {
    const authSourceProviderContext = (0, AuthSourceProvider_1.useAuthSourceProviderContext)();
    const [contextStatus, updateContextStatus] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.status));
    const [contextState, updateContextState] = (0, react_1.useReducer)((state, newState) => ({ ...state, ...newState }), lodash_1.default.cloneDeep(initialContextValue.state));
    const login = (0, react_1.useCallback)(async (parameters) => {
        const { derivationOrigin, maxTimeToLiveNanos } = parameters;
        try {
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(source);
                updateContextStatus({ inProgress: true });
            });
            if (!!process.env.IS_TEST_SERVER) {
                console.log("NFIDAuthProvider.login: will call 'await initializeNFID' with parameters", parameters);
            }
            const nfid = await initializeNFID(props.applicationName, props.applicationLogo);
            if (!!process.env.IS_TEST_SERVER) {
                console.log("NFIDAuthProvider.login: got nfid", { nfid });
            }
            const identity = await nfid.getDelegation({
                derivationOrigin: derivationOrigin,
                maxTimeToLive: maxTimeToLiveNanos
            });
            const principal = identity.getPrincipal();
            const isAnonymous = principal.isAnonymous();
            if (!!process.env.IS_TEST_SERVER) {
                console.log("NFIDAuthProvider.login: got identity", { nfid, isAuthenticated: nfid.isAuthenticated, getDelegationType: nfid.getDelegationType(), isAnonymous, getIdentityPrincipal: principal.toText() });
            }
            if (identity) {
                const accounts = await getIdentityAccounts(identity);
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    updateContextStatus({ isLoggedIn: true, inProgress: false });
                    updateContextState({ identity: identity, principal: principal, accounts: accounts });
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
            console.error("NFIDAuthProvider: login: caught error", e);
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false, inProgress: false });
                updateContextState({ identity: undefined, principal: undefined, accounts: [] });
            });
            return { status: "error", error: typeof e === "string" ? new Error(e) : e };
        }
    }, [source, props.applicationName, props.applicationLogo]);
    const logout = (0, react_1.useCallback)(async () => {
        try {
            if (!!process.env.IS_TEST_SERVER) {
                console.log("NFIDAuthProvider.logout: will call 'await initializeNFID'");
            }
            const nfid = await initializeNFID(props.applicationName, props.applicationLogo);
            if (!!process.env.IS_TEST_SERVER) {
                console.log("NFIDAuthProvider.logout: got nfid", { nfid });
            }
            await nfid.logout();
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false });
                updateContextState({ identity: undefined, principal: undefined, accounts: [] });
            });
        }
        catch (e) {
            console.error("NFIDAuthProvider.logout: caught error", e);
            (0, react_dom_1.unstable_batchedUpdates)(() => {
                authSourceProviderContext.setSource(undefined);
                updateContextStatus({ isLoggedIn: false });
                updateContextState({ identity: undefined, principal: undefined, accounts: [] });
            });
        }
    }, [props.applicationName, props.applicationLogo]);
    const createActor = (0, use_custom_compare_1.useCustomCompareCallback)(async function (canisterId, idlFactory, options) {
        const createActorResult = await (0, AuthCommon_1.createActorGeneric)(canisterId, idlFactory, options);
        if (createActorResult != undefined) {
            return createActorResult;
        }
    }, [], lodash_1.default.isEqual);
    (0, react_1.useEffect)(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == source) {
                    updateContextStatus({ inProgress: true });
                    if (!!process.env.IS_TEST_SERVER) {
                        console.log("NFIDAuthProvider.useEffect: will call 'await initializeNFID'");
                    }
                    const nfid = await initializeNFID(props.applicationName, props.applicationLogo);
                    const principal = nfid.getIdentity().getPrincipal();
                    const isAnonymous = principal.isAnonymous();
                    if (!!process.env.IS_TEST_SERVER) {
                        console.log("NFIDAuthProvider.useEffect: got nfid", { nfid, isAuthenticated: nfid.isAuthenticated, getDelegationType: nfid.getDelegationType(), isAnonymous, getIdentityPrincipal: principal.toText() });
                    }
                    if (nfid.isAuthenticated) {
                        const identity = nfid.getIdentity();
                        if (identity && !isAnonymous) {
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
                console.error("NFIDAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                (0, react_dom_1.unstable_batchedUpdates)(() => {
                    if (authSourceProviderContext.source == source) {
                        authSourceProviderContext.setSource(undefined);
                    }
                    updateContextStatus({ isReady: true, isLoggedIn: false, inProgress: false });
                    updateContextState({ identity: undefined, principal: undefined, accounts: [] });
                });
            }
        })();
    }, [source, props.applicationName, props.applicationLogo]);
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
    return React.createElement(exports.NFIDAuthProviderContext.Provider, { value: value }, props.children);
};
exports.NFIDAuthProvider = NFIDAuthProvider;
const getIdentityAccounts = async (identity) => {
    try {
        return [{
                name: "NFID",
                accountIdentifier: util_1.Util.principalToAccountIdentifier(identity.getPrincipal().toText(), 0)
            }];
    }
    catch (e) {
        return [];
    }
};
//# sourceMappingURL=NFIDAuthProvider.js.map