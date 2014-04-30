/**
 * @author Ralf Haring 2014-04-30
 */

var prefs = {};

// receive prefs from firefox and store them
self.port.on("firefox_change_prefs", function(new_prefs){
    prefs = new_prefs;
});

// all the constants in one place
var str = {
    card : 'div.card',
    // hardcoding English probably breaks localized versions...
    // still don't know if "sal" has been completely retired...
    //album : 'div[data-type="album"]',
    album : 'div[data-type="album"]:not(:contains("Suggested new release"))',
    playlist : 'div[data-type="pl"]',
    //suggested_album : 'div[data-type="sal"]',
    suggested_album : 'div[data-type]:contains("Suggested new release")',
    instant_mix_auto : 'div[data-type="im"]',
    instant_mix_user : 'div[data-type="st"]',
    im_feeling_lucky : 'div[data-type="imfl"]',
    suggested_artist : 'div[data-is-radio][data-type="artist"]',
    suggested_genre : 'div[data-type="expgenres"]',
    small_card_group : 'div.card-group.small:first',
    card_group : 'div.card-group',
    content_pane : 'div.g-content:last-child',
    listen_now : '#nav_collections li[data-type="now"]',
    loading_screen : '#loading-progress',
    settings_view : '.settings-view',
    footer : '#settings-footer'
};

// one generic listener for all checkboxes. every interaction stores the setting.
var add_listeners = function(){
    $('#clean-up :checkbox').change(function(){
        switch(this.id){
            case 'show-playlists':
                prefs.playlist = this.checked;
                self.port.emit("gmusic_change_prefs", {'playlist' : this.checked});
                break;
            case 'show-instant-mixes-auto':
                prefs.instant_mix_auto = this.checked;
                self.port.emit("gmusic_change_prefs", {'instant_mix_auto' : this.checked});
                break;
            case 'show-instant-mixes-user':
                prefs.instant_mix_user = this.checked;
                self.port.emit("gmusic_change_prefs", {'instant_mix_user' : this.checked});
                break;
            case 'show-suggested-albums':
                prefs.suggested_album = this.checked;
                self.port.emit("gmusic_change_prefs", {'suggested_album' : this.checked});
                break;
            case 'show-albums':
                prefs.album = this.checked;
                self.port.emit("gmusic_change_prefs", {'album' : this.checked});
                break;
            case 'show-im-feeling-lucky':
                prefs.im_feeling_lucky = this.checked;
                self.port.emit("gmusic_change_prefs", {'im_feeling_lucky' : this.checked});
                break;
            case 'resize-cards':
                prefs.resize_cards = this.checked;
                self.port.emit("gmusic_change_prefs", {'resize_cards' : this.checked});
                break;
            case 'show-suggested-artists':
                prefs.suggested_artist = this.checked;
                self.port.emit("gmusic_change_prefs", {'suggested_artist' : this.checked});
                break;
            case 'show-suggested-genres':
                prefs.suggested_genre = this.checked;
                self.port.emit("gmusic_change_prefs", {'suggested_genre' : this.checked});
                break;
        }
    });
};

