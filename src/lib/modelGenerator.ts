import {reflective as s, visitType, TypeVisitor, TypeKind, expressionToLiteral, PrimitiveTypeKind, MemberVisitor, interfaceConstructorToString, classConstructorToString, KeyValue, visitModules, CompositeTypeVisitor, visitClassConstructor, ContainerVisitor, ClassConstructorVisitor} from 'typescript-schema'
import * as basic from 'markscript-basic'
import * as d from './decorators'
import * as t from 'typescript'
import * as p from 'typescript-package'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

let babel = require('babel')

function toScalarType(rangeOptions: basic.RangeIndexedOptions, member: s.DecoratedMember<any>): string {
  if (rangeOptions.scalarType) {
    switch (rangeOptions.scalarType) {
      case basic.ScalarType.int:
        return 'int'
      case basic.ScalarType.unsignedInt:
        return 'unsignedInt'
      case basic.ScalarType.long:
        return 'long'
      case basic.ScalarType.unsignedLong:
        return 'unsignedLong'
      case basic.ScalarType.float:
        return 'float'
      case basic.ScalarType.double:
        return 'double'
      case basic.ScalarType.decimal:
        return 'decimal'
      case basic.ScalarType.dateTime:
        return 'dateTime'
      case basic.ScalarType.time:
        return 'time'
      case basic.ScalarType.date:
        return 'date'
      case basic.ScalarType.gYearMonth:
        return 'gYearMonth'
      case basic.ScalarType.gYear:
        return 'gYear'
      case basic.ScalarType.gMonth:
        return 'gMonth'
      case basic.ScalarType.gDay:
        return 'gDay'
      case basic.ScalarType.yearMonthDuration:
        return 'yearMonthDuration'
      case basic.ScalarType.dayTimeDuration:
        return 'dayTimeDuration'
      case basic.ScalarType.string:
        return 'string'
      case basic.ScalarType.anyURI:
        return 'anyURI'
    }
  } else {
    let value: string
    visitType(<s.Type>member.type, <TypeVisitor>{
      onString: function() {
        value = 'string'
      },
      onNumber: function() {
        value = 'float'
      },
      onArrayType: function(arr) {
        return <TypeVisitor>{
          onString: function() {
            value = 'string'
          },
          onNumber: function() {
            value = 'float'
          }
        }
      }
    })
    return value
  }
  return null
}

function toModuleName(name: string, packageName?: string) {
  name = name.replace(/\\/g, '/')
  let suffix = name.substring(name.length - 3).toLowerCase()
  if (suffix === '.js' || suffix === '.ts') {
    name = name.substring(0, name.length - 3)
  }
  if (packageName) {
    name = path.join(packageName, name)
  }
  if (name.charAt(0) !== '/') {
    name = '/' + name
  }
  return name
}

