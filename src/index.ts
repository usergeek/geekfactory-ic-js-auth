export * from "./auth/AuthCommon";
export * from "./auth/authSource/AuthSourceProvider";
export * from "./auth/AuthProvider"
import {InternetIdentityAuthProvider, InternetIdentityAuthProviderContext, useInternetIdentityAuthProviderContext} from "./auth/internetIdentity/InternetIdentityAuthProvider";
import {NFIDAuthProviderContext, useNFIDAuthProviderContext} from "./auth/nfid/NFIDAuthProvider";
import {PlugAuthProvider, usePlugAuthProviderContext} from "./auth/plug/PlugAuthProvider";
import {StoicAuthProvider, useStoicAuthProviderContext} from "./auth/stoic/StoicAuthProvider";
import {InfinityWalletAuthProvider, useInfinityWalletAuthProviderContext} from "./auth/infinityWallet/InfinityWalletAuthProvider";

export {PlugHelper} from "./auth/plug/plugHelper"
export {InfinityWalletHelper} from "./auth/infinityWallet/infinityWalletHelper"

export {
    InternetIdentityAuthProvider,
    useInternetIdentityAuthProviderContext,
    InternetIdentityAuthProviderContext,
    useNFIDAuthProviderContext,
    NFIDAuthProviderContext,
    PlugAuthProvider,
    usePlugAuthProviderContext,
    StoicAuthProvider,
    useStoicAuthProviderContext,
    InfinityWalletAuthProvider,
    useInfinityWalletAuthProviderContext,
}
