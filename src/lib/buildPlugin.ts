import * as core from 'markscript-core'
import * as s from 'typescript-schema'
import * as p from 'typescript-package'
import * as mg from './modelGenerator'
import * as path from 'path'
import * as glob from 'glob'
import * as os from 'os'

export interface BasicBuildConfig {
  database: {
    modelObject: Object

    defaultTaskUser?: string

    modules?: string | string[]
    ruleSets?: MarkScript.RuleSetSpec[]
    tasks?: MarkScript.TaskSpec[]
    alerts?: MarkScript.AlertSpec[]
    extensions?: { [extensionName: string]: string }
  }
}

export const basicBuildPlugin: core.BuildModelPlugin<BasicBuildConfig, {}> = {
  generate: function(buildModel: MarkScript.BuildModel, options: MarkScript.BuildConfig&BasicBuildConfig, pkgDir:string, typeModel?: s.KeyValue<s.reflective.Module>, assetTypeModel?: s.KeyValue<s.reflective.Module>): MarkScript.BuildModel {
    let model = mg.generateModel(typeModel, options.database.modelObject, options.databaseConnection.host || os.hostname())
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
    mg.generateAssetModel(assetTypeModel, options.database.modelObject, buildModel, options.database.defaultTaskUser || options.databaseConnection.user)

    let baseDir:string
    if (options.database.modules) {
      let tsConfig = p.getTSConfig(pkgDir)
      baseDir = tsConfig.compilerOptions.rootDir ? path.join(pkgDir, tsConfig.compilerOptions.rootDir) : pkgDir
      if (Array.isArray(options.database.modules)) {
        mg.addModules(buildModel, pkgDir, baseDir, <string[]>options.database.modules)
      } else if (typeof options.database.modules === 'string') {
        mg.addModules(buildModel, pkgDir, baseDir, glob.sync(<string>options.database.modules, { cwd: baseDir }))
      }
    } else if (options.assetBaseDir) {
      let assetBaseDir = path.isAbsolute(options.assetBaseDir) ? options.assetBaseDir : path.join(pkgDir, options.assetBaseDir)
      let tsConfig = p.getTSConfig(assetBaseDir)
      baseDir = tsConfig.compilerOptions.rootDir ? path.join(assetBaseDir, tsConfig.compilerOptions.rootDir) : assetBaseDir
      mg.addModules(buildModel, pkgDir, baseDir, glob.sync('**/*.ts', { cwd: baseDir }))
    }
    if (options.database.extensions) {
      mg.addExtensions(buildModel, baseDir, options.database.extensions)
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
