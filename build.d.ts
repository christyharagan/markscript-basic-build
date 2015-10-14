declare interface BasicBuildConfig {
  database: {
    modelObject: Object

    defaultTaskUser?: string

    modules?: string
  }
}

declare interface BasicServer {
  callGet<T>(name: string, args?: { [name: string]: string | number | boolean }): Promise<T>
  callPost<T>(name: string, args?: { [name: string]: string | number | boolean }, body?: string | Object): Promise<T>
  callPut<T>(name: string, args?: { [name: string]: string | number | boolean }, body?: string | Object): Promise<T>
  callDelete<T>(name: string, args?: { [name: string]: string | number | boolean }): Promise<T>
}

declare module 'markscript-basic-build' {
  import m = require('markscript-core')
  function contentDatabase(): (target: Object, propertyKey: string) => void;
  function triggersDatabase(): (target: Object, propertyKey: string) => void;
  function schemaDatabase(): (target: Object, propertyKey: string) => void;
  function modulesDatabase(): (target: Object, propertyKey: string) => void;
  function securityDatabase(): (target: Object, propertyKey: string) => void;
  enum ScalarType {
      int = 0,
      unsignedInt = 1,
      long = 2,
      unsignedLong = 3,
      float = 4,
      double = 5,
      decimal = 6,
      dateTime = 7,
      time = 8,
      date = 9,
      gYearMonth = 10,
      gYear = 11,
      gMonth = 12,
      gDay = 13,
      yearMonthDuration = 14,
      dayTimeDuration = 15,
      string = 16,
      anyURI = 17,
  }
  export interface RangeIndexedOptions {
      collation?: string;
      scalarType?: ScalarType;
      path?: string;
      name: string;
  }
  export interface GeoIndexedOptions {
      name: string;
      path?: string;
      pointFormat?: string;
      coordinateSystem?: string;
  }
  export interface RuleSetOptions {
      path: string;
  }
  function mlDeploy(): (target: any) => void;
  function geoIndexed(definition?: GeoIndexedOptions): (target: Object, propertyKey: string) => void;
  function rangeIndexed(definition?: RangeIndexedOptions): (target: Object, propertyKey: string) => void;
  function mlRuleSet(definition: RuleSetOptions): (target: Object, propertyKey: string, method: TypedPropertyDescriptor<() => string>) => void;
  export interface TaskOptions {
      type: m.FrequencyType;
      frequency: number;
      user?: string;
      name?: string;
  }
  function mlTask(definition?: TaskOptions): (target: Object, propertyKey: string) => void;
  export interface AlertOptions {
      name?: string;
      scope: string;
      states?: m.TRIGGER_STATE[];
      depth?: number;
      commit?: m.TRIGGER_COMMIT;
  }
  function mlAlert(definition?: AlertOptions): (target: Object, propertyKey: string) => void;
  function mlExtension(): (target: any) => any;


  class Server implements BasicServer {
    callGet<T>(name: string, args?: { [name: string]: string | number | boolean }): Promise<T>
    callPost<T>(name: string, args?: { [name: string]: string | number | boolean }, body?: string | Object): Promise<T>
    callPut<T>(name: string, args?: { [name: string]: string | number | boolean }, body?: string | Object): Promise<T>
    callDelete<T>(name: string, args?: { [name: string]: string | number | boolean }): Promise<T>
  }
}
