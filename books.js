const cheerio = require("cheerio");
const request = require("request");
const fs = require("fs");
const path = require("path");
var iconv = require('iconv-lite');
var config = require('./config');
var num = 1,
    selection = [], // 章节地址链接
    defaultNum = 3, // 最大并发数
    raisingNum = 0, // 最大数组长度
    titleList = [], // 目录title的list
    host = config.host, // 链接host
    catalog = config.catalog, // 链接尾缀
    booksName = config.booksName, // 书名
    list = [], // 全部章节链接
    twoDera = [], // 并发的二维数组
    endUrl = config.endUrl, // 结束的链接地址
    isSetTitle = config.isSetTitle,
    encode = config.encode;
    // endUrl = '/wap/down.php'; // 结束的链接地址
const getSelections = function (link) {
    // if (num === 1) {
    //     fs.createWriteStream(path.join(__dirname, `/book/${booksName}.txt`)) //创建txt文件
    // }
    request({
        url: host + link,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.94 Safari/537.36'
        },
        encoding: null //让body 直接是buffer
    }, function (err, res, body) {
        var str = iconv.decode(body, encode);
        $ = cheerio.load(str);
        var curruePage = '', href = '';
        var nextPageThing = num === 1 ? $('.page').eq(0).find('a').eq(0) : $('.page').eq(0).find('a').eq(2), curruePageThing = $('.page').eq(1).text(),selections = $('.chapter').find('li');
        curruePage = curruePageThing.split('输入页数')[1];
        console.log(curruePageThing);
        var req = /\(([^)]*)\)/;
        var text = curruePage.match(req)[1], cutText = text.slice(1, text.length - 1).split('/'), curruePageNum = cutText[0], totalPage = cutText[1];
        console.log('当前目录页面:' + curruePageNum + '/' + totalPage);
        selections.each( function (i, el) {
            href = $(this).find('a').attr('href');
            list.push(href);
            titleList.push($(this).find('a').text());
        })
        if (curruePageNum !== totalPage) {
            // 接着请求下一页
            num++;
            getSelections(nextPageThing.attr('href'))
        } else {
            // getLinkContent()
            twoDera = dimensionRaising(list);
            mkdirCaca();
            getPages();
        }
    })
};

const getPages = function () {
    for(let i = 0; i < twoDera.length; i++) {
        getLinkContent(i);
    }
}

const getLinkContent = function (i,link, nextPage) {
    let url = '';
    if (selection[i] === twoDera[i].length) {
        console.log(`${i}部分下载完成`);
    }else if (nextPage) {
        url = host + link
        queryBody(url, i);
    } else {
        if (twoDera[i][selection[i]]) {
            url = host + twoDera[i][selection[i]];
            console.log(`缓存链接：${url}`);
            writeFile('\r\n' + titleList[selection[i] + i * raisingNum] + '\r\n', i);
            queryBody(url, i);
        } else {
            console.log('链接为空');
        }
    }
    
}

const queryBody = (url,i) => {
    request({
        url: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.94 Safari/537.36'
        },
        encoding: null //让body 直接是buffer
    }, function (err, res, body) {
        if (err) {
            // 如果出错，再重新请求一次
            console.log(err);
            queryBody(url, i);
        } else {
            var str = iconv.decode(body, encode), nextContentPage = '';
            $ = cheerio.load(str);
            nextContentPage = $('#pb_next').attr('href');
            writeFile($('#nr1').text(), i);
            var nextPath = twoDera[i + 1] ? twoDera[i + 1][0] : '';
            if (list.indexOf(nextContentPage) > -1 && nextContentPage !== nextPath) {
                selection[i]++;
                console.log(`当前缓存进程：${i}，缓存进度：${selection[i]}/${twoDera[i].length}`);
                getLinkContent(i);
                // }
            } else {
                // 进入下一页
                // if (nextContentPage.indexOf(endUrl) > -1) {
                if (nextContentPage === endUrl) {
                    console.log(`全部缓存完成`)
                    return false
                } else {
                    console.log('进入下一页');
                    getLinkContent(i, nextContentPage, true)
                }
            }
        }
    })
}

const writeFile = function (content, i) {
    fs.appendFile(path.join(__dirname, `/book/${booksName}/${booksName}-${i}.txt`), content, function (err) {
        if (err) {
            console.log(err)
        } else {
            // if (count + 1 < list.length) { //当前页码是否超过章节数
            //     count = count + 1;
            //     getBody();
            // }
        }
    })
};

const mkdirCaca = function () {
    fs.mkdir(path.join(__dirname, `/book/${booksName}`), function (err) {
        if (err) {
            console.log(err)
        } else {
        }
    })
}

const dimensionRaising = function (list) {
    /**
     * raisingList 返回的数组
     * copyList 每次重新赋值的数组
     * raisingNum 降维数组的大小
     */
    raisingNum = Math.ceil(list.length / defaultNum)
    var raisingList = new Array(defaultNum);
    selection = new Array(defaultNum);
    selection.fill(0);
    for (let i = 0; i < defaultNum; i++) {
        raisingList[i] = list.slice(i * raisingNum, ( i + 1 ) * raisingNum);
    }
    return raisingList
}

getSelections(catalog);