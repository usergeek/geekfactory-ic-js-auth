import {ActorSubclass} from "@dfinity/agent";
import {OneAtATimePromiseFacade} from "geekfactory-js-util";
import {idlFactory as ledgerIDL} from '../../ic/nns_ledger/nns_ledger';
import {getGlobalIC} from "../AuthCommon";
import {IDL} from "@dfinity/candid";
import {Principal} from "@dfinity/principal";

const host = process.env.NODE_ENV === "development" ? `http://localhost:${process.env.LOCAL_REPLICA_PORT || 4943}` : undefined

const walletOneAtATimePromise = OneAtATimePromiseFacade.create()

/**
 * https://infinityswap-docs-wallet.web.app/docs/wallet
 */
const Helper = {

    isAvailable: (): boolean => {
        try {
            // noinspection EqualityComparisonWithCoercionJS
            return getGlobalWallet() != undefined
        } catch (e) {
            return false
        }
    },

    getLoggedInPrincipal: async (whitelist: Array<string> | undefined = undefined): Promise<Principal | undefined> => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const connected = await wallet.isConnected()
                if (!connected || !wallet.agent) {
                    await wallet.requestConnect({
                        host: host,
                        whitelist: whitelist,
                    });
                }
                return await Helper.getPrincipal()
            }
        } catch (e) {
            console.error("InfinityWallet: getLoggedInPrincipal failed", e);
        }
    },

    login: async (whitelist: Array<string> | undefined = undefined): Promise<Principal | undefined> => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                await wallet.requestConnect({
                    host: host,
                    whitelist: whitelist,
                });
                return await Helper.getPrincipal()
            }
        } catch (e) {
            console.error("InfinityWallet: login failed", e);
            throw e
        }
    },

    getPrincipal: async (): Promise<Principal | undefined> => {
        const wallet = getGlobalWallet()
        if (wallet) {
            return await wallet.getPrincipal()
        }
        return undefined
    },

    createActor: async <T>(canisterId: string, interfaceFactory: IDL.InterfaceFactory): Promise<ActorSubclass<T> | undefined> => {
        const parameters = {
            canisterId: canisterId,
            interfaceFactory: interfaceFactory,
            host: host,
        }
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const actor = await walletOneAtATimePromise.oneAtATimePromise<ActorSubclass<T> | undefined>(() => wallet.createActor(parameters), "canisterId_" + canisterId)
                return actor
            }
        } catch (e) {
            console.error("InfinityWallet: createActor failed", parameters, e);
        }
        return undefined
    },

    logout: async () => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                await wallet.disconnect()
            }
        } catch (e) {
            console.error("InfinityWallet: logout failed", e);
        }
    },

    requestTransfer: async (to: string, amountE8S: bigint) => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                let isSuccess = false
                let result: any
                let error: any
                const ledgerTransferICPTransaction = createLedgerTransferICPTransaction(to, amountE8S, res => {
                    result = res
                    isSuccess = true
                }, err => {
                    console.log("InfinityWallet.requestTransfer: tx failure with error:", error);
                    error = err
                });
                await wallet.batchTransactions([ledgerTransferICPTransaction])
                if (isSuccess) {
                    return result
                }
                // noinspection ExceptionCaughtLocallyJS
                throw error
            }
        } catch (e) {
            console.error("InfinityWallet.requestTransfer: failed to call batchTransactions with", {to, amountE8S}, e);
            throw e;
        }
    },
};

export const InfinityWalletHelper = Helper

const getGlobalWallet = () => {
    // @ts-ignore
    return getGlobalIC()["infinityWallet"]
}

/**
 * example from https://infinityswap-docs-wallet.web.app/docs/wallet
 */
const createLedgerTransferICPTransaction = (toAccountIdentifier: string, amountE8S: bigint, onSuccess: (res: any) => void, onFail: (err: any) => void) => {
    return {
        idl: ledgerIDL,
        canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
        methodName: 'send_dfx',
        args: [
            {
                to: toAccountIdentifier,
                fee: {e8s: BigInt(10000)},
                amount: {e8s: amountE8S},
                memo: BigInt(0),
                from_subaccount: [], // For now, using default subaccount to handle ICP
                created_at_time: [],
            },
        ],
        onSuccess: onSuccess,
        onFail: onFail,
    };
}