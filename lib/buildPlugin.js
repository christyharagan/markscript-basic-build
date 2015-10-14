var mg = require('./modelGenerator');
var glob = require('glob');
exports.BasicBuildPlugin = {
    generate: function (buildModel, options, pkgDir, typeModel) {
        var model = mg.generateModel(typeModel, options.database.modelObject, options.database.host);
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
        mg.generateAssetModel(typeModel, options.database.modelObject, buildModel, options.database.defaultTaskUser || options.database.user);
        if (options.database.modules) {
            if (Array.isArray(options.database.modules)) {
                mg.addModules(buildModel, pkgDir, options.database.modules);
            }
            else if (typeof options.database.modules === 'string') {
                mg.addModules(buildModel, pkgDir, glob.sync(options.database.modules, { cwd: pkgDir }));
            }
        }
        if (options.database.extensions) {
            mg.addExtensions(buildModel, pkgDir, options.database.extensions);
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