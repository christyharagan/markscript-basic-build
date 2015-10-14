import * as core from 'markscript-core'
import * as s from 'typescript-schema'
import * as mg from './modelGenerator'
import * as path from 'path'
import * as glob from 'glob'

export interface BasicBuildConfig {
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

export const BasicBuildPlugin: core.BuildModelPlugin<BasicBuildConfig, {}> = {
  generate: function(buildModel: core.BuildModel, options: core.BuildConfig&BasicBuildConfig, pkgDir:string, typeModel?: s.KeyValue<s.reflective.Module>): core.BuildModel {
    let model = mg.generateModel(typeModel, options.database.modelObject, options.database.host)
    Object.keys(model).forEach(function(key){
      if (key === 'databases') {
        Object.keys(model.databases).forEach(function(name){
          buildModel.databases[name] = model.databases[name]
        })
      } else if (key === 'servers') {
        Object.keys(model.servers).forEach(function(name){
          buildModel.servers[name] = model.servers[name]
        })
      } else {
        buildModel[key] = model[key]
      }
    })
    mg.generateAssetModel(typeModel, options.database.modelObject, buildModel, options.database.defaultTaskUser || options.database.user)

    if (options.database.modules) {
      if (Array.isArray(options.database.modules)) {
        mg.addModules(buildModel, pkgDir, <string[]>options.database.modules)
      } else if (typeof options.database.modules === 'string') {
        mg.addModules(buildModel, pkgDir, glob.sync(<string>options.database.modules, { cwd: pkgDir }))
      }
    }
    if (options.database.extensions) {
      mg.addExtensions(buildModel, pkgDir, options.database.extensions)
    }
    if (options.database.tasks) {
      options.database.tasks.forEach(function(taskSpec) {
        buildModel.tasks[taskSpec.name] = taskSpec
      })
    }
    if (options.database.alerts) {
      options.database.alerts.forEach(function(alertSpec) {
        buildModel.alerts[alertSpec.name] = alertSpec
      })
    }
    if (options.database.ruleSets) {
      options.database.ruleSets.forEach(function(ruleSetSpec) {
        buildModel.ruleSets.push(ruleSetSpec)
      })
    }
    return buildModel
  }
}