/**
 * 
 * @author Алексей
 */
define('SQLFilesAnalyser', ['orm', 'logger'], function (Orm, Logger, ModuleName) {
    function module_constructor(reader) {
        var self = this, model = Orm.loadModel(ModuleName);

        var Rmod = /tableName="+(\w+)+"/g;
        var Rquotes = /"+(\w+)+"/g;
        var Rroles = /[\s\S]*rolesAllowed\S*\s*/g;

        var queries = {}, errors = [];

        self.processFile = function (file, fData) {
            switch (fData.extension) {
                case 'sql':
                    processSQL(file, fData.moduleName);
                    break;
            }
        };
        function checkModule(aModuleName) {
            if (!queries[aModuleName]) {
                queries[aModuleName] = {};
                queries[aModuleName].tables = [];
                queries[aModuleName].roles = [];
//            log('Обнаружен новый модуль: ' + aModuleName);
            }
        }
        function processModel(aFile, queryName) {
            checkModule(queryName);
            reader.log('Получение таблиц из модели для запроса "' + queryName + '"');
            reader.readFile(aFile, function (string) {
                try {
                    var obj = string.match(Rmod)[0].match(Rquotes)[0].slice(1, -1);
                    if (obj)
                        queries[queryName].tables.push(obj);
                } catch (e) {
                }
            });
            reader.log('Обнаружено таблиц: ' + queries[queryName].tables.length);
        }
        function processSQL(aFile, aModuleName) {
            checkModule(aModuleName);
            var filename = aFile.match(/[\\][^\\]+?$/g)[0].match(/[^\\]+/g)[0];
            var path = aFile.slice(0, aFile.length - filename.length);

            processModel(path + aModuleName + '.model', aModuleName);
//        log('Получение ролей для запроса "' + aModuleName + '"');

//        readFile(aFile, function(string) {
//           processString(string, aModuleName);
//        });
        }
        function processString(string, moduleName) {
            var matchString = string.match(Rroles);
            if (matchString) {
                var ar = string.slice(matchString[0].length, string.length);
                ar = ar.split(/[,\s]+/g);
                ar.forEach(function(role) {
                    queries[moduleName].roles.push(role);
                });
            }
            var nameString = string.match(/[\s\S]*@name\S*\s*/g);
            if (nameString) {
                var modName = string.slice(nameString[0].length, string.length);
                checkModule(modName);
                queries[modName] = queries[moduleName];
            }

        }

        self.onStart = function () {
            queries = {};
            errors = [];
        };

        self.onEnd = function () {
            
        };

        self.execute = function () {
            
        };
    }
    return module_constructor;
});
