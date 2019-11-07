/**
 * 
 * @author Алексей
 */
define('FilesAnalyser', ['ModuleProcessor', 'logger'], function (ModuleProcessor, Logger, ModuleName) {
    function module_constructor(reader) {
        var self = this;
        var mp;

        self.onStart = function () {
            mp = new ModuleProcessor(reader);
        };

        self.onEnd = function () {
            var modules = mp.scanFiles();
            var modInDep = {};
            var skipModules = [];
            var skipModulesNL = []; //NO Layout
            var moreThanOne = [];
            reader.log('===============================================\n===============================================\n===============================================')
            for (var moduleName in modules) {
                var module = modules[moduleName];
                if (!module.moduleName)
                    module.moduleName = moduleName;
                if (module.type == 'module') {
                    if (!module.roles) {
                        if (module.hasVisual) {
                            skipModules.push(moduleName)
                        } else {
                            skipModulesNL.push(moduleName)
//                            delete modules[moduleName];
                        }
                    } else {
                        module.hasRoles = true;
                        module.roleR = module.roles;
                        module.roleW = module.roles.map(function(r) {return r + '_e'});
                        if (module.roles.length > 1) {
                            moreThanOne.push(moduleName);
                        }
                    }
                    var depend = [];
                    module.dependencies.forEach(function(dep) {
                        if (modules[dep]) {
                            depend.push(modules[dep]);
                            !modules[dep].calledFrom ? 
                                modules[dep].calledFrom = [moduleName] :
                                modules[dep].calledFrom.push(moduleName);
                        } else {
//                            reader.log('SKIPPING dependency: ' + dep);
                        }
                    });
                    module.dependencies = depend;
                }
                if (moduleName == 'qReportCurrentTripsOnCardsCount')
                    reader.log('!');
                if (module.queries)
                    module.queries.forEach(function(query) {
                        if (modules[query]) {
                            !modules[query].usedIn ? 
                                modules[query].usedIn = [moduleName] : 
                                modules[query].usedIn.push(moduleName);
                            if (module.saveable)
                                modules[query].saveable = true;
                        } else
                            reader.log('!!!Query not found: ' + query + ', Module: ' + moduleName);
                    });
            };
            var unusedQueries = [];
            var checkForUsage = [];
            for (var moduleName in modules) {
                var query = modules[moduleName];
                if (moduleName == 'qCardsPagination') {
                    reader.log(query.tables);
                }
                if (query.type == 'query') {
                    if (!query.usedIn)
                        unusedQueries.push(moduleName);
                    if (!query.tables)
                        checkForUsage.push(moduleName);
                    else
                        if (query.tables.length > 1 && !query.readOnly && query.saveable && !module.writable)
                            checkForUsage.push(moduleName);
                }
            }
//            reader.log(JSON.stringify(modInDep));
            reader.log('Модули роли не указаны, нет формы: '+ JSON.stringify(skipModulesNL));
            reader.log('==================================');
            reader.log('Модули роли не указан: '+ JSON.stringify(skipModules));
            reader.log('==================================');
            reader.log('Модули с более чем одной ролью: '+ JSON.stringify(moreThanOne));
            reader.log('==================================');
            reader.log('Неиспользуемые запросы: '+ JSON.stringify(unusedQueries));
            reader.log('==================================');
            reader.log('Проверить запросы: '+ JSON.stringify(checkForUsage));
            
            reader.log('STAGE 2 === GENERATING ANNOTATIONS');
            var roleR = {};
            var roleW = {};
            var noRoles = [1];
            var iter = 0;
            while (!noRoles.empty && iter < 10) {
                noRoles = [];
                iter ++;
                for (var moduleName in modules) {
                    var module = modules[moduleName];
                    if (!modules[moduleName].hasRoles && module.type == 'query' && module.usedIn) {
                        noRoles.push(moduleName);
                        
                        module.roleR = [];
                        module.roleW = [];
                        module.usedIn.forEach(function(usage){
                            if (modules[usage].hasRoles) {
                                module.hasRoles = true;
                                module.roleR.concat(modules[usage].roleR);
                                modules[usage].roleR.forEach(function(role) {
                                    roleR[role] = module.tables;
                                });
                                if (module.saveable && modules[usage].saveable && !module.readonly) {
                                    module.roleW.concat(modules[usage].roleW);
                                    modules[usage].roleW.forEach(function(role) {
                                        roleW[role] = module.tables;
                                    });
                                }
                            }
                        });
                    }
                }
            }
            reader.log('Роли на чтение: '+ JSON.stringify(roleR));
            reader.log('==================================');
            reader.log('Роли на запись: '+ JSON.stringify(roleW));
            reader.log('==================================');
            reader.log('Нет ролей: '+ JSON.stringify(noRoles));
        };

        self.processFile = function (aFilePath, fData) {
            if ((["js", "sql", "model", "layout"]).indexOf( fData.extension ) >= 0) {
                mp.addFile(aFilePath, fData);
            }
        };
    }
    return module_constructor;
});
