/**
 * @author Ralf Haring 2014-10-21
 */

var prefs = {};

// receive prefs from firefox and store them
self.port.on('firefox_change_prefs', function(new_prefs){
    prefs = new_prefs;
});

// all the selectors in one place
var selector = {
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
    // data-reason="8"   Recommended for you
    // data-reason="9"   Recommended album
    // data-reason="10"  Identified on Sound Search
    // data-reason="11"  Artist playing live near you
    // data-reason="12"  Free from Google
    suggested_album : 'div[data-reason="9"]',
    suggested_artist : 'div[data-is-radio][data-type="artist"]',
    suggested_genre : 'div[data-type="expgenres"]',
    free_from_google : 'div[data-reason="12"]',
    situations : 'div[data-type="situations"]',
    explore : 'div[data-type="exptop"]',
    small_card_group : 'div.card-group[data-size="small"]:first',
    card_group : 'div.card-group',
    content_pane : 'div.g-content:last-child',
    listen_now : '#nav_collections > [data-type="now"]',
    loading_screen : '#loading-progress',
    settings_view : '.settings-view',
    footer : '#settings-footer',
    keep_false : '[keep="false"]',
    album_pane : '#main',
    album_inner_pane : '.g-content',
    clean_up_section : '#clean-up',
    clean_up_checkboxes : '#clean-up :checkbox',
    all_access : '#music-banner-subtitle'
};

// one generic listener for all checkboxes. every interaction stores the setting.
var add_listeners = function(){
    $(selector.clean_up_checkboxes).change(function(){
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
            case 'show_situations':
                prefs.show_situations = this.checked;
                self.port.emit('gmusic_change_prefs', {'show_situations' : this.checked});
                break;
            case 'resize_cards':
                prefs.resize_cards = this.checked;
                self.port.emit('gmusic_change_prefs', {'resize_cards' : this.checked});
                break;
        }
    });
};

// does the work
var filter_cards = function(mutations){
    // for debugging
    //if(this == refresh_observer && mutations[0].addedNodes.length == 1 &&
    //   mutations[0].addedNodes[0].className == 'cards' && $(selector.card).length > 1){
    //    console.log('refresh');
    //}

    // the all access Listen Now page is structured differently
    var is_all_access = $(selector.all_access).text() == 'All Access';

    if(this == refresh_observer){
        if(is_all_access == true && !(mutations[0].addedNodes.length == 4 &&
           mutations[0].addedNodes[0].className == 'situations-container' &&
           $(selector.listen_now).hasClass('selected'))){
            // bump out when the page refreshes, all access is enabled,
            // and any of the following aren't true:
            // - the four situation rows are what was refreshed
            // - the listen now page is the one being displayed
            // if all of those *are* true or if the initial loading screen observer
            // was the one calling this handler, proceed to filtering the cards
            return;
        }else if(is_all_access == false && !(mutations[0].addedNodes.length == 1 &&
                 mutations[0].addedNodes[0].className == 'cards' && $(selector.card).length > 1 &&
                 $(selector.listen_now).hasClass('selected'))){
            // bump out when the page refreshes, all access is not enabled,
            // and any of the following aren't true:
            // - exactly one new card was added
            // - there is more than one existing card
            // - the listen now page is the one being displayed
            // if all of those *are* true or if the initial loading screen observer
            // was the one calling this handler, proceed to filtering the cards
            return;
        }
    }

    // change all large cards to small
    $(selector.card).attr('data-size', 'small');

    // the suggestions and lucky cards are shaped completely differently in All Access
    // and won't fit into the standard grid
    if(is_all_access == true){
        self.port.emit('gmusic_change_prefs', {'show_im_feeling_lucky' : false});
        self.port.emit('gmusic_change_prefs', {'show_suggested_albums' : false});
        self.port.emit('gmusic_change_prefs', {'show_suggested_artists' : false});
        self.port.emit('gmusic_change_prefs', {'show_suggested_genres' : false});
    }

    // remove those items the user has unchecked
    $(selector.album).attr('keep', prefs.show_albums.toString());
    $(selector.playlist).attr('keep', prefs.show_playlists.toString());
    $(selector.instant_mix_user).attr('keep', prefs.show_instant_mixes_user.toString());
    $(selector.instant_mix_auto).attr('keep', prefs.show_instant_mixes_auto.toString());
    $(selector.im_feeling_lucky).attr('keep', prefs.show_im_feeling_lucky.toString());
    $(selector.suggested_album).attr('keep', prefs.show_suggested_albums.toString());
    $(selector.suggested_artist).attr('keep', prefs.show_suggested_artists.toString());
    $(selector.suggested_genre).attr('keep', prefs.show_suggested_genres.toString());
    $(selector.free_from_google).attr('keep', prefs.show_free_from_google.toString());
    $(selector.situations).attr('keep', prefs.show_situations.toString());
    // the explore card will always be false and always removed
    $(selector.explore).attr('keep', 'false');
    $(selector.keep_false).remove();

    // backup all the cards
    var cards = $(selector.card).toArray();
    // backup a small empty container and change dimensions to hold one album each
    var small_card_group = $(selector.small_card_group).clone();
    // the all access screen doesn't have any card groups so create one
    if(is_all_access){
        small_card_group = $('<div>', {'class': 'card-group', 'data-size' : 'small'});
    }
    $(small_card_group).empty().css('height', '255px');
    // backup clean copies of all existing containers (empty for all access)
    var card_groups = $(selector.card_group).empty().toArray();
    // flush everything that exists
    $(selector.content_pane).empty();

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
            $(imfl_group).css('height', '255px').append(imfl_card).append(card1).append(card2).appendTo(selector.content_pane);
        }else{
            $(card1).attr('data-size', 'large');
            $(imfl_group).append(imfl_card).append(card1).appendTo(selector.content_pane);
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
    if(prefs.resize_cards == true || is_all_access == true){
        while(cards.length > 0){
            small_card_group.clone().append(cards.shift()).appendTo(selector.content_pane);
        }
    }else{
        while(card_groups.length > 0){
            // don't bother looping through all groups if no cards left
            if(cards.length == 0) break;
            var card_group = card_groups.shift();
            var card1 = cards.shift();
            if($(card_group).attr('data-size') == 'large'){
                $(card1).attr('data-size', 'large');
                $(card_group).append(card1).appendTo(selector.content_pane);
            }else{
                var card2 = cards.shift();
                $(card_group).append(card1).append(card2).appendTo(selector.content_pane);
            }
        }
    }
};

