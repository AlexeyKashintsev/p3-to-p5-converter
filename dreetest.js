const dree = require('dree');


const fileNames = [];

const options = {
	isSymbolicLink: false,
	sizeInBytes: false,
	size: false,
	hash: false,
	extensions: ['js', 'sql', 'model']
};
const fileCb = function(file) {
	fileNames.push(file.name);
};

dree.scan('E:\\p3-to-p5-converter', { extensions: [ 'html', 'js' ] }, fileCb);

//console.log(fileNames); // All the html and js files inside the given folder and its subfolders
let tree = dree.scan('E:\\p3-to-p5-converter', options);
console.log(tree);