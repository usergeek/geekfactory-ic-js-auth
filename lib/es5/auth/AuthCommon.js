"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActorGeneric = exports.getInitialContextState = exports.getInitialContextStatus = exports.getGlobalIC = void 0;
const agent_1 = require("@dfinity/agent");
const lodash_1 = __importDefault(require("lodash"));
const getGlobalIC = () => {
    // @ts-ignore
    return window.ic;
};
exports.getGlobalIC = getGlobalIC;
function getInitialContextStatus() {
    return lodash_1.default.cloneDeep({
        inProgress: false,
        isReady: false,
        isLoggedIn: false,
    });
}
exports.getInitialContextStatus = getInitialContextStatus;
function getInitialContextState() {
    return lodash_1.default.cloneDeep({
        identity: undefined,
        principal: undefined,
        accounts: [],
        currentAccount: undefined,
    });
}
exports.getInitialContextState = getInitialContextState;
function createActorGeneric(canisterId, idlFactory, options) {
    const agent = new agent_1.HttpAgent({ ...options === null || options === void 0 ? void 0 : options.agentOptions });
    // Fetch root key for certificate validation during development
    if (process.env.NODE_ENV !== "production") {
        agent.fetchRootKey().catch(err => {
            console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
            console.error(err);
        });
    }
    // Creates an actor with using the candid interface and the HttpAgent
    return agent_1.Actor.createActor(idlFactory, {
        agent,
        canisterId: canisterId,
        ...options === null || options === void 0 ? void 0 : options.actorOptions
    });
}
exports.createActorGeneric = createActorGeneric;
//# sourceMappingURL=AuthCommon.js.map