const path = require('path');
const fs = require('fs');
const async = require('async');
const splt = require('split');
const ModuleProcessor = require('./modules');

function getFiles(dirPath, callback) {
	let ignore = ['node_modules'];
	let res;
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
						if (/\.model$/.test(filePath)) {
							fs.createReadStream(filePath)
								.pipe(splt())
								.on('data', function (line) {
									// let nameString = line.toLowerCase().indexOf("entity name=".toLowerCase());
									// nameString+=12;
									// let regexp = /"(.*?)"/;
									let Rmod = /tableName="+(\w+)+"/;
									let Rquotes = /"+(\w+)+"/;
									// let nameString = line.match(Rmod).match(Rquotes).slice(1, -1);
									let nameString = line.match(Rmod);
									// nameString = nameString.match(Rquotes);
									// if (nameString !== "null"){
										res = nameString.split(',');
									// }
									if (res) {
										// modName = line.slice(nameString[0].length, line.length);
										fs.appendFileSync('./log.txt', fileName + '     ' + res[1] + '\n');

									}
									//each chunk now is a separate line!
								});
						}
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

getFiles('E:\\p3-to-p5-converter\\app', function (err, files) {

	//console.log(err || files);
});