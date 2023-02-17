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
exports.AuthSourceProvider = exports.useAuthSourceProviderContext = void 0;
const React = __importStar(require("react"));
const react_1 = require("react");
const use_custom_compare_1 = require("use-custom-compare");
const lodash_1 = __importDefault(require("lodash"));
const geekfactory_js_util_1 = require("geekfactory-js-util");
let provideStore = (namespace) => {
    const keyValueStore = geekfactory_js_util_1.KeyValueStoreFacade.createStore(namespace);
    provideStore = () => keyValueStore;
    return keyValueStore;
};
const AuthSourceProviderContext = React.createContext(undefined);
const useAuthSourceProviderContext = () => {
    const context = React.useContext(AuthSourceProviderContext);
    if (!context) {
        throw new Error("useAuthSourceProviderContext must be used within a AuthSourceProviderContext.Provider");
    }
    return context;
};
exports.useAuthSourceProviderContext = useAuthSourceProviderContext;
const LOCAL_STORAGE__KEY__SOURCE = "key__source";
const AuthSourceProvider = (props) => {
    const [source, setSource] = (0, react_1.useState)(() => {
        return provideStore(props.storeNamespace).get(LOCAL_STORAGE__KEY__SOURCE);
    });
    const setSourceFn = (0, react_1.useCallback)((source) => {
        const store = provideStore(props.storeNamespace);
        if (source) {
            store.set(LOCAL_STORAGE__KEY__SOURCE, source);
        }
        else {
            store.remove(LOCAL_STORAGE__KEY__SOURCE);
        }
        setSource(source);
    }, [props.storeNamespace]);
    const value = (0, use_custom_compare_1.useCustomCompareMemo)(() => ({
        source: source,
        setSource: setSourceFn
    }), [
        source,
        setSource,
    ], lodash_1.default.isEqual);
    return React.createElement(AuthSourceProviderContext.Provider, { value: value }, props.children);
};
exports.AuthSourceProvider = AuthSourceProvider;
//# sourceMappingURL=AuthSourceProvider.js.map