const path = require('path');
const fs = require('fs');
const async = require('async');
const splt = require('split');
const ModuleProcessor = require('./modules');

function getFiles(dirPath, callback) {
	let ignore = ['node_modules'];
	fs.readdir(dirPath, function (err, files) {
		if (err) return callback(err);

		let filePaths = [];
		let modules = new ModuleProcessor();
		async.eachSeries(files, function (fileName, eachCallback) {
			let filePath = path.join(dirPath, fileName);
			let modName = 'nothing';
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
						|| /\.sql$/.test(filePath)
						|| /\.model$/.test(filePath))) {
						filePaths.push(fileName);
						fs.createReadStream(filePath)
							.pipe(splt())
							.on('data', function (line) {
								var nameString = line.match(/[\s\S]*@name\S*\s*/g);
								if (nameString) {
									modName = line.slice(nameString[0].length, line.length);
								}
								//fs.appendFileSync('./log.txt', fileName+' '+nameString+'\n');
								//each chunk now is a separate line!
						});
						modules.process(filePath, fileName, modName);


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
//E:\arm-master

getFiles('E:\\p3-to-p5-converter\\graph', function (err, files) {

	//console.log(err || files);
});