import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import { showSelector } from "discourse/lib/emoji/emoji-toolbar";
import showModal from 'discourse/lib/show-modal';
import Babble from "../lib/babble";

export default createWidget('babble-composer', {
  tagName: 'div.babble-post-composer',

  defaultState(attrs) {
    return {
      editing: attrs.isEditing,
      submitDisabled: attrs.submitDisabled,
      post: attrs.post,
      topic: attrs.topic,
      lastInteraction: new Date(0)
    }
  },

  selectEmoji() {
    const self = this,
          outsideClickEvent = self.eventToggleFor('html', 'click', 'close-menu-panel'),
          escKeyEvent = self.eventToggleFor('body', 'keydown', 'discourse-menu-panel');
    outsideClickEvent.off()
    escKeyEvent.off()
    /*
    showSelector({
      container: self.container,
      onSelect: function(emoji) {
        var $composer = $('.babble-post-composer textarea'),
            text = $composer.val();
        text = text.trimRight() + ' :' + emoji + ':'
        $composer.val(text)
        $('.emoji-modal, .emoji-modal-wrapper').remove()
        $composer.focus()
        outsideClickEvent.on()
        escKeyEvent.on()
        return false
      }
    })
    */
    var c = showModal('smileypicker')
    c.setProperties({ composerView: self })
    $('.smileypicker-box img').on('click', function() {
      var title = $(this).attr('title')

      var $composer = $('.babble-post-composer textarea'),
          text = $composer.val();
      text = text.trimRight() + ' :' + title + ':'
      $composer.val(text)
      $('.emoji-modal, .emoji-modal-wrapper').remove()
      $composer.focus()
      outsideClickEvent.on()
      escKeyEvent.on()

      $('.modal, .modal-outer-container').remove()
      $('body, textarea').off('keydown.emoji')
      $('.babble-post-composer textarea').focus()
      return false
    })

    ('.emoji-modal-wrapper').on('click', function(event) {
      outsideClickEvent.on()
      escKeyEvent.on()
      event.stopPropagation()
    })
    $('body').on('keydown.emoji', function(event) {
      if (event.which != 27) { return; }
      outsideClickEvent.on()
      escKeyEvent.on()
      event.stopPropagation()
    })
  },

  cancel() {
    Babble.set('editingPostId', null)
  },

  eventToggleFor(selector, event, namespace) {
    let elem = $(selector)
    let handler = _.find($._data(elem[0], 'events')[event], function(e) {
      return e.namespace == namespace
    })
    return {
      element: elem,
      handler: handler,
      on: function() { elem.on(`${event}.${namespace}`, handler)},
      off: function() { elem.off(`${event}.${namespace}`) }
    }
  },

  submit() {
    var $composer = $('.babble-post-composer textarea'),
        text = $composer.val();
    $composer.val('')
    if (!text) { return; }

    if (this.state.editing) {
      this.update(text)
    } else {
      this.create(text)
    }
  },

  create(text) {
    var topic = this.state.topic
    this.state.submitDisabled = true
    Babble.stagePost(text)
    Discourse.ajax(`/babble/topics/${topic.id}/post`, {
      type: 'POST',
      data: { raw: text }
    }).finally(() => {
      this.state.submitDisabled = false
      Babble.toggleProperty('queueRerender')
    })
  },

  update(text) {
    var post = this.state.post
    Babble.set('editingPostId', null)
    Babble.set('loadingEditId', post.id)
    this.state.submitDisabled = true
    this.scheduleRerender()
    Discourse.ajax(`/babble/topics/${post.topic_id}/post/${post.id}`, {
      type: 'POST',
      data: { raw: text }
    }).finally(() => {
      Babble.set('loadingEditId', null)
      Babble.toggleProperty('queueRerender')
      this.state.submitDisabled = false
    })
  },

  keyUp(event) {
    this.state.showError = false
    this.checkInteraction()
    if (event.keyCode == 38 && !this.state.editing) {
      let myLastPost = _.last(_.select(this.state.topic.postStream.posts, function(post) {
        return post.user_id == Discourse.User.current().id
      }))
      if (myLastPost) { Babble.set('editingPostId', myLastPost.id) }
      return false
    }

    if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.shiftKey)) {
      event.preventDefault()
      if (!this.state.submitDisabled) { // ignore if submit is disabled
        this.submit(this) // submit on enter
      }
      return false
    }
  },

  checkInteraction() {
    const topicId = this.state.post.topic_id
    const lastInteraction = this.state.lastInteraction
    const now = new Date
    if (now - lastInteraction > 5000) {
      this.state.lastInteraction = now
      Discourse.ajax(`/babble/topics/${topicId}/notification`, {
        type: 'POST',
        data: {state: 'editing'}
      })
    }
  },

  eventToggleFor(selector, event, namespace) {
    let elem = $(selector)
    let handler = _.find($._data(elem[0], 'events')[event], function(e) {
      return e.namespace == namespace
    })
    return {
      element: elem,
      handler: handler,
      on: function() {  elem.on(`${event}.${namespace}`, handler) },
      off: function() { elem.off(`${event}.${namespace}`) }
    }
  },

  html(attrs){
    return [
      h('div.babble-composer-wrapper', [
        h('textarea', {attributes: {
          placeholder: Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'),
          rows:        this.state.editing ? 1 : 3,
          disabled:    this.state.submitDisabled
        }}),
        this.attach('button', {
          className: 'emoji',
          icon: 'smile-o',
          action: 'selectEmoji'
        })
      ]),
      this.attach('button', {
        className: 'btn btn-primary btn-submit pull-right',
        action: 'submit',
        label: 'babble.send',
        attributes: { disabled: this.state.submitDisabled }
      })
    ]
  }
})
