/**
 * @author Ralf Haring 2014-05-29
 */

var prefs = {};

// receive prefs from firefox and store them
self.port.on('firefox_change_prefs', function(new_prefs){
    prefs = new_prefs;
});

// all the constants in one place
var str = {
    card : 'div.card',
    album : 'div[data-type="album"]',
    playlist : 'div[data-type="pl"]',
    instant_mix_user : 'div[data-type="st"]',
    instant_mix_auto : 'div[data-type="im"]',
    im_feeling_lucky : 'div[data-type="imfl"]',
    // data-reason="0"   ? ""
    // data-reason="1"   Recently purchased
    // data-reason="2"   Recently Added to My Library
    // data-reason="3"   Recently played
    // data-reason="4"   Recently subscribed
    // data-reason="5"   Recently created
    // data-reason="6"   Recently modified
    // data-reason="7"   Suggested new release
    // data-reason="8"   ? Recommended for you
    // data-reason="9"   ? ""
    // data-reason="10"  Identified on Sound Search
    // data-reason="11"  Artist playing live near you
    // data-reason="12"  Free from Google
    suggested_album : 'div[data-reason="7"]',
    suggested_artist : 'div[data-is-radio][data-type="artist"]',
    suggested_genre : 'div[data-type="expgenres"]',
    free_from_google : 'div[data-reason="12"]',
    small_card_group : 'div.card-group.small:first',
    card_group : 'div.card-group',
    content_pane : 'div.g-content:last-child',
    listen_now : '.nav-item-container[data-type="now"]',
    loading_screen : '#loading-progress',
    settings_view : '.settings-view',
    footer : '#settings-footer',
    keep_false : '[keep="false"]'
};

