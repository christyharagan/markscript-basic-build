import * as core from 'markscript-core';
export declare type Args = {
    [name: string]: string | number | boolean;
};
export interface BasicServer {
    callGet<T>(name: string, args?: Args): Promise<T>;
    callPost<T>(name: string, args?: Args, body?: string | Object): Promise<T>;
    callPut<T>(name: string, args?: Args, body?: string | Object): Promise<T>;
    callDelete<T>(name: string, args?: Args): Promise<T>;
}
export declare class Server extends core.CoreServer implements core.Server {
    callGet<T>(name: string, args?: {
        [name: string]: string | number | boolean;
    }): Promise<T>;
    callPost<T>(name: string, args?: {
        [name: string]: string | number | boolean;
    }, body?: string | Object | Buffer | NodeJS.ReadableStream): Promise<T>;
    callPut<T>(name: string, args?: {
        [name: string]: string | number | boolean;
    }, body?: string | Object | Buffer | NodeJS.ReadableStream): Promise<T>;
    callDelete<T>(name: string, args?: {
        [name: string]: string | number | boolean;
    }): Promise<T>;
}
