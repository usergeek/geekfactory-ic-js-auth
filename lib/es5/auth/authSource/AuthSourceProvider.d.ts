import { PropsWithChildren } from "react";
export type Source = "II" | "Plug" | "Stoic" | "NFID" | "InfinityWallet" | undefined;
type SetSourceFn = (source: Source) => void;
interface Context {
    source: Source;
    setSource: SetSourceFn;
}
export declare const useAuthSourceProviderContext: () => Context;
export declare const AuthSourceProvider: (props: PropsWithChildren<{
    storeNamespace: string;
}>) => JSX.Element;
export {};
