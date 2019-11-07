/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define('ModuleProcessor', [], function (ModuleName) {
    Object.assign = function (target, source) {
        for (var key in source) {
            target[key] = source[key];
        }
    };
    function ModuleProcessor(reader) {
        function Module(aModuleName, aFileType, aFile) {
            /*Module structure:
             {
             type: string('module', 'query');
             files: {js, sql, model},
             scanned: boolean,
             moduleName: 'string',
             
             roles: [string],
             saveable: boolean,
             dependencies: [string],
             dependsOn: []
             
             rolesAllowedToRead: [string]
             rolesAllowedToWrite: [string]
             writable: [string] tables
             readOnly: boolean
             */
            this.type;
            this.files = {};
            this.check = function (aModuleName, aFileType, aFile) {
                this.files[aFileType] = aFile;
                if (aFileType === 'js') {
                    this.type = 'module';
                    this.files.js = aFile;
//                    reader.log('Found module: ' + aModuleName);
                }
                if (aFileType === 'sql') {
                    this.type = 'query';
                    this.files.sql = aFile;
//                    reader.log('Found query: ' + aModuleName);
                }
                if (aFileType === 'model') {
                    this.files.model = aFile;
//                    reader.log('Found model file: ' + aModuleName);
                }
                if (aFileType === 'layout') {
                    this.files.layout = aFile;
                }
            };

            this.check(aModuleName, aFileType, aFile)
        }
        var modules = {};
//        this.modules = {};
        this.addFile = function (aFilePath, fileData) {
            var moduleName = fileData.moduleName;
            if (!modules[moduleName])
                modules[moduleName] = new Module(moduleName, fileData.extension, aFilePath);
            else
                modules[moduleName].check(moduleName, fileData.extension, aFilePath);
        };

        this.scanFiles = function () {
            for (var modName in modules) {
                if (modName == 'qCardsPagination') {
                    reader.log('bingo!');
                }
                if (!modules[modName].scanned) {
                    switch (modules[modName].type) {
                        case 'module':
                            Object.assign(modules[modName], scanJS(modules[modName].files.js));
                            if (modules[modName].files.model)
                                Object.assign(modules[modName], scanModel(modules[modName].files.model));
                            else
                                reader.log('!Warning! Для модуля нет модели данных. Имя модуля: ' + modName);
                            modules[modName].hasVisual = !!modules[modName].files.layout;
                            break;
                        case 'query':
                            Object.assign(modules[modName], scanSQL(modules[modName].files.sql));
                            Object.assign(modules[modName], scanModel(modules[modName].files.model));
                            break;
                        default:
                            reader.log('!Error! Тип модуля не определен. Имя модуля: ' + modName);
                    }
                    modules[modName].scanned = true;

                    if (modules[modName].moduleName && modules[modName].moduleName != modName) {
                        var mn = modules[modName].moduleName;
                        modules[mn] = {};
                        Object.keys(modules[modName]).map(function (key) {
                            modules[mn][key] = modules[modName][key];
                        });
                        reader.log('Renaming module from ' + modName + ', to ' + mn);
                        delete modules[modName];
                    }
                }
            }

            return modules;
        };


        function scanJS(aFileName) {
            var pos = 'start';
            var obj = {};
//            obj.calledFrom = [];
            reader.readFile(aFileName, processor);
            return obj;

            function processor(string) {
                switch (pos) {
                    case 'start':
                        if (string.match(/\/\*/))
                            pos = 'header';
                        if (string.match(/define\(/) || string.match(/require\(/)) {
                            pos = 'body';
                            obj.headless = true;
                        }
                    case 'header':
                        processHeaderString(string);
                        if (string.match(/\*\//))
                            pos = 'body';
                    case 'body':
                        processBodyString(string);
                }
            }

            function processHeaderString(string) {
                var Rroles = /[\s\S]*rolesAllowed\S*\s*/g;
                var nameString = string.match(/[\s\S]*@name\S*\s*/g);
                var matchString = string.match(Rroles);
                if (matchString) {
                    var ar = string.slice(matchString[0].length);
                    ar = ar.split(/[,\s]+/g);
                    if (!obj.roles)
                        obj.roles = []
                    ar.forEach(function (role) {
                        obj.roles.push(role);
                    });
                }
            }

            function processBodyString(string) {
                if (!obj.dependencies)
                    obj.dependencies = [];
                if (string.match(/define\(/) || string.match(/require\(/)) {
                    var e = string.match(/define\([^,\d\[]*/);
                    if (!!e && e.length)
                        obj.moduleName = e[0].slice(8, e[0].length - 1);

                    obj.dependencies =
                            obj.dependencies.concat((function () {
                                var r = string.match(/\[.*\]/g);
                                if (r)
                                    return r[0].match(/[^'"][^\W][^'"]*/g);
                                else
                                    return string.match(/\(['"]\w*['"]/)[0].match(/[^'"][^\W][^'"]*/g);
                            })());
                }
                if (string.match(/model\.p?save/)) {
                    obj.saveable = true;
                }
            }
        }

        function scanSQL(aFileName) {
            var pos = 'start';
            var obj = {};
            obj.rolesAllowedToRead = [],
                    obj.rolesAllowedToWrite = [],
                    obj.writable = [],
                    obj.readOnly = false,
                    obj.moduleName;
            reader.readFile(aFileName, processor);
            return obj;

            function processor(string) {
                switch (pos) {
                    case 'start':
                        if (string.match(/\/\*/))
                            pos = 'header';
                        break
                    case 'header':
                        processHeaderString(string);
                        if (string.match(/\*\//))
                            pos = 'body';
                        break
//                    case 'body':
//                        processBodyString(string);
                }
            }

            function processHeaderString(string) {
                var RrolesR = /[\s\S]*rolesAllowedRead\S*\s*/g;
                var RrolesW = /[\s\S]*rolesAllowedWrite\S*\s*/g;
                var RonlFlag = /@readonly/g;
                var WritableFlag = /@writable/g;
                var Rname = /[\s\S]*@name\S*\s*/g;

                var matchString = string.match(Rname);
                if (matchString)
                    obj.moduleName = string.slice(matchString[0].length)

                var matchString = string.match(RrolesR);
                if (matchString) {
                    var ar = string.slice(matchString[0].length);
                    ar = ar.split(/[,\s]+/g);
                    if (!obj.rolesAllowedToRead)
                        obj.rolesAllowedToRead = [];
                    ar.forEach(function (role) {
                        obj.rolesAllowedToRead.push(role);
                    });
                }

                var matchString = string.match(RrolesW);
                if (matchString) {
                    var ar = string.slice(matchString[0].length);
                    ar = ar.split(/[,\s]+/g);
                    ar.forEach(function (role) {
                        obj.rolesAllowedToWrite.push(role);
                    });
                }

                var matchString = string.match(WritableFlag);
                if (matchString) {
                    var ar = string.slice(matchString[0].length);
                    ar = ar.split(/[,\s]+/g);
                    ar.forEach(function (tables) {
                        obj.writable.push(tables);
                    });
                }

                var matchString = string.match(RonlFlag);
                if (matchString) {
                    obj.readOnly = true;
                }
            }
        }

        function scanModel(aFileName) {
            var queryJSEntity = /entity Name="+(\w+)+"/g,
                queryEntity = /queryId="+(\w+)+"/g,
                tableEntity = /tableName="+(\w+)+"/g;
            var obj = {};
//            .match(/queryId="(\w*)"/g)[0].split('"')[1]
            reader.readFile(aFileName, function (string) {
                if (string.match("queryId")) {
                    if (!obj.queries)
                        obj.queries = [];
                    obj.queries.push(string.match(queryEntity)[0].split('"')[1])
                } else
                if (string.match("tableName")) {
                    if (!obj.tables)
                        obj.tables = [];
                    obj.tables.push(string.match(tableEntity)[0].split('"')[1])
                }
                if (string.match("entity Name")) {
                    if (!obj.modelQueries)
                        obj.modelQueries = [];
                    obj.modelQueries.push(string.match(queryJSEntity)[0].split('"')[1])
                }
            });
            return obj;
        }
    }

    return ModuleProcessor;
});