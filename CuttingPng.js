var path = require("path");
var xlsx = require('node-xlsx');
var fs = require("fs"),
    PNG = require("pngjs").PNG;

function getDirTree(inputPath, names, callback) {
    let files = fs.readdirSync(inputPath)
    for (file of files) {
        let filePath = inputPath + '/' + file;
        let fileState = fs.statSync(filePath);
        if (fileState.isDirectory()) { // 如果是目录 递归
            getDirTree(filePath, names)
        } else {
            if (path.extname(filePath) == ".png") {
                // _call(filePath);
                names.push(filePath)
            }
        }
    }
    callback && callback.call();
}


// 递归创建目录 同步方法
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}


function TakeOnePng(names, TakeNum, pngnum) {
    var filePath = names[TakeNum];
    console.log("开始处理图片  " + TakeNum + "   " + filePath);

    try {
        fs.createReadStream(filePath)
            .pipe(
                new PNG({
                    filterType: 4,
                })
            ).on("parsed", function () {
                //第一次不为 空行时候  设置
                var notNullLineIndex = 0;
                var IsgetnotNullLineIndex = false;
                var nulllineNum = 0;

                var left = this.width;
                var right = 0;
                //计算  图片应该的 长度和宽度
                for (var y = 0; y < this.height; y++) {
                    //表示 这一行没有数据  要切掉
                    var Isnully = true;
                    var tleft = 0;
                    var tright = 0;

                    var IsGetlift = false;
                    for (var x = 0; x < this.width; x++) {
                        //本行的 边际值
                        var idx = (this.width * y + x) << 2;
                        var m_Opacity = this.data[idx + 3];

                        // if (y == 184) {
                        //     console.log(x + "   " + m_Opacity);
                        // }
                        if (m_Opacity > 0) {
                            Isnully = false;
                            //左边边际点记录
                            if (!IsGetlift) {
                                tleft = x;
                                IsGetlift = true;
                                if (tleft < left) {
                                    // console.log("第" + y + " 行的左值为" + tleft);
                                    left = tleft;
                                }
                            }
                        }
                    }

                    var IsGetright = false;
                    for (var x = this.width - 1; x > 0; x--) {
                        //本行的 边际值
                        var idx = (this.width * y + x) << 2;
                        var m_Opacity = this.data[idx + 3];
                        if (m_Opacity > 0) {
                            Isnully = false;
                            //右边边际点记录
                            if (!IsGetright) {
                                IsGetright = true;
                                tright = x;
                                if (tright > right) {
                                    // console.log("第" + y + " 行的右边值为" + right);
                                    right = tright;
                                }
                            }
                        }
                    }

                    if (Isnully) {
                        nulllineNum++;
                    } else {
                        if (!IsgetnotNullLineIndex) {
                            notNullLineIndex = y;
                            IsgetnotNullLineIndex = true;
                        }
                    }

                }


                //写入的数据
                var wup = notNullLineIndex;
                var wdown = nulllineNum - notNullLineIndex;
                var wleft = left;
                var wright = this.width - right - 1;

                // console.log("上偏切掉" + wup + "  " + "下切掉" + wdown);
                // console.log("左偏切掉" + left + "  " + "右切掉" + wright);
                // console.log("原大小  " + this.width + "  " + this.height);

                Elsxdata[0]["data"].push(["/" + filePath, wup, wdown, wleft, wright])
                var newwidth = this.width - left - wright;
                var newheight = this.height - nulllineNum;


                var StarY = notNullLineIndex;
                var EndY = this.height - wdown - 1;

                var StarX = left;
                var EndX = right;

                // console.log("现在大小  " + newwidth + "  " + newheight);
                // console.log("像素起始Y  " + StarY + "  " + EndY);
                // console.log("像素起始X  " + StarX + "  " + EndX);


                var tnewdata = [];
                for (var y = StarY; y <= EndY; y++) {
                    for (var x = StarX; x <= EndX; x++) {
                        var idx = (this.width * y + x) << 2;
                        tnewdata.push(this.data[idx]);
                        tnewdata.push(this.data[idx + 1]);
                        tnewdata.push(this.data[idx + 2]);
                        tnewdata.push(this.data[idx + 3]);
                    }
                }

                if (tnewdata.length == 0) {
                    tnewdata = [0, 0, 0, 0];
                    var newdata = new Uint8Array(tnewdata);
                    this.height = 1;
                    this.width = 1;
                    this.data = newdata;
                } else {
                    var newdata = new Uint8Array(tnewdata);
                    this.height = newheight;
                    this.width = newwidth;
                    this.data = newdata;
                }


                // console.log(Elsxdata[0]["data"]);
                TakeNum++;
                this.pack().pipe(fs.createWriteStream("commondata/" + filePath));
                console.log("完成处理图片  " + TakeNum + "   " + filePath);

                if (TakeNum >= pngnum) {
                    var buffer = xlsx.build(Elsxdata);
                    // 写入文件
                    fs.writeFile('ResOffset.xls', buffer, function (err) {
                        if (err) {
                            console.log("Write failed: " + err);
                            return;
                        }
                        console.log("Write completed.");
                    });
                } else {
                    TakeOnePng(names, TakeNum, pngnum);
                }
            });
    } catch (error) {
        console.log("图片处理失败  " + filePath);
        console.log(error);
        TakeNum++;
        TakeOnePng(names, TakeNum, pngnum);
    }
}


var Elsxdata = [{
    name: 'data',
    data: [
        [
            'Path',
            'Up',
            'Down',
            'Left',
            'Right'
        ]
    ]
}]

var names = [];
getDirTree('battle', names, function () {
    var pngnum = names.length;
    console.log("需要处理图片  " + pngnum);
    TakeOnePng(names, 0, pngnum);
})





