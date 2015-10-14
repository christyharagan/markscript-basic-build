import * as core from 'markscript-core';
export interface BasicBuildConfig {
    database: {
        modelObject: Object;
        defaultTaskUser?: string;
        modules?: string | string[];
        ruleSets?: core.RuleSetSpec[];
        tasks?: core.TaskSpec[];
        alerts?: core.AlertSpec[];
        extensions?: {
            [extensionName: string]: string;
        };
    };
}
export declare const BasicBuildPlugin: core.BuildModelPlugin<BasicBuildConfig, {}>;
