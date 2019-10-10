/**
 * 
 * @author Алексей
 */
define('RoleGrahpBuilder', ['orm', 'logger'], function (Orm, Logger, ModuleName) {
    function module_constructor(reader) {
        var self = this, model = Orm.loadModel(ModuleName);

        var moduleEntities = /entity Name="+(\w+)+"/g;
        var Rroles = /[\s\S]*rolesAllowed\S*\s*/g;

        var entities = {}, errors = [];

        self.processFile = function (file, fData) {
            switch (fData.extension) {
                case 'js':
                    processJS(file, fData.moduleName);
                    break;
                case 'model':
                    processModel(file, fData.moduleName);
                    break;
                case 'sql':
                    processSQL(file, fData.moduleName);
                    break;
            }
        };
        function checkModule(aModuleName) {
            if (!entities[aModuleName]) {
                entities[aModuleName] = {};
                entities[aModuleName].subentities = [];
                entities[aModuleName].roles = [];
                entities[aModuleName].type = null;
                reader.log('Обнаружен новый модуль: ' + aModuleName);
            }
        }
        function processModel(aFile, aModuleName) {
            checkModule(aModuleName);
            var subsDetected = false, tablesDetected = false;
            reader.log('Получение объектов модели для модуля "' + aModuleName + '"');
            reader.readFile(aFile, function (string) {
                
                var obj = null;
                try {
                    obj = string.match(moduleEntities)[0].match(Rquotes)[0].slice(1, -1);
                } catch (e) {}
                if (obj) {
                    entities[aModuleName].subentities.push(obj);
                    subsDetected = true;
                }
                
                obj = null;
                try {
                    obj = string.match(queryTables)[0].match(Rquotes)[0].slice(1, -1);
                } catch (e) {}
                if (obj) {
                    if (!entities[aModuleName].tables)
                        entities[aModuleName].tables = [];
                    entities[aModuleName].tables.push(obj);
                    tablesDetected = true;
                }

                if (subsDetected)
                    reader.log('Обнаружено сущностей: ' + entities[aModuleName].subentities.length);
                if (tablesDetected)
                    reader.log('Обнаружено таблиц: ' + entities[aModuleName].tables.length);
            });
        }
        
        function processJS(aFile, aModuleName) {
            checkModule(aModuleName);
            reader.log('---\nОбработка модуля "' + aModuleName + '", файл ' + aFile);
            entities[aModuleName].type = 'JS';

            reader.readFile(aFile, function (string) {
                processString(string, aModuleName);
            });
        }
        function processString(string, moduleName) {
            var matchString = string.match(Rroles);
            if (matchString) {
                var ar = string.slice(matchString[0].length, string.length);
                ar = ar.split(/[,\s]+/g);
                ar.forEach(function (role) {
                    entities[moduleName].roles.push(role);
                });
            }
            var nameString = string.match(/[\s\S]*@name\S*\s*/g);
            if (nameString) {
                var modName = string.slice(nameString[0].length, string.length);
                checkModule(modName);
                entities[modName] = entities[moduleName];
            }
        }

        self.onStart = function () {
            entities = {};
            errors = [];
        };

        self.onEnd = function () {
            var roles = {};
            reader.log('Модули JS без ролей: ');
            for (var j in entities) {
                var entity = entities[j];
                switch (entity.type) {
                    case 'JS': {
                            entity.subentities.forEach(function(sub) {
                                if (entities[sub]) {
                                    entities[sub].usedIn.push(entity);
                                }
                            });
                            if (!entity.roles.length)
                                reader.log(j + ' Нет роли!!!!!!!!');
                            if (entity.roles.length > 1)
                                reader.log(j + ' Задано более одной роли!!!!!!!!');
                            break
                    }
                    case 'QUERY': {
                            if (!entity.tables) {
                                reader.log(j + ' Ошибка парсинга запроса!!!!!!!!');
                                break;    
                            }
                            if (!entity.roles.length) {
                                reader.log(j + ' Нет роли!!!!!!!!');
                                break;
                            }
                            if (entity.tables.length > 1 && (!entity.readOnly || !entity.writable)) {
                                reader.log(j + ' Больше одной таблицы без аннотаций на чтение!!!!!!!!');
                                break;
                            }
                            
                            break
                    }
                }
//                if (entity.type === 'JS' && !entity.roles.length)
//                reader.log('Сущность: ' + j + ', Тип: ' +  entity.type + 
//                        (entity.roles ? '\nРоли: ' + entity.roles.join() : '') + 
//                        (entity.subroles ? '\nПодсущности: ' + entity.subroles.join() : '') +
//                        (entity.tables ? '\nТаблицы в запросе: ' + entity.tables.join() : '') +
//                        (entity.readOnly ? '\Только для чтения': '') +
//                        (entity.writable ? '\Таблицы для записи: ' + entity.writable.join() : '')
//                    );
            }
        };

        self.createGraph = function () {
            var roles = {};
            for (var j in entities) {
                entities[j].roles.forEach(function (roleName) {
                    if (roleName) {
                        roles[roleName] = {subroles: []};
                        reader.log(roleName);
                        entities[j].subentities.forEach(function (subEnt) {
                            try {
                                entities[subEnt].roles.forEach(function (aRoleName) {
                                    if (roleName != aRoleName && aRoleName)
                                        roles[roleName].subroles.push(aRoleName);
                                });
                            } catch (e) {
                                Logger.warning(e + ' entityName: ' + j + ' RoleName: ' + roleName + ' subEnt: ' + subEnt);
                            }
                        });
                    }
                });
            }
            reader.log('finish!' + roles);
            model.qRolesDependencies.requery(function () {
                model.qRolesDependencies.splice(0, model.qRolesDependencies.length);
                model.qRoles.requery(function () {
                    for (var j in roles) {
                        if (model.qRoles.find({rule_name: j}).length) {
                            roles[j].subroles.forEach(function (subr) {
                                if (model.qRoles.find({rule_name: subr}).length) {
                                    if (!model.qRolesDependencies.find({parent_rule: j,
                                        child_rule: subr}).length)
                                        model.qRolesDependencies.push({
                                            parent_rule: j,
                                            child_rule: subr
                                        });
                                } else
                                    reader.log('Error, role not found: ' + subr);
                            });
                        } else {
                            reader.log('Error, role not found: ' + j);
                        }
                    }
                    model.save();
                });
            });
        };
    }
    return module_constructor;
});
