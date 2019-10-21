function ModuleProcessor() {
	function Module(aModuleName, aFileType, aFile, modName) {
		this.type;
		this.files = {};
		this.modName;
		this.check = function(aModuleName, aFileType, aFile) {
			this.files[aFileType] = aFile;
			if (aFileType === 'js') {
				this.type = 'module';
				this.files.js = aFile;
				this.modName = modName;
				console.log('Found module: ' + aModuleName);
				// console.log(this.files);
			}
			if (aFileType === 'sql') {
				this.type = 'query';
				this.files.sql = aFile;
				this.modName = modName;
				console.log('Found query: ' + aModuleName);
			}
			if (aFileType === 'model') {
				this.type = 'model';
				this.files.model = aFile;
				this.modName = modName;
				console.log('Found model file: ' + aModuleName);
			}
		};

		this.check(aModuleName, aFileType, aFile)
	}
	this.modules = {};
	this.process = function(aFilePath, fileName, modName) {
		var raw = fileName.split('.');
		var fileType = raw[raw.length-1];
		var moduleName = fileName.slice(0, fileName.length - raw[raw.length-1].length - 1);
		if (!this.modules[moduleName])
			this.modules[moduleName] = new Module(moduleName, fileType, aFilePath, modName);
		else
			this.modules[moduleName].check(moduleName, fileType, aFilePath);
	}

}

module.exports = ModuleProcessor;