// after the loading screen finishes, the structure is there for the other
// observers to attach to
var bind_observers = function(mutations){
    // outer container for the content pane, for monitoring if the settings
    // page is displayed
    var album_pane = $(selector.album_pane)[0];
    if(album_pane){
        settings_observer.observe(album_pane, {childList : true, subtree : true});
    }
    // inner container for the content pane, for monitoring if the album
    // cards are reinserted or otherwise refreshed
    var album_inner_pane = $(selector.album_inner_pane)[0];
    if(album_inner_pane){
        refresh_observer.observe(album_inner_pane, {childList : true});
    }
    //console.log('loading');
    filter_cards(mutations);
};

// if the settings page is opened, insert clean up settings
// between the two "General" and "Manage My Devices" sections
var show_settings = function(){
    //console.log('settings');
    if($(selector.footer).length == 1 && $(selector.clean_up_section).length == 0){
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
                           .add($('<label>', {'for': 'show_free_from_google', text: 'Free from Google'}))
                           .add($('<input>', {id: 'show_situations', type: 'checkbox', checked: prefs.show_situations}))
                           .add($('<label>', {'for': 'show_situations', text: 'Situations'})));
        // create [<span></span>, <div><input><label></label></div>]
        var third_row = $('<span>', {'class': 'settings-button-description', text: 'Check off to force all cards to the uniform small size'})
                          .add($('<div>').append($('<input>', {id: 'resize_cards', type: 'checkbox', checked: prefs.resize_cards})
                            .add($('<label>', {'for': 'resize_cards', text: 'Resize All Cards to be Small'}))));
        // create [<div><div></div></div>]
        var boxes = $('<div>', {'class': 'settings-section-content', id: 'clean-up'})
                      .append($('<div>', {'class': 'buttons-section'})
                        .append([first_row, second_row, third_row]));

        // find "General" div and insert after
        var first_settings_section = $($(selector.settings_view).children()[1]);
        first_settings_section.after(boxes).after(header);

        // sleep for one second to make sure the nodes are properly there.
        // if done immediately, listeners weren't binding correctly.
        setTimeout(add_listeners, 1000);
    }
};

// observers to watch for the settings page and the periodic refreshes
var settings_observer = new MutationObserver(show_settings);
var refresh_observer = new MutationObserver(filter_cards);
// create an observer to do the initial pass
var loading_observer = new MutationObserver(bind_observers);

// use jquery's load bind method. others trigger too early, before the loading screen appears.
$(document).ready(function(){
    // loading progress bar
    var loading_screen = $(selector.loading_screen)[0];
    if(loading_screen){
        loading_observer.observe(loading_screen, {attributes : true, attributeFilter : ['style']});
    }
});
