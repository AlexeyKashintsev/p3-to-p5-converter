/**
 *
 * @author Алексей
 * {global P}
 */
function FilesReader() {
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
        SCN = Java.type('java.util.Scanner'),
        FileWriter = Java.type('java.io.FileWriter'),
        BufferedWriter = Java.type('java.io.BufferedWriter');

    var
        selectedDir = '',
        errors = [],
        processor;


    P.require(['RoleGrahpBuilder', 'SQLFilesAnalyser'], function(RoleGrahpBuilder, SQLFilesAnalyser) {
        processor = new RoleGrahpBuilder(self);
    });

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
        processor.onStart();
        P.invokeLater(function() {
            self.readFolder(selectedDir);
            log('Чтение файлов завершено.');
            processor.onEnd();

            errors.forEach(log);            
        })
    };
    form.button.onActionPerformed = function(evt) {
        
    };
    function log(aLogMessage) {
        P.invokeLater(function() {
            form.taLog.text += aLogMessage + '\n';
        });
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
    var foldersToSkip = ['Server', 'Сервер', 'modules', 'widgets', 'icons', 'Модели',];
    function readFolder(aFolder) {
        var skip = false;
        foldersToSkip.forEach(function(fts) {
            if (!!aFolder.path&&aFolder.path.match(fts) || aFolder.match && aFolder.match(fts)) {
                skip = true;
                log('Папка ' + fts + ' - пропуск');
            }
        });
        
        if (!skip) {
            var files = new File(aFolder).list();
            log('Чтение папки: ' + aFolder + ', Всего файлов в папке: ' + files.length);
            for (var j in files) {
                var file = files[j];
                var fData = parseFilename(file);
                file = aFolder + "\\" + file;
                var f = new File(file);
                if (f.isDirectory()) {
                    if (form.cbSubfolders.selected)
                        readFolder(file);
                } else 
                    processor.processFile(file, fData);
                        
            }
        }
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
    function copyFile(anOldFile, aNewFile) {
        try {
            Files.copy(Paths.get(anOldFile), Paths.get(aNewFile));
        } catch(e) {}
    }
    
    function getWritable(aFileName) {
        var file = new File(aFileName);
        var fw = new FileWriter(file.getAbsoluteFile());
        var bw = new BufferedWriter(fw);
        
        this.write = function(string2write) {
            bw.write(string2write);
        };
        
        this.close = function() {
            bw.close();
        };
    }
    
    self.log = log;
    self.readFolder = readFolder;
    self.readFile = readFile;
    self.copyFile = copyFile;
    self.getWritable = getWritable;
}
