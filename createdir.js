var path = require("path");
var xlsx = require('node-xlsx');
var fs = require("fs"),
    PNG = require("pngjs").PNG;


function delDir(path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) {
                delDir(curPath); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });

        // fs.rmdirSync(path);  // 删除文件夹自身
    }
}

const copyFile = function (srcPath, tarPath, filter = []) {

    fs.readdir(srcPath, function (err, files) {
        console.log(files)
        if (err === null) {
            files.forEach(function (filename) {
                let filedir = path.join(srcPath, filename);
                let filterFlag = filter.some(item => item === filename)
                if (!filterFlag) {
                    fs.stat(filedir, function (errs, stats) {
                        let isFile = stats.isFile()
                        if (!isFile) {
                            //文件跳过 创建文件夹
                            let tarFiledir = path.join(tarPath, filename);
                            fs.mkdir(tarFiledir, (err) => { });
                            copyFile(filedir, tarFiledir, filter)                 // 递归
                        }
                    })
                }
            })
        } else {
            if (err) console.error(err);
        }
    })


}

delDir("commondata/battle");
console.log("开始创建目录");
copyFile('battle', 'commondata/battle', []);
console.log("完成创建目录");
