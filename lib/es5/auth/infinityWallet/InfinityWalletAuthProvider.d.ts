import * as React from "react";
import { PropsWithChildren } from "react";
import { ContextState, ContextStatus, CreateActorFn, LoginFnResult } from "../AuthCommon";
type LoginFn = () => Promise<LoginFnResult>;
type LogoutFn = () => Promise<void>;
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
    autologinTimeout?: number;
};
export declare const InfinityWalletAuthProvider: (props: PropsWithChildren<Props>) => React.JSX.Element;
export {};