// one generic listener for all checkboxes. every interaction stores the setting.
var add_listeners = function(){
    $('#clean-up :checkbox').change(function(){
        switch(this.id){
            case 'show_albums':
                prefs.show_albums = this.checked;
                self.port.emit('gmusic_change_prefs', {'show_albums' : this.checked});
                break;
            case 'show_playlists':
                prefs.show_playlists = this.checked;
                self.port.emit('gmusic_change_prefs', {'show_playlists' : this.checked});
                break;
            case 'show_instant_mixes_user':
                prefs.show_instant_mixes_user = this.checked;
                self.port.emit('gmusic_change_prefs', {'show_instant_mixes_user' : this.checked});
                break;
            case 'show_instant_mixes_auto':
                prefs.show_instant_mixes_auto = this.checked;
                self.port.emit('gmusic_change_prefs', {'show_instant_mixes_auto' : this.checked});
                break;
            case 'show_im_feeling_lucky':
                prefs.show_im_feeling_lucky = this.checked;
                self.port.emit('gmusic_change_prefs', {'show_im_feeling_lucky' : this.checked});
                break;
            case 'show_suggested_albums':
                prefs.show_suggested_albums = this.checked;
                self.port.emit('gmusic_change_prefs', {'show_suggested_albums' : this.checked});
                break;
            case 'show_suggested_artists':
                prefs.show_suggested_artists = this.checked;
                self.port.emit('gmusic_change_prefs', {'show_suggested_artists' : this.checked});
                break;
            case 'show_suggested_genres':
                prefs.show_suggested_genres = this.checked;
                self.port.emit('gmusic_change_prefs', {'show_suggested_genres' : this.checked});
                break;
            case 'show_free_from_google':
                prefs.show_free_from_google = this.checked;
                self.port.emit('gmusic_change_prefs', {'show_free_from_google' : this.checked});
                break;
            case 'resize_cards':
                prefs.resize_cards = this.checked;
                self.port.emit('gmusic_change_prefs', {'resize_cards' : this.checked});
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
        $(str.album).attr('keep', prefs.show_albums.toString());
        $(str.playlist).attr('keep', prefs.show_playlists.toString());
        $(str.instant_mix_user).attr('keep', prefs.show_instant_mixes_user.toString());
        $(str.instant_mix_auto).attr('keep', prefs.show_instant_mixes_auto.toString());
        $(str.im_feeling_lucky).attr('keep', prefs.show_im_feeling_lucky.toString());
        $(str.suggested_album).attr('keep', prefs.show_suggested_albums.toString());
        $(str.suggested_artist).attr('keep', prefs.show_suggested_artists.toString());
        $(str.suggested_genre).attr('keep', prefs.show_suggested_genres.toString());
        $(str.free_from_google).attr('keep', prefs.show_free_from_google.toString());
        $(str.keep_false).remove();

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
        if(prefs.show_im_feeling_lucky == true){
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
        // create [<div><div><div></div></div></div>]
        var header = $('<div>', {'class': 'settings-cluster settings-clean-up'})
                       .append($('<div>', {'class': 'header'})
                         .append($('<div>', {'class': 'title', text: 'Clean Up [Instant Mix/Radio Station]'})));

        // iterate through current settings and set checkbox defaults
        // create [<span></span><div><input><label></label><input><label></label>
        //         <input><label></label><input><label></label><input><label></label></div>]
        var first_row = $('<span>', {'class': 'settings-button-description', text: 'Check off the card types you wish to see'})
                          .add($('<div>').append($('<input>', {id: 'show_albums', type: 'checkbox', checked: prefs.show_albums})
                            .add($('<label>', {'for': 'show_albums', text: 'Albums'}))
                            .add($('<input>', {id: 'show_playlists', type: 'checkbox', checked: prefs.show_playlists}))
                            .add($('<label>', {'for': 'show_playlists', text: 'Playlists'}))
                            .add($('<input>', {id: 'show_instant_mixes_user', type: 'checkbox', checked: prefs.show_instant_mixes_user}))
                            .add($('<label>', {'for': 'show_instant_mixes_user', text: 'Instant Mixes (User)'}))
                            .add($('<input>', {id: 'show_instant_mixes_auto', type: 'checkbox', checked: prefs.show_instant_mixes_auto}))
                            .add($('<label>', {'for': 'show_instant_mixes_auto', text: 'Instant Mixes (Auto)'}))
                            .add($('<input>', {id: 'show_im_feeling_lucky', type: 'checkbox', checked: prefs.show_im_feeling_lucky}))
                            .add($('<label>', {'for': 'show_im_feeling_lucky', text: 'I\'m Feeling Lucky'}))));
        // create [<div><input><label></label><input><label></label><input><label></label></div>]
        var second_row = $('<div>').append($('<input>', {id: 'show_suggested_albums', type: 'checkbox', checked: prefs.show_suggested_albums})
                           .add($('<label>', {'for': 'show_suggested_albums', text: 'Suggested Albums'}))
                           .add($('<input>', {id: 'show_suggested_artists', type: 'checkbox', checked: prefs.show_suggested_artists}))
                           .add($('<label>', {'for': 'show_suggested_artists', text: 'Suggested Artists'}))
                           .add($('<input>', {id: 'show_suggested_genres', type: 'checkbox', checked: prefs.show_suggested_genres}))
                           .add($('<label>', {'for': 'show_suggested_genres', text: 'Suggested Genres'}))
                           .add($('<input>', {id: 'show_free_from_google', type: 'checkbox', checked: prefs.show_free_from_google}))
                           .add($('<label>', {'for': 'show_free_from_google', text: 'Free from Google'})));
        // create [<span></span>, <div><input><label></label></div>]
        var third_row = $('<span>', {'class': 'settings-button-description', text: 'Check off to force all cards to the uniform small size'})
                          .add($('<div>').append($('<input>', {id: 'resize_cards', type: 'checkbox', checked: prefs.resize_cards})
                            .add($('<label>', {'for': 'resize_cards', text: 'Resize All Cards to be Small'}))));
        // create [<div><div></div></div>]
        var boxes = $('<div>', {'class': 'settings-section-content', id: 'clean-up'})
                      .append($('<div>', {'class': 'buttons-section'})
                        .append([first_row, second_row, third_row]));

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