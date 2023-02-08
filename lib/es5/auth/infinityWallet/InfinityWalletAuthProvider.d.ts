import { PropsWithChildren } from "react";
import { ContextState, ContextStatus, CreateActorFn, LoginFnResult } from "../AuthCommon";
type LoginFn = () => Promise<LoginFnResult>;
type LogoutFn = () => void;
interface Context {
    status: ContextStatus;
    state: ContextState;
    login: LoginFn;
    logout: LogoutFn;
    createActor: CreateActorFn;
}
export declare const useInfinityWalletAuthProviderContext: () => Context;
type Props = {
    whitelist?: Array<string>;
};
export declare const InfinityWalletAuthProvider: (props: PropsWithChildren<Props>) => JSX.Element;
export {};
