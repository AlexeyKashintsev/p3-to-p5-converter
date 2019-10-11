/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


define('SQLFileProcessor', [], function (ModuleName) {
    var RrolesR = /[\s\S]*rolesAllowedRead\S*\s*/g;
    var RrolesW = /[\s\S]*rolesAllowedWrite\S*\s*/g;
    var RonlFlag = /@readonly/g;
    var WritableFlag = /@writable/g;

    return function (reader, aFileName, aModuleName, model) {
        checkModule(aModuleName);
        model[aModuleName].type = 'QUERY';
        reader.log('Получение ролей для запроса "' + aModuleName + '"');

        reader.readFile(aFileName, function (string) {
            var matchString = string.match(RrolesR);

            if (matchString) {
                var ar = string.slice(matchString[0].length, string.length);
                ar = ar.split(/[,\s]+/g);
                if (!model[aModuleName].rolesAllowedToRead)
                    model[aModuleName].rolesAllowedToRead = [];
                ar.forEach(function (role) {
                    model[aModuleName].rolesAllowedToRead.push(role);
                });
            }

            var matchString = string.match(RrolesW);
            if (matchString) {
                var ar = string.slice(matchString[0].length, string.length);
                ar = ar.split(/[,\s]+/g);
                if (!model[aModuleName].rolesAllowedToWrite)
                    model[aModuleName].rolesAllowedToWrite = [];
                ar.forEach(function (role) {
                    model[aModuleName].rolesAllowedToWrite.push(role);
                });
            }

            var matchString = string.match(WritableFlag);
            if (matchString) {
                var ar = string.slice(matchString[0].length, string.length);
                ar = ar.split(/[,\s]+/g);
                if (!model[aModuleName].writable)
                    model[aModuleName].writable = [];
                ar.forEach(function (tables) {
                    model[aModuleName].writable.push(tables);
                });
            }
            

            var matchString = string.match(RonlFlag);
            if (matchString) {
                model[aModuleName].readOnly = true;
            }
            
            processString(string, aModuleName);
        });
    }
});