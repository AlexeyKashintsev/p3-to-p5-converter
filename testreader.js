/*
const fs = require('fs');

class DirTree{
	constructor(dirName){
		this.tree = [];
		this.dirName = dirName;
		console.log(`this is dir tree constructor ${this.dirName }`);
		this._prepareTree();
	}
	_prepareTree(){


		fs.readdirSync(this.dirName).forEach(file =>{
			console.log(file);
			fs.lstat(file, (err, stats)=>{
				if(err){
					console.log(err);

				}
				if(stats.isDirectory()){
					_prepareTree();
				}

			})
			// if(file.isDirectory()){
			// 	this._prepareTree();=
			// }
		})
	}
}

let dirTree = new DirTree("E:\\testsforfilereader");

 */


/*
const testFolder = 'E:\\testsforfilereader';
const fs = require('fs');

let filelist = [];
let i = 0;

fs.readdirSync(testFolder).forEach(file => {
	console.log(file);
	filelist[i] = [];
	let a = file.split('.');
	filelist[i][0] = a[0];
	filelist[i][1] = a[1];

	console.log(filelist [i]);
	i++;
});

function testreader(testFolder) {

}

function dtree(testFolder, tree) {
	fs.readdirSync(testFolder).forEach(file => {
		if (directory) {

			dtree(file.name, tree)
		}
		console.log(file);

		// filelist[i] = [];
		// let a = file.split('.');
		// filelist[i][0] = a[0];
		// filelist[i][1] = a[1];

		// console.log(filelist [i]);s
		// i++;
	});
}

 */


///*
var path = require('path');
var fs = require('fs');
var async = require('async');

function ModuleProcessor() {
	function Module(aModuleName, aFileType, aFile) {
		this.type;
		this.files = {};
		this.check = function(aModuleName, aFileType, aFile) {
			this.files[aFileType] = aFile;
			if (aFileType === 'js') {
				this.type = 'module';
				this.files.js = aFile;
				console.log('Found module: ' + aModuleName);
			}
			if (aFileType === 'sql') {
				this.type = 'query';
				this.files.sql = aFile;
				console.log('Found query: ' + aModuleName);
			}
			if (aFileType === 'model') {
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

function getFiles(dirPath, callback) {
	var ignore = ['node_modules'];
	fs.readdir(dirPath, function (err, files) {
		if (err) return callback(err);

		var filePaths = [];
		var modules = new ModuleProcessor();
		async.eachSeries(files, function (fileName, eachCallback) {
			var filePath = path.join(dirPath, fileName);
			//let a = fileName.split('.');
			//console.log(a[0]);

			fs.stat(filePath, function (err, stat) {
				if (err) return eachCallback(err);

				if (stat.isDirectory() && !ignore.includes(fileName)) {
					getFiles(filePath, function (err, subDirFiles) {
						if (err) return eachCallback(err);

						filePaths = filePaths.concat(subDirFiles);
						eachCallback(null);
					});

				} else {
					if (stat.isFile() && (/\.js$/.test(filePath)
						|| /\.sql$/.test(filePath))
						|| /\.model$/.test(filePath)) {
						modules.process(filePath, fileName);
						// filePaths.push(fileName);
						//console.log(filePaths);
					}

					eachCallback(null);
				}
			});
		}, function (err) {
			callback(err, filePaths);
		});

	});

}


getFiles('./', function (err, files) {

	//console.log(err || files);
});

// */


/*
const fs = require('fs');
const path = require('path');
const options = ['js', 'sql', 'model'];
function getFiles (dir, files_){
	files_ = files_ || [];
	var files = fs.readdirSync(dir);
	for (var i in files){
		console.log(files[1].split('.'));
		if(files.split('.', 1)!== options) {break;}
		var name = dir + '/' + files[i];
		if (fs.statSync(name).isDirectory()){
			getFiles(name, files_);
		} else {
			files_.push(name);
		}
	}
	return files_;
}

console.log(getFiles('E:\\testsforfilereader'));

*/

/*
function walk(currentDirPath, callback) {
	let options = ['js', 'sql', 'model'];
	var fs = require('fs'),
		path = require('path');
	fs.readdir(currentDirPath, function (err, files) {
		if (err) {
			throw new Error(err);
		}
		files.forEach(function (name) {
			if (name.split('.', 1) !== options) {return;}
			var filePath = path.join(currentDirPath, name);
			var stat = fs.statSync(filePath);
			if (stat.isFile()) {
				callback(filePath, stat);
			} else if (stat.isDirectory()) {
				walk(filePath, callback);
			}
		});
	});
}

walk('E:\\testsforfilereader', function(filePath, stat) {
	// do something with "filePath"...
	console.log(filePath);
});

 //*/

/*
const list = require('list-contents');
list.
list("E:\\p3-to-p5-converter",(o)=>{
	if(o.error) throw o.error;
	console.log('Folders: ', o.dirs);
	console.log('Files: ', o.files);
});
//*/
