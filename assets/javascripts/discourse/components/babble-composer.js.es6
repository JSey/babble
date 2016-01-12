import { showSelector } from "discourse/lib/emoji/emoji-toolbar";
import userSearch from "discourse/lib/user-search";

import showModal from 'discourse/lib/show-modal';


export default Ember.Component.extend({
  userSearch: userSearch,
  classNames: ['babble-post-composer'],

  _init: function() {
    this.set('placeholder', Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'))
  }.on('init'),

  _didInsertElement: function() {
    const self = this
    self.$('textarea').autocomplete({
      template: self.container.lookup('template:emoji-selector-autocomplete.raw'),
      key: ":",

      transformComplete(v) {
        if (!v.code) { return }
        return `${v.code}:`
      },

      dataSource(term) {
        return new Ember.RSVP.Promise(resolve => {
          term = term.toLowerCase()
          var options = (term === "" && ['smile', 'smiley', 'wink', 'sunny', 'blush']) ||
                        Discourse.Emoji.translations[`:${term}`] ||
                        Discourse.Emoji.search(term, {maxResults: 5})
          return resolve(options)
        }).then(list => list.map(code => {
          return {code, src: Discourse.Emoji.urlFor(code)};
        }))
      }
    })

    self.$('textarea').autocomplete({
      template: self.container.lookup('template:user-selector-autocomplete.raw'),
      key: '@',
      dataSource(term) {
        return self.userSearch({
          term: term,
          topicId: self.get('topic.id'),
          includeGroups: true,
          exclude: [Discourse.User.current().get('username')]
        })
      },
      transformComplete(v) {
        return v.username || v.name
      }
    })
  }.on('didInsertElement'),

  keyDown: function(event) {
    this.set('showError', false)
    if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.shiftKey)) {
      if (!this.get('submitDisabled')) { // ignore if submit is disabled
        this._actions.submit(this) // submit on enter
      }
      return false
    }
  },

  textValidation: function() {
    var validation = { ok: true }
    if (this.get('processing') || Ember.isEmpty(this.get('text'))) {
      var validation = { failed: true }
    }

    return Discourse.InputValidation.create(validation)
  }.property('text', 'processing'),

  submitDisabled: function() {
    if (this.get('textValidation.failed')) return true
  }.property('textValidation'),

  actions: {
    selectEmoji: function() {
      var self = this
      var c = showModal('smileypicker')      
      c.setProperties({ composerView: self })
      $('.smileypicker-box img').on('click', function() {
        var title = $(this).attr('title')
        self.set('text', (self.get('text') || '').trimRight() + ' :' + title + ':')

        $('.modal, .modal-outer-container').remove()
        $('body, textarea').off('keydown.emoji')
        $('.babble-post-composer textarea').focus()
        return false
      /*var closeMenuPanelHandler = _.find($._data($('html')[0], 'events')['click'], function(e) {
        return e.namespace == 'close-menu-panel'
      }) // sorry mom.

      $('html').off('click.close-menu-panel')
      $('.emoji-modal-wrapper').on('click', function() {
        $('html').on('click.close-menu-panel', closeMenuPanelHandler.handler)
      })

      showSelector({
        container: this.container,
        onSelect: function(emoji) {
          self.set('text', (self.get('text') || '').trimRight() + ' :' + emoji + ':')

          $('.emoji-modal, .emoji-modal-wrapper').remove()
          $('.babble-post-composer textarea').focus()
          $('html').on('click.close-menu-panel', closeMenuPanelHandler.handler)
          return false
        }*/
      })
    },

    submit: function(context) {
      var self = context || this;

      if (self.get('text').trim() === "") {
        self.set('showError', true)
        self.set('text', '')
        return
      }

      self.set('processing', true)
      Discourse.ajax("/babble/topics/" + self.get('topic.id') + "/post", {
        type: 'POST',
        data: { raw: self.get('text').trim() }
      })
      .then(Discourse.Babble.handleNewPost)
      .finally(function() {
        self.set('text', '')
        self.set('processing', false)
      });
    }
  }

});
