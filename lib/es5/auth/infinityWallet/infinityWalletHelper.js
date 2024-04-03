"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfinityWalletHelper = void 0;
const geekfactory_js_util_1 = require("geekfactory-js-util");
const nns_ledger_1 = require("../../ic/nns_ledger/nns_ledger");
const AuthCommon_1 = require("../AuthCommon");
const host = process.env.NODE_ENV === "development" ? `http://localhost:${process.env.LOCAL_REPLICA_PORT || 4943}` : undefined;
const walletOneAtATimePromise = geekfactory_js_util_1.OneAtATimePromiseFacade.create();
/**
 * https://infinityswap-docs-wallet.web.app/docs/wallet
 */
const Helper = {
    isAvailable: () => {
        try {
            // noinspection EqualityComparisonWithCoercionJS
            return getGlobalWallet() != undefined;
        }
        catch (e) {
            return false;
        }
    },
    getLoggedInPrincipal: async (whitelist = undefined) => {
        try {
            const wallet = getGlobalWallet();
            if (wallet) {
                const connected = await wallet.isConnected();
                if (!connected || !wallet.agent) {
                    await wallet.requestConnect({
                        host: host,
                        whitelist: whitelist,
                    });
                }
                return await Helper.getPrincipal();
            }
        }
        catch (e) {
            console.error("InfinityWallet: getLoggedInPrincipal failed", e);
        }
    },
    login: async (whitelist = undefined) => {
        try {
            const wallet = getGlobalWallet();
            if (wallet) {
                await wallet.requestConnect({
                    host: host,
                    whitelist: whitelist,
                });
                return await Helper.getPrincipal();
            }
        }
        catch (e) {
            console.error("InfinityWallet: login failed", e);
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
            interfaceFactory: interfaceFactory,
            host: host,
        };
        try {
            const wallet = getGlobalWallet();
            if (wallet) {
                const actor = await walletOneAtATimePromise.oneAtATimePromise(() => wallet.createActor(parameters), "canisterId_" + canisterId);
                return actor;
            }
        }
        catch (e) {
            console.error("InfinityWallet: createActor failed", parameters, e);
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
            console.error("InfinityWallet: logout failed", e);
        }
    },
    requestTransfer: async (to, amountE8S) => {
        try {
            const wallet = getGlobalWallet();
            if (wallet) {
                let isSuccess = false;
                let result;
                let error;
                const ledgerTransferICPTransaction = createLedgerTransferICPTransaction(to, amountE8S, res => {
                    result = res;
                    isSuccess = true;
                }, err => {
                    console.log("InfinityWallet.requestTransfer: tx failure with error:", error);
                    error = err;
                });
                await wallet.batchTransactions([ledgerTransferICPTransaction]);
                if (isSuccess) {
                    return result;
                }
                // noinspection ExceptionCaughtLocallyJS
                throw error;
            }
        }
        catch (e) {
            console.error("InfinityWallet.requestTransfer: failed to call batchTransactions with", { to, amountE8S }, e);
            throw e;
        }
    },
};
exports.InfinityWalletHelper = Helper;
const getGlobalWallet = () => {
    // @ts-ignore
    return (0, AuthCommon_1.getGlobalIC)()["infinityWallet"];
};
/**
 * example from https://infinityswap-docs-wallet.web.app/docs/wallet
 */
const createLedgerTransferICPTransaction = (toAccountIdentifier, amountE8S, onSuccess, onFail) => {
    return {
        idl: nns_ledger_1.idlFactory,
        canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
        methodName: 'send_dfx',
        args: [
            {
                to: toAccountIdentifier,
                fee: { e8s: BigInt(10000) },
                amount: { e8s: amountE8S },
                memo: BigInt(0),
                from_subaccount: [], // For now, using default subaccount to handle ICP
                created_at_time: [],
            },
        ],
        onSuccess: onSuccess,
        onFail: onFail,
    };
};
//# sourceMappingURL=infinityWalletHelper.js.map