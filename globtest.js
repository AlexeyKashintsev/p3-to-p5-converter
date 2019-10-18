const glob = require('glob');

glob("E:\p3-to-p5-converter" + '/**/*.sql', {}, (err, files)=>{
	console.log(files)
})