// does the work
var remove_mixes = function(){
    // only proceed if in the Listen Now tab or if initial loading has just finished
    if((this == observer && $(str.listen_now).hasClass('selected')) ||
       (this == loading_observer && $(str.loading_screen).hasClass('fadeout'))){
        // change all large cards to small
        $(str.card).removeClass('large').addClass('small');

        // remove those items the user has unchecked
        if(prefs.album == false){
            $(str.album).remove();
        }
        if(prefs.playlist == false){
            $(str.playlist).remove();
        }
        if(prefs.instant_mix_auto == false){
            $(str.instant_mix_auto).remove();
        }
        if(prefs.instant_mix_user == false){
            $(str.instant_mix_user).remove();
        }
        if(prefs.suggested_album == false){
            $(str.suggested_album).remove();
        }
        if(prefs.im_feeling_lucky == false){
            $(str.im_feeling_lucky).remove();
        }
        if(prefs.suggested_artist == false){
            $(str.suggested_artist).remove();
        }
        if(prefs.suggested_genre == false){
            $(str.suggested_genre).remove();
        }

        // backup all the cards
        var cards = $(str.card).toArray();
        // backup a small empty container and change dimensions to hold one album each
        var small_card_group = $(str.small_card_group).clone();
        $(small_card_group).empty().css('height', '255px');
        // backup clean copies of all existing containers
        var card_groups = $(str.card_group).empty().toArray();
        // flush everything that exists
        $(str.content_pane).empty();

        // deal with the I'm Feeling Lucky container as a one-off first
        if(prefs.im_feeling_lucky == true){
            // pop off the relevant objects
            var imfl_group = card_groups.shift();
            var imfl_card = cards.shift();
            var card1 = cards.shift();

            // if cards are also to be smallified, pop off one more card.
            // then fix all the attributes as appropriate and append.
            if(prefs.resize_cards == true){
                $(card1).css('height', '160px');
                var card2 = $(cards.shift()).css('height', '160px');
                $(imfl_group).css('height', '255px').append(imfl_card).append(card1).append(card2).appendTo(str.content_pane);
            }else{
                $(card1).removeClass('small').addClass('large');
                $(imfl_group).append(imfl_card).append(card1).appendTo(str.content_pane);
            }
        }else{
            // chop off the ifl-group class for the case where we don't want to show it
            // and we don't want to smallify the cards. (if smallifying, the card_groups
            // array is ignored)
            $(card_groups[0]).removeClass('ifl-group');
        }

        // loop through different arrays depending on whether cards should be smallified.
        // if yes, for each card wrap a small card group around it and append.
        // else, for each existing card group, pop off relevant cards and fix them, then append.
        if(prefs.resize_cards == true){
            while(cards.length > 0){
                small_card_group.clone().append(cards.shift()).appendTo(str.content_pane);
            }
        }else{
            while(card_groups.length > 0){
                // don't bother looping through all groups if no cards left
                if(cards.length == 0) break;
                var card_group = card_groups.shift();
                var card1 = cards.shift();
                if($(card_group).hasClass('large')){
                    $(card1).removeClass('small').addClass('large');
                    $(card_group).append(card1).appendTo(str.content_pane);
                }else{
                    var card2 = cards.shift();
                    $(card_group).append(card1).append(card2).appendTo(str.content_pane);
                }
            }
        }
    }else if(this == observer && $(str.footer).length == 1){
        // if the settings page is opened, insert clean up settings
        // between the two "General" and "Manage My Devices" sections

        // clean up header
        var header = '<div class="settings-cluster settings-clean-up"><div class="header"><div class="title">Clean Up [Instant Mix/Radio Station]</div></div></div>';
        // iterate through current settings and set checkbox defaults
        var boxes = '<div class="settings-section-content" id="clean-up"><div class="buttons-section"><span class="settings-button-description">Check off the card types you wish to see</span><div><input id="show-albums" type="checkbox"';
        if(prefs.album){ boxes += ' checked'; }
        boxes += '><label for="show-albums">Albums</label><input id="show-playlists" type="checkbox"';
        if(prefs.playlist){ boxes += ' checked'; }
        boxes += '><label for="show-playlists">Playlists</label><input id="show-instant-mixes-user" type="checkbox"';
        if(prefs.instant_mix_user){ boxes += ' checked'; }
        boxes += '><label for="show-instant-mixes-user">Instant Mixes (User)</label><input id="show-instant-mixes-auto" type="checkbox"';
        if(prefs.instant_mix_auto){ boxes += ' checked'; }
        boxes += '><label for="show-instant-mixes-auto">Instant Mixes (Auto)</label><input id="show-im-feeling-lucky" type="checkbox"';
        if(prefs.im_feeling_lucky){ boxes += ' checked'; }
        boxes += '><label for="show-im-feeling-lucky">I\'m Feeling Lucky</label></div><div><input id="show-suggested-albums" type="checkbox"';
        if(prefs.suggested_album){ boxes += ' checked'; }
        boxes += '><label for="show-suggested-albums">Suggested Albums</label><input id="show-suggested-artists" type="checkbox"';
        if(prefs.suggested_artist){ boxes += ' checked'; }
        boxes += '><label for="show-suggested-artists">Suggested Artists</label><input id="show-suggested-genres" type="checkbox"';
        if(prefs.suggested_genre){ boxes += ' checked'; }
        boxes += '><label for="show-suggested-genres">Suggested Genres</label></div><span class="settings-button-description">Check off to force all cards to the uniform small size</span><div><input id="resize-cards" type="checkbox"';
        if(prefs.resize_cards){ boxes += ' checked'; }
        boxes += '><label for="resize-cards">Resize All Cards to be Small</label></div></div></div>';

        // find "General" div and insert after
        var first_settings_section = $($(str.settings_view).children()[1]);
        first_settings_section.after(boxes).after(header);

        // sleep for one second to make sure the nodes are properly there.
        // if done immediately, listeners weren't binding correctly.
        setTimeout(add_listeners, 1000);
    }
};

// container for all albums, instant mixes, and playlists
var album_pane = $('#main')[0];
// create an observer to delete the instant mixes
// watch for new children to be added
var observer = new MutationObserver(remove_mixes);
if(album_pane){
    observer.observe(album_pane, {childList : true});
}

// loading progress bar
var loading_screen = $(str.loading_screen)[0];
// create an observer to do the initial pass
// watch for page to finish loading
var loading_observer = new MutationObserver(remove_mixes);
if(loading_screen){
    loading_observer.observe(loading_screen, {attributes : true, attributeFilter : ['class']});
}