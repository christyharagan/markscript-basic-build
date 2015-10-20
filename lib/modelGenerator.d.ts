import { reflective as s, KeyValue } from 'typescript-schema';
export declare function generateAssetModel(schema: KeyValue<s.Module>, definition: Object, assetModel?: MarkScript.AssetModel, defaultTaskUser?: string): MarkScript.AssetModel;
export declare function addExtensions(assetModel: MarkScript.AssetModel, baseDir: string, extensions: {
    [name: string]: string;
}): void;
export declare function addModules(assetModel: MarkScript.AssetModel, packageDir: string, baseDir: string, modulePaths: string[]): void;
export declare function generateModel(schema: KeyValue<s.Module>, definition: Object, defaultHost?: string): MarkScript.Model;
