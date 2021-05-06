const wait = async (page, time) => {
    await page.waitFor(time);
}

const click = async (page, selector) => {
    wait(page, 1000)
    if (selector.type == "xpath") {
        const elements = await page.$x(selector.value);
        await elements[0].click();
    } else {
        await page.click(selector.value);
    }
}

async function isVisible(page, xPathSelector){
    try {
      await page.waitForXPath(xPathSelector, { visible: true, timeout: 1000 });
      return true;
    } catch {
      return false;
    }
}

const log = async (type, msg) => {
    if (type = "DEBUG") {
        console.log("\x1b[34m", msg, "\x1b[0m");
    } else if (type = "WARN") { 
        console.log("\x1b[33m", msg, '\x1b[0m'); 
    } else if (type= "ERR") {
        console.log("\x1b[31m", msg, '\x1b[0m');
    } else if (type= "SUCC") {
        console.log("\x1b[32m", msg, '\x1b[0m');
    }
}

const waitMinutes = async (page) => {
    const randomTime = await (async () => { 
        const intervals = [{seconds: 5, milliseconds: 5000}, {seconds: 10, milliseconds: 10000}, {seconds: 20, milliseconds: 20000}, {seconds: 30, milliseconds: 30000}, {seconds: 60, milliseconds: 60000}, {seconds: 90, milliseconds: 90000}, {seconds: 120, milliseconds: 120000}]
        return intervals[~~(intervals.length * Math.random())];
    })();
    await log('DEBUG', `Waiting between 5 and 120 seconds before proceeding to next action...`)
    await page.waitFor(randomTime.milliseconds)
}

const fillField = async (page, selector, text) => {
    let input = selector.type = "css" ? await page.$(selector.value) : await page.$x(selector.value);
    await input.click({clickCount: 3});
    await input.press('Backspace');
    await page.type(selector.value, text);
}

const undesirableChar = async (handle) => {
    return await handle.includes('.') || handle.includes('#') || handle.includes('$') || handle.includes('[') || handle.includes(']');
}

module.exports = {
    click,
    undesirableChar,
    wait,
    log,
    fillField,
    isVisible,
    waitMinutes
}