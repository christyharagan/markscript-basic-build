export declare type Args = {
    [name: string]: string | number | boolean;
};
export interface BasicServer {
    callGet<T>(name: string, args?: Args): Promise<T>;
    callPost<T>(name: string, args?: Args, body?: string | Object): Promise<T>;
    callPut<T>(name: string, args?: Args, body?: string | Object): Promise<T>;
    callDelete<T>(name: string, args?: Args): Promise<T>;
}
