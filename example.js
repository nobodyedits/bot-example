'use strict';

// This bot is useless, but shows some basic functionality

const lib = require('ne-bot-api');

// API_KEY: Go to "my profile" and you'll find a section on the page to generate your API key.
const API_KEY = 'your api key';
// ROOM_ID: This is the room where you want your bot to join.
const ROOM_ID = 'your room id';
// BOT_NAME: Can by any name you want to give to your bot
const BOT_NAME = 'ExampleBot';

lib.connect(BOT_NAME, API_KEY, ROOM_ID)
    .then(connected)
    .catch(e => {
        console.error(e);
        process.exit(1);
    });

/**
 * Called when connected
 * @param {API} api - The API object
 */
function connected(api) {
    console.log('Room dimensions', api.room.width, api.room.height);

    // You should keep these, it's always useful. You can check what the server says to you so no surprises happen.
    api.events.on('error', console.error);
    api.events.on('bot:kick', e => console.warn(e ? e : "Kicked"));
    api.events.on('bot:disconnect', () => {
        console.warn('Disconnected. Did your bot do an illegal action?');
        process.exit(1);
    });

    api.events.on('room:plays', o => console.log(`Old playcount: ${o}, playcount is now ${o + 1}`));
    api.events.on('room:save', a => console.log('room saved', a));

    api.events.on('player:joined', p => console.log('join', p.name));
    api.events.on('player:left', p => console.log('leave', p.name));
    api.events.on('player:chat', (p, m) => console.log(`${p.name}: ${m}`));
    api.events.on('player:god', (p, s) => console.log('god', p.name, s));

    // Might want this for debug
    api.events.on('system:chat', m => console.log(`System: ${m}`));

    api.events.on('player:move', (player, x, y, xDir, yDir, xSpd, ySpd) => {
        x = (x + 8 + xDir * 8) >> 4;
        y = (y + 8 + yDir * 8) >> 4;
        if(api.room.isOutOfBounds(x, y)) return;
        api.room.setBackground(x, y, 'checker red');
    });

    api.events.on('player:jump', p => api.sendChat(`${p.name} jumped!`));

    api.events.on('room:goldcrown', p => {
        if(p) {
            const old = api.room.goldCrownPlayer;
            if(old)
                api.sendChat(`${p.name} stole the gold crown from ${old.name}`);
            else
                api.sendChat(`${p.name} got the gold crown`);
        } else
            api.sendChat('The owner of the gold crown left');
    });

    api.events.on('room:clear', () => console.log('The room got cleared'));
    api.events.on('room:load', () => console.log('The room got reloaded from save'));

    // Room settings listeners
    api.events.on('room:name', x => console.log('new room name:', x));
    api.events.on('room:code', x => console.log('new room code:', x));
    api.events.on('room:category', x => console.log('new room category:', x));
    api.events.on('room:visible', x => console.log('new room lobby visibility:', x));
    api.events.on('room:autoSave', x => console.log('new room auto-save setting:', x));
    api.events.on('room:allowSpectate', x => console.log('new room allow spectate setting:', x));
    api.events.on('room:allowParticleActions', x => console.log('new room allow particle actions setting:', x));

    if(api.room.goldCrownPlayer)
        api.sendChat('The crown is (at the time of bot joining) in possession of ' + api.room.goldCrownPlayer.name);

    api.events.on('player:coin:gold:got', (p, n) => console.log(p.name, 'got a gold coin, was', p.goldCoinCount, 'now', n));
    api.events.on('player:coin:gold:lost', (p, n) => console.log(p.name, 'lost a gold coin, was', p.goldCoinCount, 'now', n));
    api.events.on('player:coin:blue:got', (p, n) => console.log(p.name, 'got a blue coin, was', p.blueCoinCount, 'now', n));
    api.events.on('player:coin:blue:lost', (p, n) => console.log(p.name, 'lost a blue coin, was', p.blueCoinCount, 'now', n));
        
    api.events.on('player:tp:toplayer', (s, d) => console.log(`${s.name} got teleported to ${d.name}`));

    api.events.on('player:die', p => console.log(`${p.name} died`));
    api.events.on('player:reset', (p, x, y) => console.log(`${p.name} reset and got teleported to (${x}, ${y})`));
    api.events.on('player:respawn', (p, x, y) => console.log(`${p.name} respawned at (${x}, ${y})`));

    // Example: if a player placed a background, change it to the default background
    api.events.on('room:bg', (p, x, y, bg) => {
        api.room.setBackground(x, y, 'default' /* put any background name here, hover above a tile in the block picker in NE and see what name it is */);
    });

    api.events.on('room:fg', (p, x, y, fg) => {
        // fg is an object of type Tile, but its toString is overriden to return the name of this foreground block
        console.log(`${p.name} placed foreground "${fg}" at (${x}, ${y})`);
    })

    // Setting a foreground block
    api.room.setForeground(1, 10, 'basic red');
    // Or you could also use a Tile instance if you happen to have one already
    api.room.setForeground(1, 11, api.tileManager.getForeground('basic blue'));

    api.room.drag = true; // It's already true by default, see the /drag command

    // Example: manually save the room
    api.room.save();

    // Example: give players godmode automatically on join
    api.events.on('player:joined', p => p.setPermission(lib.Permission.GOD));

    // Example: reset players every 60s
    setInterval(() => api.room.reset(), 60000);

    // Example:
    //  - clear the room when someone says "clear"
    //  - load the room when someone says "load"
    //  - places a coindoor when someone says "coindoor"
    //  - activates the red key when someone says "red"
    //  - deactivates the red key when someone says "no red"
    api.events.on('player:chat', (p, m) => {
        if(m === "clear")     api.room.clear();
        else if(m === "load") api.room.load();
        else if(m === "coindoor") {
            api.room.setForeground(1, 1, "gold coin door");
            api.room.setData(1, 1, new lib.NumberData(12)); // You need 12 coins
        } else if(m === "red") {
            api.room.setKeyActive(lib.Key.RED, true);
        } else if(m === "no red") {
            api.room.setKeyActive(lib.Key.RED, false);
        }
    });

    // Example: listen to a player activated a key
    api.events.on('player:key:activate', (p, key) => {
        console.log(`${p.name} activated ${key}`);

        if(key === lib.Key.RED) console.log('That\'s the red key!');
        console.log(`Activated keys before this key was activated: ${api.room.activeKeys}`);
    });

    // Example: is a key active?
    if(api.room.isKeyActive(lib.Key.BLUE)) console.log('The blue key is active atm!');

    // Example: listen to a key deactivation, this is a room event because it's not caused by a player, it's caused by a timer
    api.events.on('room:key:deactivate', key => console.log(`${key} deactivated`));

    // Example: change some settings
    console.log("Current room settings:", api.room.name, api.room.code, api.room.category, api.room.visible, api.room.autoSave, api.room.allowSpectate, api.room.allowParticleActions);
    api.room.name = "abcdef";
    api.room.code = "abcdefghijklmnop";
    api.room.category = lib.Category.PLATFORMER;
    api.room.visible = true;
    api.room.allowSpectate = true;
    api.room.autoSave = false;
    api.room.allowParticleActions = true;

    // Example: override vanish door timings
    api.events.on('room:data', (p, x, y, data) => {
        if(data instanceof lib.VanishData) {
            console.log('was:', data);
            api.room.setData(x, y, new lib.VanishData(200, 30));
            console.log('changed to:', api.room.getData(x, y));
        }
    });

    // Example: place a sign at (1, 1)
    api.room.setForeground(1, 1, 'sign');
    api.room.setData(1, 1, new lib.TextData('Hello %username%!'));
    console.log(api.room.getData(1, 1)) // Now shows the new text we put in

    // Example: place a portal at (2, 2)
    api.room.setForeground(2, 2, 'blue portal');
    api.room.setData(2, 2, new lib.PortalData(0 /* this portals id */, 42 /* destination portal id */, lib.Direction.RIGHT /* points to the right */));
    console.log(api.room.getData(2, 2)); // Again: We can see the changes

    // Example: place a gold coin door which requires 50 coins at (40, 10)
    api.room.setForeground(40, 10, 'gold coin door');
    api.room.setData(40, 10, new lib.NumberData(50));
    console.log(api.room.getData(40, 10)); // Again: We can see the changes

    // Example: getForeground returns a Tile instance, so you can also pass that instead of a string (see earlier)
    //          Here we clone foreground type of (0, 0) to (3, 3)
    api.room.setForeground(3, 3, api.room.getForeground(0, 0) /* this returns a Tile instance */);
    console.log(api.room.getForeground(0, 0)); // This is an instance of Tile. It contains some stuff like name & minimap color.
}

// Prevent exit
setInterval(() => {}, 1 << 30)
