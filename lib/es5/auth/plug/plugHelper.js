"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlugHelper = void 0;
const AuthCommon_1 = require("../AuthCommon");
const geekfactory_js_util_1 = require("geekfactory-js-util");
const host = process.env.NODE_ENV === "development" ? `http://localhost:${process.env.LOCAL_REPLICA_PORT || 4943}` : undefined;
const walletOneAtATimePromise = geekfactory_js_util_1.OneAtATimePromiseFacade.create();
const Helper = {
    isAvailable: () => {
        try { // noinspection EqualityComparisonWithCoercionJS
            return getGlobalWallet() != undefined;
        }
        catch (e) {
            return false;
        }
    },
    getLoggedInPrincipal: async () => {
        try {
            const wallet = getGlobalWallet();
            if (wallet) {
                const connected = await wallet.isConnected();
                if (connected) {
                    return await Helper.getPrincipal();
                }
            }
        }
        catch (e) {
            console.error("Plug: getLoggedInPrincipal failed", e);
        }
    },
    login: async (whitelist = undefined) => {
        try {
            const wallet = getGlobalWallet();
            if (wallet) {
                const result = await walletOneAtATimePromise.oneAtATimePromise(() => wallet.requestConnect({
                    host: host,
                    whitelist: whitelist,
                    timeout: 10000,
                }), "plug_login");
                if (result) {
                    return await Helper.getPrincipal();
                }
            }
        }
        catch (e) {
            console.error("Plug: login failed", e);
            throw e;
        }
    },
    getPrincipal: async () => {
        const wallet = getGlobalWallet();
        if (wallet) {
            return await wallet.getPrincipal();
        }
        return undefined;
    },
    createActor: async (canisterId, interfaceFactory) => {
        const parameters = {
            canisterId: canisterId,
            interfaceFactory: interfaceFactory
        };
        try {
            const wallet = getGlobalWallet();
            if (wallet) {
                const actor = await walletOneAtATimePromise.oneAtATimePromise(() => wallet.createActor(parameters), "canisterId_" + canisterId);
                return actor;
            }
        }
        catch (e) {
            console.error("Plug: createActor failed", parameters, e);
        }
        return undefined;
    },
    logout: async () => {
        try {
            const wallet = getGlobalWallet();
            if (wallet) {
                await wallet.disconnect();
            }
        }
        catch (e) {
            console.error("Plug: logout failed", e);
        }
    },
    requestBurnXTC: async (amount, toCanisterId) => {
        try {
            const wallet = getGlobalWallet();
            if (wallet) {
                const params = { amount: amount, to: toCanisterId, timeout: 1000 };
                return await wallet.requestBurnXTC(params);
            }
        }
        catch (e) {
            console.error("Plug: requestBurnXTC failed", { amount, toCanisterId }, e);
            throw e;
        }
    },
    requestTransfer: async (to, amountE8S) => {
        try {
            const wallet = getGlobalWallet();
            if (wallet) {
                const params = { to: to, amount: amountE8S };
                return await wallet.requestTransfer(params);
            }
        }
        catch (e) {
            console.error("Plug: requestTransfer failed", { to, amountE8S }, e);
            throw e;
        }
    },
};
exports.PlugHelper = Helper;
const getGlobalWallet = () => {
    // @ts-ignore
    return (0, AuthCommon_1.getGlobalIC)()["plug"];
};
//# sourceMappingURL=plugHelper.js.map