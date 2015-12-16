/**
 * 
 * @author Алексей
 * {global P}
 */
function ConverterUI() {
    var self = this
            , form = P.loadForm(this.constructor.name);

    self.show = function () {
        form.show();
    };
    var FileChooser = Java.type('javax.swing.JFileChooser'),
        Files = Java.type('java.nio.file.Files'),
        Paths = Java.type('java.nio.file.Paths'),
        CopyOption = Java.type('java.nio.file.StandardCopyOption'),
        File = Java.type('java.io.File'),
        FIS = Java.type('java.io.FileInputStream'),
        FileWriter = Java.type('java.io.FileWriter'),
        BufferedWriter = Java.type('java.io.BufferedWriter'),
        SCN = Java.type('java.util.Scanner');
    
    var
        selectedDir = '',
        modules = {},
        errors = [];

    var Rmod = /entity Name="+(\w+)+"/g;
    var RLayout = /name="+(\w+)+"/g;
    var Rquotes = /"+(\w+)+"/g;

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
        modules = {};
        readFolder(selectedDir);
        log('Чтение файлов завершено. Обработка...');
        log('-------------------------------------');
        for (var j in modules)
            if (modules[j].JSFile)
                processJS(modules[j].JSFile, j);
        log('-------------------------------------');
        log('Обработка файлов завершена. Обнаруженные ошибки: ');
        errors.forEach(log);
    }; 
    function log(aLogMessage) {
        form.taLog.text += aLogMessage + '\n';
        P.Logger.severe(aLogMessage);
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
            switch (fData.extension) {
                case 'js':
                    preProcessJS(file, fData.moduleName);
                    break;
                case 'model':
                    processModel(file, fData.moduleName);
                    break;
                case 'layout':
                    processLayout(file, fData.moduleName);
                    break;
                case 'js_':
                    break;
                default:
                    var f = new File(file);
                    if (!f.isDirectory())
                        log('Неизвестное расширение файла: ' + file);
                    else
                        if (form.cbSubfolders.selected)
                            readFolder(file);
            }
        }
    }
    function checkModule(aModuleName) {
        if (!modules[aModuleName]) {
            modules[aModuleName] = {};
            modules[aModuleName].Objects = [];
            log('Обнаружен новый модуль: ' + aModuleName);
        }
    }
    function processModel(aFile, aModuleName) {
        checkModule(aModuleName);
        log('Получение объектов модели для модуля "' + aModuleName + '"');
        modules[aModuleName].Objects.push('model');
        modules[aModuleName].hasModel = true;
        modules[aModuleName].modelObjects = [];
        readFile(aFile, function(string) {
            try {
                var obj = string.match(Rmod)[0].match(Rquotes)[0].slice(1, -1);
                if (obj)
                    modules[aModuleName].modelObjects.push(obj);
                log(obj);
            } catch (e) {};
        });
    }
    function processLayout(aFile, aModuleName) {
        checkModule(aModuleName);
        log('Получение объектов формы для модуля "' + aModuleName + '"');
        modules[aModuleName].Objects.push('form');
        modules[aModuleName].formObjects = [];
        readFile(aFile, function(string) {
            try {
                var obj = string.match(RLayout)[0].match(Rquotes)[0].slice(1, -1);
                if (obj)
                    modules[aModuleName].formObjects.push(obj);
                log(obj);
            } catch (e) {}
        });
    }
    function preProcessJS(aFile, aModuleName) {
        checkModule(aModuleName);
        log('Модуль "' + aModuleName + '", путь к файлу JS: ' + aFile);
        try {
            Files.copy(Paths.get(aFile), Paths.get(aFile + '_'));
        } catch(e) {}
        modules[aModuleName].JSFile = aFile;
    }
    function readFile(aFile, processor) {
        var fis = new FIS(aFile);
        var scanner = new SCN(fis, "UTF-8");
        var string;
        
        while (scanner.hasNext()) {
            string = scanner.nextLine();
            processor(string);
        }
        scanner.close();
    }
    function processJS(aFile, aModuleName) {
        log('---\nОбработка модуля "' + aModuleName + '", файл ' + aFile);
        if (modules[aModuleName].formObjects)
            log('Объекты формы: ' + modules[aModuleName].formObjects.join(', '));
        if (modules[aModuleName].modelObjects)
            log('Объекты модели: ' + modules[aModuleName].modelObjects.join(', '));
        log('Объекты общие: ' + modules[aModuleName].Objects.join(', '));
        var file = new File(aFile);
        var fw = new FileWriter(file.getAbsoluteFile());
        var bw = new BufferedWriter(fw);
        
        readFile(aFile+'_', function(string) {
            bw.write(processJSString(string, aModuleName));
        });
        
        bw.close();
    };
    function processJSString(string, moduleName) {
        var RGenFirst = /\/\/GEN-FIRST:event_+(\w+)/g;
        var RgenLast = /\/\/GEN-LAST:event_+(\w*)/g;
        var RModel = /model = this.model/g;
        var RForm  = /form = this/g;
        
        string = string.replace(RForm, 'form = P.loadForm(this.constructor.name' + (modules[moduleName].hasModel ? ', model' : '') + ')');
        string = string.replace(RModel, 'P.loadModel(this.constructor.name)');
        
        var st = string.match(RGenFirst);
        var sb = string;
        if (st) {
            st = st[0].slice(17);
            string = checkArray(modules[moduleName].formObjects, st, '   form.', moduleName);
            string = checkArray(modules[moduleName].modelObjects, st, '   model.', moduleName);
            string = checkArray(modules[moduleName].Objects, st, '   ', moduleName);
            if (sb == string) {
                var er = 'Строка не изменена! Модуль: "' + moduleName  + '", Строка ' + st;
                errors.push(er);
                log(er);
            }
        }
        
        var st = string.match(RgenLast);
        if (st) {
            string = string.slice(0, -st[0].length);
        }
        return string + '\n';
    }
    function checkArray(anArray, st, prefix, moduleName) {
        var res = st;
        anArray.forEach(function(obj) {
               if (st.match('_' + obj)) {
                   st = st.slice(obj.length + 1);
                   var rule = checkRules(st, obj);
                   if (rule) {
                       res = prefix + obj + '.' + rule + ' = function(evt) {//p3p5';
                   } else {
                       var er = '"' + moduleName  + '", '+ obj + ' ?-> ' + st;
                       errors.push(er);
                       log(er);
                   }
               }
            });
                
            return res;
    }
    function checkRules(anActionName, anObjectName) {
        var rules = {
            ActionPerformed:    'onActionPerformed',
            MouseClicked:       'onMouseClicked',
            OnRequeried:        'onRequeried'
        };
        
        var res = rules[anActionName];
        
        if (!res && anObjectName == 'form') {
            res = 'on' + anActionName;
        }
        
        return res;
    }
}
    