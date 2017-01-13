/**
 *
 * @author Алексей
 * {global P}
 */
function SQLRoles() {
    var self = this
            , model = P.loadModel(this.constructor.name)
            , form = P.loadForm(this.constructor.name);

    self.show = function () {
        form.show();
    };
    var FileChooser = Java.type('javax.swing.JFileChooser'),
        Files = Java.type('java.nio.file.Files'),
        Paths = Java.type('java.nio.file.Paths'),
        File = Java.type('java.io.File'),
        FIS = Java.type('java.io.FileInputStream'),
        SCN = Java.type('java.util.Scanner');

    var
        selectedDir = '',
        queries = {},
        errors = [];

    var Rmod = /tableName="+(\w+)+"/g;
    var Rquotes = /"+(\w+)+"/g;
    var Rroles = /[\s\S]*rolesAllowed\S*\s*/g;


    form.btnChooseFolder.onActionPerformed = function (event) {
        var chooser = new FileChooser();
        chooser.setFileSelectionMode(FileChooser.DIRECTORIES_ONLY);
        var result = chooser.showOpenDialog(null);
        if (result == FileChooser.APPROVE_OPTION) {
            selectedDir = chooser.getSelectedFile();
            form.teFolder.text = selectedDir;
        };
    };
    form.btnStart.onActionPerformed = function (event) {
        queries = {};
        errors = [];
        readFolder(selectedDir);
        log('Чтение файлов завершено.');
        var roles = {}
        
        errors.forEach(log);
    };

    function log(aLogMessage) {
        form.taLog.text += aLogMessage + '\n';
//        P.Logger.severe(aLogMessage);
    }
    function parseFilename(aFileName) {
        var a = aFileName.split(".");
        if( a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
            var ext = "";
        }
        ext = a.pop();
        return {extension: ext, moduleName: a.join('.')};
    }
    function readFolder(aFolder) {
        var files = new File(aFolder).list();
        log('Чтение папки: ' + aFolder + ', Всего файлов в папке: ' + files.length);
        for (var j in files) {
            var file = files[j];
            var fData = parseFilename(file);
            file = aFolder + "\\" + file;
            if (fData.moduleName) {
                switch (fData.extension) {
//                    case 'model':
//                        processModel(file, fData.moduleName);
//                        break;
                    case 'sql':
                        processSQL(file, fData.moduleName);
                        break;
                    default:
                        var f = new File(file);
                        if (f.isDirectory() && form.cbSubfolders.selected)
                                readFolder(file);
                }
            } else {
                var f = new File(file);
                if (f.isDirectory() && form.cbSubfolders.selected)
                    readFolder(file);
            }
        }
    }
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
//        var fName = parseFilename(aFile);
        log('Получение таблиц из модели для запроса "' + queryName + '"');
        readFile(aFile, function(string) {
            try {
                var obj = string.match(Rmod)[0].match(Rquotes)[0].slice(1, -1);
                if (obj)
                    queries[queryName].tables.push(obj);
//                log(obj);
            } catch (e) {};
        });
        log('Обнаружено таблиц: ' + queries[queryName].tables.length);
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
    
    function readFile(aFile, processor) {
        var fis = new FIS(aFile);
        var scanner = new SCN(fis, "UTF-8");
        var string, iter = 0;

        while (scanner.hasNext() && iter < 15) {
            iter++;
            string = scanner.nextLine();
            processor(string, !scanner.hasNext());
        }
        scanner.close();
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
}