export function generateAssetModel(schema: KeyValue<s.Module>, definition: Object, assetModel?: MarkScript.AssetModel, defaultTaskUser?: string): MarkScript.AssetModel {
  if (assetModel) {
    if (!assetModel.ruleSets) {
      assetModel.ruleSets = []
    }
    if (!assetModel.alerts) {
      assetModel.alerts = {}
    }
    if (!assetModel.modules) {
      assetModel.modules = {}
    }
    if (!assetModel.extensions) {
      assetModel.extensions = {}
    }
    if (!assetModel.tasks) {
      assetModel.tasks = {}
    }
  } else {
    assetModel = {
      ruleSets: [],
      modules: {},
      extensions: {},
      tasks: {},
      alerts: {}
    }
  }

  visitModules(schema, {
    onModule: function(module) {
      return <ContainerVisitor>{
        onClassConstructor: function(cc) {
          return <ClassConstructorVisitor>{
            onClassConstructorDecorator: function(decorator) {
              switch (decorator.decoratorType.name) {
                case 'mlExtension':
                  let methods:string[] = []
                  let extensionOptions = decorator.parameters && decorator.parameters[0] ? <basic.ExtensionOptions>expressionToLiteral(decorator.parameters[0]) : null

                  // TODO: Implement type checking

                  // let isValid = false

                  visitClassConstructor(cc, {
                    // onImplement: function(impl) {
                    //   if (interfaceConstructorToString(<s.InterfaceConstructor>impl.typeConstructor) === 'markscript-build/lib/server/extension:Extension') {
                    //     isValid = true
                    //   }
                    // },
                    onInstanceType: function(it) {
                      return <CompositeTypeVisitor>{
                        onMember: function(member) {
                          switch (member.name) {
                            case 'get':
                            case 'post':
                            case 'put':
                            case 'delete':
                              methods.push(member.name)
                          }
                        }
                      }
                    }
                  })

                  // if (!isValid) {
                  //   throw new Error('A class annotated as a MarkLogic extension should implement markscript-core.Extension, at: ' + module.name + ':' + cc.name)
                  // }

                  let code = 'var ExtensionClass = r' + `equire("${toModuleName(module.name) }").${cc.name};
var extensionObject = new ExtensionClass();
`
                  methods.forEach(function(method) {
                    code += `exports.${method.toUpperCase()} = extensionObject.${method}.bind(extensionObject);
`
                  })

                  let extensionModuleName = (extensionOptions && extensionOptions.name) ? extensionOptions.name : ('_extensions-' + classConstructorToString(cc).replace(/:/g, '-').replace(/\//g, '-'))
                  assetModel.extensions[extensionModuleName] = {
                    name: extensionModuleName,
                    code: code
                  }
              }
            },
            onInstanceType: function(it) {
              return <CompositeTypeVisitor>{
                onMember: function(member) {
                  return <MemberVisitor>{
                    onMemberDecorator: function(decorator) {
                      switch (decorator.decoratorType.name) {
                        case 'mlRuleSet':
                          if ((<s.PrimitiveType>member.type).primitiveTypeKind !== PrimitiveTypeKind.STRING && !((<s.FunctionType>member.type).typeKind === TypeKind.FUNCTION && (<s.PrimitiveType>(<s.FunctionType>member.type).type).primitiveTypeKind === PrimitiveTypeKind.STRING)) {
                            throw new Error('A class member annotated as a MarkLogic rule set must be a string property, at: ' + module.name + ':' + cc.name + ':' + member.name)
                          }
                          let path = (<basic.RuleSetOptions>expressionToLiteral(decorator.parameters[0])).path
                          let rules = definition[decorator.parent.name]()

                          assetModel.ruleSets.push({
                            path: path,
                            rules: rules
                          })
                          break
                        case 'mlAlert':
                          if (cc.staticType.calls && cc.staticType.calls.length === 1 && cc.staticType.calls[0].parameters.length > 0) {
                            throw new Error('A class annotated with a MarkLogic alert must have a zero arg constructor, at: ' + module.name + ':' + cc.name + ':' + member.name)
                          }
                          if ((<s.Type>member.type).typeKind !== TypeKind.FUNCTION || (<s.FunctionType>member.type).parameters.length !== 2) {
                            throw new Error('A class member annotated as a MarkLogic alert must be a method of type (uri?:string, content?:cts.DocumentNode)=>void, at: ' + module.name + ':' + cc.name + ':' + member.name)
                          }
                          let alertOptions = <basic.AlertOptions>expressionToLiteral(decorator.parameters[0])
                          let alertModuleName = '/_alerts/' + classConstructorToString(cc).replace(/:/g, '/') + '/' + member.name
                          let alertName = alertOptions.name || (classConstructorToString(cc).replace(/\//g, '-').replace(/:/g, '-') + '-' + member.name)
                          assetModel.alerts[alertName] = {
                            name: alertName,
                            scope: alertOptions.scope,
                            states: alertOptions.states,
                            depth: alertOptions.depth,
                            commit: alertOptions.commit,
                            actionModule: alertModuleName
                          }
                          assetModel.modules[alertModuleName] = {
                            name: alertModuleName,
                            code: 'var AlertClass = r' + `equire("${toModuleName(module.name) }").${cc.name};
var alertObject = new AlertClass();
module.exports = function(uri, content){
  alertObject.${member.name}(uri, content);
}`
                          }
                          break
                        case 'mlTask':
                          if (cc.staticType.calls && cc.staticType.calls.length === 1 && cc.staticType.calls[0].parameters.length > 0) {
                            throw new Error('A class annotated with a MarkLogic task must have a zero arg constructor, at: ' + module.name + ':' + cc.name + ':' + member.name)
                          }
                          if ((<s.Type>member.type).typeKind !== TypeKind.FUNCTION || (<s.FunctionType>member.type).parameters.length > 0) {
                            throw new Error('A class member annotated as a MarkLogic task must be a method with zero parameters, at: ' + module.name + ':' + cc.name + ':' + member.name)
                          }
                          let taskOptions = <basic.TaskOptions>expressionToLiteral(decorator.parameters[0])
                          let taskModuleName = '/_tasks/' + classConstructorToString(cc).replace(/:/g, '/') + '/' + member.name
                          let taskName = taskOptions.name || classConstructorToString(cc).replace(/\//g, '-').replace(/:/g, '-') + '-' + member.name
                          assetModel.tasks[taskName] = {
                            type: taskOptions.type || MarkScript.FrequencyType.MINUTES,
                            frequency: taskOptions.frequency,
                            user: taskOptions.user || defaultTaskUser,
                            name: taskName,
                            module: taskModuleName
                          }
                          assetModel.modules[taskModuleName] = {
                            name: taskModuleName,
                            code: 'var TaskClass = r' + `equire("${toModuleName(module.name)}").${cc.name};
var taskObject = new TaskClass();
taskObject.${member.name}();`
                          }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  return assetModel
}

function loadCode(baseDir: string, modulePath: string): string {
  let fileName = path.join(baseDir, modulePath)
  let code = fs.readFileSync(fileName).toString()

  // TODO: Do we really want to transpile ourselves? If so, we should offer more options to the user
  if (fileName.substring(fileName.length - 3).toLowerCase() === '.ts') {
    code = removeDecorators(code)
    code = t.transpile(code, {
      target: t.ScriptTarget.ES5
    })
  }

  // TODO: Sadly babel doesn't play nice with MarkLogic's SJS
  // code = babel.transform(code, {
  //   optional: ['es6.spec.templateLiterals', 'es6.spec.blockScoping', 'es6.spec.symbols']
  // }).code

  return code
}

export function addExtensions(assetModel: MarkScript.AssetModel, baseDir: string, extensions: { [name: string]: string }) {
  if (!assetModel.extensions) {
    assetModel.extensions = {}
  }
  Object.keys(extensions).forEach(function(name) {
    let extensionCode = loadCode(baseDir, extensions[name])

    assetModel.extensions[name] = {
      name: name,
      code: extensionCode
    }
  })
}

export function addModules(assetModel: MarkScript.AssetModel, packageDir: string, baseDir:string, modulePaths: string[]) {
  if (!assetModel.modules) {
    assetModel.modules = {}
  }
  let packageJson = p.getPackageJson(packageDir)
  modulePaths.forEach(function(moduleToDeploy) {
    if (!assetModel.modules[moduleToDeploy]) {
      let moduleCode = loadCode(baseDir, moduleToDeploy)
      let moduleName = toModuleName(moduleToDeploy, packageJson.name)

      assetModel.modules[moduleName] = {
        name: moduleName,
        code: moduleCode
      }

      if (packageJson.main && packageJson.main === moduleToDeploy) {
        let packageModuleName = toModuleName(packageJson.name)
        assetModel.modules[packageModuleName] = {
          name: packageModuleName,
          code: moduleName
        }
      }
    }
  })
}

function removeDecorators(source: string): string {
  let count = 0
  let sf = t.createSourceFile('blah.ts', source, t.ScriptTarget.ES5)
  function _removeDecorators(node: t.Node) {
    t.forEachChild(node, function(node) {
      if (node.decorators) {
        node.decorators.forEach(function(decorator) {
          let start = decorator.getStart(sf) - count
          let end = decorator.getEnd() - count
          count += (end - start)
          let before = source.substring(0, start)
          let after = source.substring(end)
          source = before + after
        })
      }
      _removeDecorators(node)
    })
  }
  _removeDecorators(sf)
  return source
}

export function generateModel(schema: KeyValue<s.Module>, definition: Object, defaultHost?: string): MarkScript.Model {
  defaultHost = (defaultHost || os.hostname()).toLowerCase()

  let model: MarkScript.Model = {
    databases: {},
    servers: {}
  }

  let rangeIndices: MarkScript.RangeIndexSpec[] = []
  let geoIndices: MarkScript.GeoIndexSpec[] = []

  let databasesByType = {
    content: null,
    triggers: null,
    schema: null,
    security: null,
    modules: null
  }
  interface Databases {
    [memberName: string]: string
  }
  let databases: Databases = {}

  visitModules(schema, {
    onModule: function(module) {
      return <ContainerVisitor>{
        onClassConstructor: function(cc) {
          let isDeployable = false
          return <ClassConstructorVisitor>{
            onClassConstructorDecorator: function(decorator) {
              if (decorator.decoratorType.name === 'mlDeploy') {
                isDeployable = true
              }
            },
            onInstanceType: function(it) {
              return <CompositeTypeVisitor>{
                onMember: function(member) {
                  if (isDeployable) {
                    let name = (<s.Interface>member.type).name
                    // TODO: We should be referencing the interface schema here, not just a name
                    switch (name) {
                      case 'DatabaseSpec':
                        let databaseSpec = <MarkScript.DatabaseSpec>definition[member.name]
                        model.databases[databaseSpec.name] = databaseSpec
                        databases[member.name] = databaseSpec.name
                        if (!databaseSpec.forests || databaseSpec.forests.length === 0) {
                          databaseSpec.forests = [{
                            name: databaseSpec.name,
                            database: databaseSpec.name,
                            host: defaultHost
                          }]
                        }
                        break
                      case 'ServerSpec':
                        let serverSpec = <MarkScript.ServerSpec>definition[member.name]
                        if (!serverSpec.group) {
                          serverSpec.group = 'Default'
                        }
                        serverSpec.host = (serverSpec.host || defaultHost).toLowerCase()
                        model.servers[serverSpec.name] = serverSpec
                        break
                    }
                  }

                  return <MemberVisitor>{
                    onMemberDecorator: function(decorator) {
                      switch (decorator.decoratorType.name) {
                        case 'rangeIndexed':
                          let rangeOptions: basic.RangeIndexedOptions = (decorator.parameters && decorator.parameters.length > 0) ? expressionToLiteral(decorator.parameters[0]) : {}
                          let scalarType = toScalarType(rangeOptions, decorator.parent)
                          if (scalarType) {
                            rangeIndices.push({
                              path: rangeOptions.path || `/${decorator.parent.name}`,
                              collation: rangeOptions.collation,
                              scalarType: scalarType
                            })
                          }
                          break;
                        case 'geoIndexed':
                          let geoOptions: basic.GeoIndexedOptions = (decorator.parameters && decorator.parameters.length > 0) ? expressionToLiteral(decorator.parameters[0]) : {}
                          // TODO: Support more than point format (e.g. long-lat-point format)
                          let geoIndex: MarkScript.GeoIndexSpec = {
                            path: geoOptions.path || `/${decorator.parent.name}`,
                            pointFormat: geoOptions.pointFormat || 'point'
                          }
                          if (geoOptions.coordinateSystem) {
                            geoIndex.coordinateSystem = geoOptions.coordinateSystem
                          }
                          geoIndices.push(geoIndex)
                          break;
                        case 'contentDatabase':
                          databasesByType.content = decorator.parent.name
                          break;
                        case 'triggersDatabase':
                          databasesByType.triggers = decorator.parent.name
                          break;
                        case 'schemaDatabase':
                          databasesByType.schema = decorator.parent.name
                          break;
                        case 'securityDatabase':
                          databasesByType.security = decorator.parent.name
                          break;
                        case 'modulesDatabase':
                          databasesByType.modules = decorator.parent.name
                          break;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  if (databasesByType.security) {
    model.securityDatabase = databases[databasesByType.security]
    Object.keys(databasesByType).forEach(function(key) {
      if (key !== 'security' && databasesByType[key]) {
        model.databases[databasesByType[key]].securityDatabase = databases[databasesByType.security]
      }
    })
  }
  if (databasesByType.modules) {
    model.modulesDatabase = databases[databasesByType.modules]
    Object.keys(model.servers).forEach(function(serverName) {
      model.servers[serverName].modulesDatabase = databases[databasesByType.modules]
    })
  }
  if (databasesByType.schema) {
    model.schemaDatabase = databases[databasesByType.schema]
  }
  if (databasesByType.triggers) {
    model.triggersDatabase = databases[databasesByType.triggers]
  }
  if (databasesByType.content) {
    model.contentDatabase = databases[databasesByType.content]
    Object.keys(model.servers).forEach(function(serverName) {
      model.servers[serverName].contentDatabase = databases[databasesByType.content]
    })
    let contentDatabase = model.databases[databases[databasesByType.content]]
    if (databasesByType.schema) {
      contentDatabase.schemaDatabase = databases[databasesByType.schema]
    }
    if (databasesByType.triggers) {
      contentDatabase.triggersDatabase = databases[databasesByType.triggers]
    }
    contentDatabase.rangeIndices = contentDatabase.rangeIndices || []
    contentDatabase.geoIndices = contentDatabase.geoIndices || []
    rangeIndices.forEach(function(rangeIndex) {
      contentDatabase.rangeIndices.push(rangeIndex)
    })
    geoIndices.forEach(function(geoIndex) {
      contentDatabase.geoIndices.push(geoIndex)
    })
  }

  return model
}
