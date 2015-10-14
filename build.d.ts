declare interface BasicBuildConfig {
  database: {
    modelObject: Object

    defaultTaskUser?: string

    modules?: string | string[]
    ruleSets?: core.RuleSetSpec[]
    tasks?: core.TaskSpec[]
    alerts?: core.AlertSpec[]
    extensions?: { [extensionName: string]: string }
  }
}

declare interface BasicServer {
  callGet<T>(name: string, args?: { [name: string]: string | number | boolean }): Promise<T>
  callPost<T>(name: string, args?: { [name: string]: string | number | boolean }, body?: string | Object): Promise<T>
  callPut<T>(name: string, args?: { [name: string]: string | number | boolean }, body?: string | Object): Promise<T>
  callDelete<T>(name: string, args?: { [name: string]: string | number | boolean }): Promise<T>
}
