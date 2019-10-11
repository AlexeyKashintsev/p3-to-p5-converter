/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define('FileUtils', [], function (ModuleName) {
    var FileChooser = Java.type('javax.swing.JFileChooser'),
        Files = Java.type('java.nio.file.Files'),
        Paths = Java.type('java.nio.file.Paths'),
        File = Java.type('java.io.File'),
        FIS = Java.type('java.io.FileInputStream'),
        SCN = Java.type('java.util.Scanner'),
        FileWriter = Java.type('java.io.FileWriter'),
        BufferedWriter = Java.type('java.io.BufferedWriter');
        
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
});