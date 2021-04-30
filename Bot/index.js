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
        await this.followAndMessage(this.page)
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

    /* Find specified instagramHandle page, scrape follower list, follow them */
    async scrapePageFollowers(page, handle) {
        await help.log('DEBUG', `Visiting ${handle}'s instagram page...`)
        await page.goto(`https://www.instagram.com/${handle}/`, { timeout: 60000 });
        try {
            await help.click(page, this.config.selectors.follow);
        } catch {
            await help.click(page, this.config.selectors.unfollow);
            await help.wait(page, 2500);
        }
        await help.wait(page, 2500);
        await help.log('DEBUG', `Scraping follower list...`)
        await help.click(page, this.config.selectors.followers);
        await help.wait(page, 3500);
        const scrapeLimit = this.config.scrapeLimit;
        let currentScraped = 0;
        // keep scraping until we hit our specified limit - using a recursive function to reload the page and grab more followers
        const scrapeFollowerModal = async () => {
            let followers = await page.$x(this.config.selectors.followerInstance.value);
            await followers.forEach(async follower => {
                let followerHandle = await page.evaluate(x => x.innerText, follower);
                if (await help.undesirableChar(followerHandle)) {
                    console.log(`SKIP: ${followerHandle}. Undesirable characters found in handle.`)
                } else {
                    await dbActions.addFollowing(followerHandle);
                    currentScraped++;
                    console.log(`${followerHandle}'s handle scraped.`);
                }
            });
            if (currentScraped < scrapeLimit) {
                await help.wait(page, 3500);
                await help.log('DEBUG', `Refreshing...`)

                await page.goBack();
                await page.goForward();
                await help.click(page, this.config.selectors.followers);
                scrapeFollowerModal()
            } else {
                await help.log('DEBUG', `Scrape limit of ${scrapeLimit} has been hit.`);
                // await this.followAndMessage(page);
            }
        }
        scrapeFollowerModal();
        return 'done';
    }

    async followAndMessage(page) {
        let scrapedUsers = await dbActions.getFollowings();
        let all_users = Object.keys(scrapedUsers);
        help.log('DEBUG', 'Beginning followAndMessage...')

        for (var i = 0; i < all_users.length; i++) {
            try { 
            // go to users page
            await page.goto(`https://www.instagram.com/${all_users[i]}/`, { timeout: 0, waitUntil: 'networkidle0' });
            // click message, wait to be directed to chat page
            await help.click(page, this.config.selectors.follow);
            await help.wait(page, 3500);
            await help.click(page, this.config.selectors.messageBtn);
            await help.wait(page, 3500);
            await page.waitForNavigation({waitUntil: 'networkidle0'});
            } catch {
                help.log('DEBUG', `Unable to message ${all_users[i]}`);
            }

        };
    }

    async unFollowUsers(page) {
        let date_range = new Date().getTime() - (this.config.settings.unfollow_after_days * 86400000);
        await help.log('DEBUG', `Beginning unfollow process...`)
        // get the list of users we are currently following
        let following = await dbActions.getFollowings();
        let users_to_unfollow = [];
        if (following) {
            const all_users = Object.keys(following);
            // filter our current following to get users we've been following since day specified in config
            users_to_unfollow = all_users.filter(user => following[user].added < date_range);
            await help.log('DEBUG', `Attempting to unfollow ${users_to_unfollow.length} users...`)
        }

        if (users_to_unfollow.length) {
            for (let n = 0; n < users_to_unfollow.length; n++) {
                let user = users_to_unfollow[n];
                await help.log('DEBUG', `Unfollowing ${user} ...`)
                await page.goto(`https://www.instagram.com/${user}/`, { timeout: 0, waitUntil: 'networkidle0' });
                await page.waitFor(1500 + Math.floor(Math.random() * 500));

                // Checking to see if follow button is on the page
                let followStatus = await help.isVisible(page, this.config.selectors.follow.value) ? 'Not Following' : 'Following';

                if (followStatus === 'Following') {
                    console.log('<<< UNFOLLOW USER >>>' + user);
                    //click on unfollow button
                    await help.click(page, this.config.selectors.unfollow);
                    //wait for a sec
                    await page.waitFor(1000);
                    //confirm unfollow user
                    await help.click(page, this.config.selectors.confirmUnfollow);
                    //wait for random amount of time
                    await page.waitFor(20000 + Math.floor(Math.random() * 5000));
                    //save user to following history
                    await dbActions.unFollow(user);
                    await help.log('DEBUG', `Unfollowed ${user} successfully.`)
                } else {
                    //save user to our following history
                    dbActions.unFollow(user);

                }
            }

        }
    }


}

module.exports = InstagramBot;