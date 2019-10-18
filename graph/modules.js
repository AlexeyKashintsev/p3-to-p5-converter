const fs = require('fs');


function ModuleProcessor() {
	function Module(aModuleName, aFileType, aFile) {
		this.type;
		this.files = {};
		this.check = function(aModuleName, aFileType, aFile) {
			this.files[aFileType] = aFile;
			if (aFileType == 'js') {
				this.type = 'module';
				this.files.js = aFile;
				console.log('Found module: ' + aModuleName);
			}
			if (aFileType == 'sql') {
				this.type = 'query';
				this.files.sql = aFile;
				console.log('Found query: ' + aModuleName);
			}
			if (aFileType == 'model') {
				this.files.model = aFile;
				console.log('Found model file: ' + aModuleName);
			}
		};

		this.check(aModuleName, aFileType, aFile)
	}
	this.modules = {};
	this.process = function(aFilePath, fileName) {
		var raw = fileName.split('.');
		var fileType = raw[raw.length-1];
		var moduleName = fileName.slice(0, fileName.length - raw[raw.length-1].length - 1);
		if (!this.modules[moduleName])
			this.modules[moduleName] = new Module(moduleName, fileType, aFilePath);
		else
			this.modules[moduleName].check(moduleName, fileType, aFilePath);
	}

}

export {ModuleProcessor};