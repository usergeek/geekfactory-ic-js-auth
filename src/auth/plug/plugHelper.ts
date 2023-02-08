import {Principal} from "@dfinity/principal";
import {IDL} from "@dfinity/candid";
import {ActorSubclass} from "@dfinity/agent";
import {getGlobalIC} from "../AuthCommon";
import {OneAtATimePromiseFacade} from "geekfactory-ic-js-util";

const host = process.env.NODE_ENV === "development" ? `http://localhost:${process.env.LOCAL_REPLICA_PORT || 4943}` : undefined

const walletOneAtATimePromise = OneAtATimePromiseFacade.create()

const Helper = {
    isAvailable: (): boolean => {
        try { // noinspection EqualityComparisonWithCoercionJS
            return getGlobalWallet() != undefined
        } catch (e) {
            return false
        }
    },

    getLoggedInPrincipal: async (): Promise<Principal | undefined> => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const connected = await wallet.isConnected()
                if (connected) {
                    return await Helper.getPrincipal()
                }
            }
        } catch (e) {
            console.error("Plug: getLoggedInPrincipal failed", e);
        }
    },

    login: async (whitelist: Array<string> | undefined = undefined): Promise<Principal | undefined> => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const result = await walletOneAtATimePromise.oneAtATimePromise(() => wallet.requestConnect({
                    host: host,
                    whitelist: whitelist,
                    timeout: 10000,
                }), "plug_login");
                if (result) {
                    return await Helper.getPrincipal()
                }
            }
        } catch (e) {
            console.error("Plug: login failed", e);
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
            interfaceFactory: interfaceFactory
        }
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const actor = await walletOneAtATimePromise.oneAtATimePromise<ActorSubclass<T> | undefined>(() => wallet.createActor(parameters), "canisterId_" + canisterId)
                return actor
            }
        } catch (e) {
            console.error("Plug: createActor failed", parameters, e);
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
            console.error("Plug: logout failed", e);
        }
    },

    requestBurnXTC: async (amount: number, toCanisterId: string): Promise<bigint | undefined> => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const params = {amount: amount, to: toCanisterId, timeout: 1000};
                return await wallet.requestBurnXTC(params)
            }
        } catch (e) {
            console.error("Plug: requestBurnXTC failed", {amount, toCanisterId}, e);
            throw e;
        }
    },

    requestTransfer: async (to: string, amountE8S: number): Promise<{height: number}> => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const params = {to: to, amount: amountE8S};
                return await wallet.requestTransfer(params)
            }
        } catch (e) {
            console.error("Plug: requestTransfer failed", {to, amountE8S}, e);
            throw e;
        }
    },
};

export const PlugHelper = Helper

const getGlobalWallet = () => {
    // @ts-ignore
    return getGlobalIC()["plug"]
}