const cheerio = require("cheerio");
const request = require("request");
const fs = require("fs");
const path = require("path");
var iconv = require('iconv-lite');
var num = 1, selection = 0, host = 'https://m.xlawen.com', catalog = '/wapbook-3515/', booksName = '逍遥后宫n', list = [];

const getSelections = function (link) {
    if (num === 1) {
        fs.createWriteStream(path.join(__dirname, `/book/${booksName}.txt`)) //创建txt文件
    }
    request({
        url: host + link,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.94 Safari/537.36'
        },
        encoding: null //让body 直接是buffer
    }, function (err, res, body) {
        var str = iconv.decode(body, 'GBK');
        $ = cheerio.load(str);
        var curruePage = '', href = '';
        var nextPageThing = num === 1 ? $('.page').eq(0).find('a').eq(0) : $('.page').eq(0).find('a').eq(2), curruePageThing = $('.page').eq(1).text(),selections = $('.chapter').find('li');
        curruePage = curruePageThing.split('输入页数')[1];
        var req = /\(([^)]*)\)/;
        var text = curruePage.match(req)[1], cutText = text.slice(1, text.length - 1).split('/'), curruePageNum = cutText[0], totalPage = cutText[1];
        console.log('当前目录页面:' + curruePageNum + '/' + totalPage);
        selections.each( function (i, el) {
            href = $(this).find('a').attr('href');
            list.push(href);
        })
        if (curruePageNum !== totalPage) {
            // 接着请求下一页
            num++;
            getSelections(nextPageThing.attr('href'))
        } else {
            console.log('全部章节：', list);
            // 请求章节列表
            getLinkContent()
        }
    })
};

const getLinkContent = function (link, nextPage) {
    let url = host + list[selection];
    if (nextPage) {
        url = host + link
    }
    request({
        url: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.94 Safari/537.36'
        },
        encoding: null //让body 直接是buffer
    }, function (err, res, body) {
        var str = iconv.decode(body, 'GBK'), nextContentPage = '';
        $ = cheerio.load(str);
        nextContentPage = $('#pb_next').attr('href');
        writeFile($('#nr1').text())
        if (list.indexOf(nextContentPage) > -1) {
            // 如果list中存在nextPage的url，进入下一章
            if (selection === list.length - 1) {
                // 最后一章
                console.log('添加完毕');
            } else {
                console.log(`当前缓存章节:${selection + 1} / ${list.length}`);
                selection++;
                getLinkContent();
            }
        } else {
            // 进入下一页
            console.log('进入下一页');
            getLinkContent(nextContentPage, true)
        }
    })
}

const writeFile = function (content) {
    fs.appendFile(path.join(__dirname, `/book/${booksName}.txt`), content, function (err) {
        if (err) {
            console.log(err)
        } else {
            console.log('········保存成功')
            // if (count + 1 < list.length) { //当前页码是否超过章节数
            //     count = count + 1;
            //     getBody();
            // }
        }
    })
};

getSelections(catalog);