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
export declare const useStoicAuthProviderContext: () => Context;
type Props = {};
export declare const StoicAuthProvider: (props: PropsWithChildren<Props>) => React.JSX.Element;
export {};
