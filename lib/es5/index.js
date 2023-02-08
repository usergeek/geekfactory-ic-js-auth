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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInfinityWalletAuthProviderContext = exports.InfinityWalletAuthProvider = exports.useStoicAuthProviderContext = exports.StoicAuthProvider = exports.usePlugAuthProviderContext = exports.PlugAuthProvider = exports.NFIDInternetIdentityAuthProviderContext = exports.useNFIDInternetIdentityAuthProviderContext = exports.InternetIdentityAuthProviderContext = exports.useInternetIdentityAuthProviderContext = exports.InternetIdentityAuthProvider = exports.InfinityWalletHelper = exports.PlugHelper = void 0;
__exportStar(require("./auth/AuthCommon"), exports);
__exportStar(require("./auth/authSource/AuthSourceProvider"), exports);
__exportStar(require("./auth/AuthProvider"), exports);
const InternetIdentityAuthProvider_1 = require("./auth/internetIdentity/InternetIdentityAuthProvider");
Object.defineProperty(exports, "InternetIdentityAuthProvider", { enumerable: true, get: function () { return InternetIdentityAuthProvider_1.InternetIdentityAuthProvider; } });
Object.defineProperty(exports, "InternetIdentityAuthProviderContext", { enumerable: true, get: function () { return InternetIdentityAuthProvider_1.InternetIdentityAuthProviderContext; } });
Object.defineProperty(exports, "useInternetIdentityAuthProviderContext", { enumerable: true, get: function () { return InternetIdentityAuthProvider_1.useInternetIdentityAuthProviderContext; } });
const NFIDAuthProvider_1 = require("./auth/nfid/NFIDAuthProvider");
Object.defineProperty(exports, "NFIDInternetIdentityAuthProviderContext", { enumerable: true, get: function () { return NFIDAuthProvider_1.NFIDInternetIdentityAuthProviderContext; } });
Object.defineProperty(exports, "useNFIDInternetIdentityAuthProviderContext", { enumerable: true, get: function () { return NFIDAuthProvider_1.useNFIDInternetIdentityAuthProviderContext; } });
const PlugAuthProvider_1 = require("./auth/plug/PlugAuthProvider");
Object.defineProperty(exports, "PlugAuthProvider", { enumerable: true, get: function () { return PlugAuthProvider_1.PlugAuthProvider; } });
Object.defineProperty(exports, "usePlugAuthProviderContext", { enumerable: true, get: function () { return PlugAuthProvider_1.usePlugAuthProviderContext; } });
const StoicAuthProvider_1 = require("./auth/stoic/StoicAuthProvider");
Object.defineProperty(exports, "StoicAuthProvider", { enumerable: true, get: function () { return StoicAuthProvider_1.StoicAuthProvider; } });
Object.defineProperty(exports, "useStoicAuthProviderContext", { enumerable: true, get: function () { return StoicAuthProvider_1.useStoicAuthProviderContext; } });
const InfinityWalletAuthProvider_1 = require("./auth/infinityWallet/InfinityWalletAuthProvider");
Object.defineProperty(exports, "InfinityWalletAuthProvider", { enumerable: true, get: function () { return InfinityWalletAuthProvider_1.InfinityWalletAuthProvider; } });
Object.defineProperty(exports, "useInfinityWalletAuthProviderContext", { enumerable: true, get: function () { return InfinityWalletAuthProvider_1.useInfinityWalletAuthProviderContext; } });
var plugHelper_1 = require("./auth/plug/plugHelper");
Object.defineProperty(exports, "PlugHelper", { enumerable: true, get: function () { return plugHelper_1.PlugHelper; } });
var infinityWalletHelper_1 = require("./auth/infinityWallet/infinityWalletHelper");
Object.defineProperty(exports, "InfinityWalletHelper", { enumerable: true, get: function () { return infinityWalletHelper_1.InfinityWalletHelper; } });
//# sourceMappingURL=index.js.map