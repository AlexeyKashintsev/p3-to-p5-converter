var path = require('path');
var fs = require('fs');
var async = require('async');
import {ModuleProcessor} from "./modules";

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