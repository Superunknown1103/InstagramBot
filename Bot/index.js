const help = require('./helpers.js');
const dbActions = require('./db.js');

class InstagramBot {
    constructor(instagramHandle) {
        this.firebase_db = require('./db');
        this.config = require('./config/puppeteer.json');
        this.instagramHandle = instagramHandle;
        this.init();
    }

    async init() {
        await this.initPuppeteer();
        await this.visitInstagram(this.page);
        await this.scrapePageFollowers(this.page, this.instagramHandle);
    }

    /* Start browser, create new page, set window dimensions */
    async initPuppeteer() {
        const puppeteer = require('puppeteer');
        this.browser = await puppeteer.launch({
            headless: this.config.settings.headless,
            args: ['--no-sandbox'],
        });
        this.page = await this.browser.newPage();
        this.page.setViewport({ width: 1500, height: 764 });
    }

    /* Vist instagram's site, wait for 3 seconds (prevent bot detection),
    input login details, close turn on notification modal after successful login */
    async visitInstagram(page) {
        await page.goto(this.config.base_url, { timeout: 60000 });
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

    /* Find specified instagramHandle page, scrape follower list */
    async scrapePageFollowers(page, handle) {
        await help.log('DEBUG', `Visiting ${handle}'s instagram page...`)
        await page.goto(`https://www.instagram.com/${handle}/`, { timeout: 60000 });
        await help.click(page, this.config.selectors.follow);
        await help.wait(page, 2500);
        await help.log('DEBUG', `Scraping follower list...`)
        await help.click(page, this.config.selectors.followers);
        await help.wait(page, 3500);
        const scrapeLimit = this.config.scrapeLimit;
        let followers = await page.$x(this.config.selectors.followerInstance.value);
        console.log(followers.length);
        followers.forEach(async follower => {
            let followerHandle = await page.evaluate(x => x.innerText, follower);
            // check if handle contains undesirable characters that won't work in our database.
            if (help.undesirableChar(followerHandle)) {
                console.log(`SKIP: ${followerHandle}. Undesirable characters found in handle.`)
            } else {
                await dbActions.addFollowing(followerHandle);
                console.log(`${followerHandle}'s handle scraped.`);
            }
        });
        console.log(await dbActions.followHistory());
    }


}

module.exports = InstagramBot;