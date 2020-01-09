var path = require("path");
var fs = require("fs");
var fsTools = require('./utils/fs');
var {booksName} = require('./config');
fs.readdir(path.join(__dirname, `/book/${booksName}`), function(err, files){
    var content = '';
    files.forEach( function (f) {
        var c = fs.readFileSync(path.join(__dirname, `/book/${booksName}/${f}`), 'utf-8');
        content += c.toString() + '\n';
    });
    fs.appendFile(path.join(__dirname, `/book/${booksName}.txt`), content, function (err) {
        if (err) {
            console.log(err)
        } else {
            fsTools.deleteFolder(path.join(__dirname, `/book/${booksName}`));
            console.log('successed');
        }
    });
});