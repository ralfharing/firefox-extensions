/**
 * @author Ralf Haring 2014-05-11
 */

// import the required apis
var page_mod = require('sdk/page-mod');
var self = require('sdk/self');

// listen for the google music page
page_mod.PageMod({
    include: 'https://play.google.com/music/*',
    contentScriptFile: [self.data.url('jquery-2.1.0.min.js'), self.data.url('clean_up_google_music.js')],
    // set up the channel for firefox simple-prefs and the in-app checkboxes to sync
    onAttach: function(worker){
        function firefox_change_prefs(){
            // sending prefs from firefox to the page
            var prefs = require('sdk/simple-prefs').prefs;
            worker.port.emit('firefox_change_prefs', prefs);
        }
        // listen for changes in firefox
        require('sdk/simple-prefs').on('', firefox_change_prefs);
        // always send preferences at the beginning
        firefox_change_prefs();

        function gmusic_change_prefs(new_prefs){
            // receiving prefs from google music
            Object.keys(new_prefs).map(function(key, index){
                // there will only be one pref at a time, but it's
                // dynamic so need to map (or use a for loop)
                require('sdk/simple-prefs').prefs[key] = new_prefs[key];
            });
        }
        // listen to for changes in google music
        worker.port.on('gmusic_change_prefs', gmusic_change_prefs);
    }
});