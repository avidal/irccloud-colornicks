// ==UserScript==
// @name            Colored nick names in IRCcloud
// @version         0.5.4
// @author          Alex Vidal, based on http://userscripts.org/scripts/show/88258, based on http://chatlogs.musicbrainz.org/mb_chatlogger.user.js
// @licence         BSD
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

function colornicks(ci, $) {

    var _cache = [];
    var S = 0.8;
    var L = 0.25;

    // create the stylesheet
    var style = document.createElement('style');
    $('body').append(style);

    function clean_nick(nick) {
        // attempts to clean up a nickname
        // by removing alternate characters from the end
        // nc_ becomes nc, avidal` becomes avidal

        nick = nick.toLowerCase();

        // typically ` and _ are used on the end alone
        nick = nick.replace(/[`_]+$/, '');

        // remove |<anything> from the end
        nick = nick.replace(/|.*$/, '');

        return nick;
    }

    function hash(s) {
        var s = clean_nick(s);

        var h = 0;

        for(var i = 0; i < s.length; i++) {
            h = s.charCodeAt(i) + (h << 6) + (h << 16) - h;
        }

        return h;

    }

    function get_color(nick) {
        if(_cache[nick]) return _cache[nick];
        var color = generate_color(nick);
        _cache[nick] = color;
        return color;
    }

    function generate_color(nick) {

        var nickhash = hash(nick);

        // get a positive value for the hue
        var deg = nickhash % 360;
        var h = deg < 0 ? 360 + deg : deg;

        // default L is 50
        var l = 50;

        // half of the hues are too light, for those we
        // decrease lightness
        if(h >= 30 && h <= 210) {
            l = 30;
        }

        // keep saturation above 20
        var s = 20 + Math.abs(nickhash) % 80;

        var col = "hsl(" + h + "," + s + "%," + l + "%)";

        return col;

    }

    function add_style(author, color) {
        var cur = $(style).text();

        // nicks are represented in an anchor with a title that
        // looks like "<nick> (<hostmask>)", so we match on
        // a title that starts with "<nick>"
        // because the hostmask only exists once that person has
        // been properly identified, there are situations where
        // a particular nick won't have any color forever.
        // since our actual selectors are fairly specific,
        // there's no need to require the space after the authors
        // name in the anchor title.
        var anchor = "a[title^='"+author+"']";

        // match on span.author for the chat window
        var rule = "span.author " + anchor;

        // and ul.memberList for the nick list
        rule += ", ul.memberList li.user " + anchor;

        var _style = "color: " + color + " !important;";

        $(style).text(cur + rule + "{" + _style + "}\n");
    }

    function process_message(evt, message) {
        if(message.type != 'buffer_msg') return;

        var author = message.from;
        if(_cache[author]) return;

        var color = get_color(author);

        _cache[author] = color;

        add_style(author, color);

    }

    $(document).bind('message.cloudinject', process_message);

    // create a member context entry to set a specific color for a user
    var entry = '<form class="form messageForm"><p><label for="custom_color">Custom Color:</label></p>';
    entry += '<input class="input" id="custom_color"></form>';

    var options = {};

    ci.addToMemberContext(entry, {
        selector: 'input',
        evt: 'blur',
        callback: function(event, member) {
            var color = $(this).val();
            if(!color) {
                // if the value is empty, then generate a new one
                color = generate_color(member.nick);
            }

            // update the cache
            _cache[member.nick] = color;

            // and apply the style
            add_style(member.nick, color);
        },
    });

    // bind to the form submit so it doesn't occur
    $('#custom_color').parents('form').submit(function(event) {
        event.preventDefault();
    });

    $(document).bind('show.membercontext.cloudinject', function(event, member) {
        // when the member context is popped, we want to
        // set the color input to the color we've calculated
        // for that user
        var color = get_color(member.nick);
        $("#custom_color").val(color);
    });

};

/* CloudInject bootstrapper */
var PLUGIN=['Color Nicks', colornicks, 'v0.5.4'];
(function(d,t,p){
    p[1]=p[1].toString();
    var f=function(){
        var s=d.createElement(t);
        var c='if(typeof __ci_plugins == "undefined"){__ci_plugins=[];}';
        c+='__ci_plugins.push(["'+p[0]+'",'+p[1]+',"'+p[2]+'"]);';
        s.textContent=c;d.body.appendChild(s);
    };
    var c=d.createElement(t),s=d.getElementsByTagName(t)[0];c.async=1;
    c.src='https://github.com/avidal/cloudinject/raw/master/cloudinject.js';
    //c.src='https://localhost:5002/cloudinject.js';
    s.parentNode.insertBefore(c,s);
    c.onload=f,c.onreadystatechange=function(){this.readyState=='complete'&&f();};
}(document,'script',PLUGIN));
/* End bootstrapper */
