const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const express = require('express');

const targetLink = 'https://www.rbc.ua/';
const parsingInterval = 60000;
const newsDirectory = 'news';

function parsePage() {
    console.log('Запит: ' + targetLink);

    axios.get(targetLink)
        .then(response => {
            const currentPage = response.data;

            console.log('Результат парсингу:\n', currentPage);

            const news = findNews(currentPage);

            console.log('Знайдені новини:');
            news.forEach((item, index) => {
                console.log(`Новина ${index + 1}:`);
                console.log('Заголовок:', item.title);
                console.log('Зміст:', item.content);
                console.log('------------------');

                saveNews(item, index);
            });

            console.log('Парсинг сторінки завершено.');

            setTimeout(parsePage, parsingInterval);
        })
        .catch(error => {
            console.error('Помилка при отриманні сторінки: ' + error);
            setTimeout(parsePage, parsingInterval);
        });
}

function findNews(html) {
    const $ = cheerio.load(html);
    const news = [];

    $('.news-title').each((index, element) => {
        const title = $(element).text();
        const content = $(element).next('.news-content').text();

        news.push({ title, content });
    });

    return news;
}

function saveNews(newsItem, index) {
    const newsFolder = path.join(__dirname, newsDirectory);
    const newsFileName = `news_${index + 1}.html`;
    const newsFilePath = path.join(newsFolder, newsFileName);

    if (!fs.existsSync(newsFolder)) {
        fs.mkdirSync(newsFolder);
    }

    fs.writeFile(newsFilePath, newsItem.content, 'utf8', err => {
        if (err) {
            console.error('Помилка при збереженні новини:', err);
        } else {
            console.log(`Новина ${index + 1} збережена у файл: ${newsFilePath}`);
        }
    });
}
function startWebServer() {
    const app = express();
    const newsFolder = path.join(__dirname, newsDirectory);
    app.use(express.static(newsFolder));
    app.get('/', (req, res) => {
        fs.readdir(newsFolder, (err, files) => {
            if (err) {
                console.error('Помилка при читанні директорії news:', err);
                res.send('Помилка при отриманні списку новин');
            } else {
                const newsList = files.map(file => `<a href="/${file}">${file}</a>`).join('<br>');
                res.send(newsList);
            }
        });
    });

    app.get('/:news', (req, res) => {
        const newsFile = req.params.news;
        const newsFilePath = path.join(newsFolder, newsFile);

        fs.readFile(newsFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Помилка при читанні файлу новини:', err);
                res.send('Помилка при відображенні новини');
            } else {
                res.send(data);
            }
        });
    });

    const port = 3000;
    app.listen(port, () => {
        console.log(`Веб-сервер запущено http://localhost:${port}`);
    });
}

parsePage(); // Запуск парсингу першої сторінки
startWebServer(); // Запуск веб-сервера