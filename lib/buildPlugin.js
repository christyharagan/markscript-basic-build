var p = require('typescript-package');
var mg = require('./modelGenerator');
var path = require('path');
var glob = require('glob');
var os = require('os');
exports.basicBuildPlugin = {
    generate: function (buildModel, options, pkgDir, typeModel, assetTypeModel) {
        var model = mg.generateModel(typeModel, options.database.modelObject, options.databaseConnection.host || os.hostname());
        Object.keys(model).forEach(function (key) {
            if (key === 'databases') {
                Object.keys(model.databases).forEach(function (name) {
                    buildModel.databases[name] = model.databases[name];
                });
            }
            else if (key === 'servers') {
                Object.keys(model.servers).forEach(function (name) {
                    buildModel.servers[name] = model.servers[name];
                });
            }
            else {
                buildModel[key] = model[key];
            }
        });
        mg.generateAssetModel(assetTypeModel, options.database.modelObject, buildModel, options.database.defaultTaskUser || options.databaseConnection.user);
        var baseDir;
        if (options.database.modules) {
            var tsConfig = p.getTSConfig(pkgDir);
            baseDir = tsConfig.compilerOptions.rootDir ? path.join(pkgDir, tsConfig.compilerOptions.rootDir) : pkgDir;
            if (Array.isArray(options.database.modules)) {
                mg.addModules(buildModel, pkgDir, baseDir, options.database.modules);
            }
            else if (typeof options.database.modules === 'string') {
                mg.addModules(buildModel, pkgDir, baseDir, glob.sync(options.database.modules, { cwd: baseDir }));
            }
        }
        else if (options.assetBaseDir) {
            var assetBaseDir = path.isAbsolute(options.assetBaseDir) ? options.assetBaseDir : path.join(pkgDir, options.assetBaseDir);
            var tsConfig = p.getTSConfig(assetBaseDir);
            baseDir = tsConfig.compilerOptions.rootDir ? path.join(assetBaseDir, tsConfig.compilerOptions.rootDir) : assetBaseDir;
            mg.addModules(buildModel, pkgDir, baseDir, glob.sync('**/*.ts', { cwd: baseDir }));
        }
        if (options.database.extensions) {
            mg.addExtensions(buildModel, baseDir, options.database.extensions);
        }
        if (options.database.tasks) {
            options.database.tasks.forEach(function (taskSpec) {
                buildModel.tasks[taskSpec.name] = taskSpec;
            });
        }
        if (options.database.alerts) {
            options.database.alerts.forEach(function (alertSpec) {
                buildModel.alerts[alertSpec.name] = alertSpec;
            });
        }
        if (options.database.ruleSets) {
            options.database.ruleSets.forEach(function (ruleSetSpec) {
                buildModel.ruleSets.push(ruleSetSpec);
            });
        }
        return buildModel;
    }
};
//# sourceMappingURL=buildPlugin.js.map