
// ig-bot/Bot/db.js

const firebase = require('firebase-admin');
const config = require("./config/db_config");

firebase.initializeApp({
    credential: firebase.credential.cert(config),
    databaseURL: 'https://instagram-automation-3df65-default-rtdb.firebaseio.com'
});
let database = firebase.database();

// following objects hold the list of users we have followed
const following = (param = '') => database.ref(`following/${param}`);

// follow history hold the list of users we have unfollowed so we don't follow
// them again.
const followHistory = (param = '') => database.ref(`follow_history/${param}`);

const addFollowing = async username => {
    const added = new Date().getTime();
    return following(username).set({username, added});
}

// returns the list of all the users we're following
const getFollowings = async () => following().once('value').then(data => data.val());

// takes the username to unfollow as an argument then removes the record
// from the list of people we are following and add it to the follow_history
// object i.e. people we have followed before.
let unFollow = async username => following(username).remove().then(() => followHistory(username).set({username}));

let inHistory = async username => followHistory(username).once('value').then(data => data.val());

module.exports = {
    addFollowing,
    getFollowings,
    followHistory,
    unFollow,
    inHistory
};