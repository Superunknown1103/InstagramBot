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

const fillField = async (page, selector, text) => {
    let input = selector.type = "css" ? await page.$(selector.value) : await page.$x(selector.value);
    await input.click({clickCount: 3});
    await input.press('Backspace');
    await page.type(selector.value, text);
}

const undesirableChar = (handle) => {
    return handle.includes('.') || handle.includes('#') || handle.includes('$') || handle.includes('[') || handle.includes(']');
}

module.exports = {
    click,
    undesirableChar,
    wait,
    log,
    fillField
}