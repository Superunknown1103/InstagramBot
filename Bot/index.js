const help = require('./helpers.js');

class InstagramBot {
    constructor() {
        this.firebase_db = require('./db');
        this.config = require('./config/puppeteer.json');
        this.init();
    }

    async init() {
        await this.initPuppeteer();
        await this.visitInstagram(this.page);
    }

    /* Start browser, create new page, set window dimensions */
    async initPuppeteer() {
        const puppeteer = require('puppeteer');
        this.browser = await puppeteer.launch({
            headless: this.config.settings.headless,
            args: ['--no-sandbox'],
        });
        this.page = await this.browser.newPage();
        this.page.setViewport({width: 1500, height: 764});
    }

    /* Vist instagram's site, wait for 3 seconds (prevent bot detection),
    input login details, close turn on notification modal after successful login */
    async visitInstagram(page) { 
        await page.goto(this.config.base_url, {timeout: 60000});
        await help.wait(page, 2500);
        /* Username Field */
        await help.log('DEBUG', 'Entering username...');
        await help.click(page, this.config.selectors.username);
        await help.fillField(page, this.config.selectors.username, this.config.username);
        /* Password Field */
        await help.log('DEBUG', 'Entering password...');
        await help.click(page, this.config.selectors.password);
        await help.fillField(page, this.config.selectors.password, this.config.password);
        /* Log In */
        await help.log('DEBUG', 'Click log in button...')
        await help.click(page, this.config.selectors.login);
        await this.page.waitForNavigation();

        try { 
            /* Reject save log in */
            await help.log('DEBUG', 'CLick Not Now to save login information...');
            await help.click(page, this.config.selectors.notnow);
            await this.page.waitForNavigation();
        } catch {
            await help.log('WARN', 'Request to save log in information modal did not appear?')
        }
        await help.log('SUCC', "LOGIN SUCCESSFUL");

        try { 
            /* Reject Notifications */
            await help.log('DEBUG', 'CLick Not Now to notification modal...');
            await help.click(page, this.config.selectors.notnow);
        } catch {
            await help.log('WARN', 'Request to turn on notifications information modal did not appear?')
        }
    }

}

module.exports = InstagramBot;