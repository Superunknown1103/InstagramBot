const Bot = require('./Bot');// this directly imports the Bot/index.js file
const config = require('./Bot/config/puppeteer');

const run = async () => {
    const bot = new Bot();
};

run().catch(e=>console.log(e.message));