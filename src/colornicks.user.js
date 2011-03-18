// ==UserScript==
// @name            Colored nick names in IRCcloud
// @version         0.3
// @author          Alex Vidal, based on http://userscripts.org/scripts/show/88258, based on http://chatlogs.musicbrainz.org/mb_chatlogger.user.js
// @licence         BSD
//
// @require         http://code.jquery.com/jquery-1.5.1.min.js
//
// @include         http://irccloud.com/*
// @include         https://irccloud.com/*
// @include         http://www.irccloud.com/*
// @include         https://www.irccloud.com/*
// ==/UserScript==

/*
 * Based on this userscript http://userscripts.org/scripts/show/88258
 * by Lukáš Lalinský
 */

// Hashing and color algorithms borrowed from the chromatabs Firefox extension.

(function () {

    var _cache = [];
    var S = 1.0;
    var L = 0.4;

    function hash(s) {
        var h = 5381;

        for(var i = 0; i < s.length; i++) {
            h = ((h << 5) + h) + s.charCodeAt(i);
        }

        return h;
    }

    function get_color(nick) {
        var hue = hash(nick) % 360;

        return "hsl(" + hue + "," + S*100 + "%," + L*100 + "%)";

    }

    function recv(event) {
        var $t = $(event.target);

        // new messages are divs with a class of chat
        if(!$t.is('div.chat')) return;

        //the actual div contains a bunch of spans, one for each part
        //of the message

        var $author = $t.find('span.author');
        var nick = $author.find('a').text();

        // get the color
        var color = get_color(nick);

        // finally, set the property
        $author.css('color', color);

        // need to set it on the anchor as well, since the css overrides it
        $author.find('a').css('color', color);

        return;

    }

    $('#buffer').bind('DOMNodeInserted', recv);

})();
