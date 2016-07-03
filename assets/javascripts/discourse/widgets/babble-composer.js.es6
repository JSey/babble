import { createWidget } from 'discourse/widgets/widget'
import { showSelector } from "discourse/lib/emoji/emoji-toolbar"
import Babble from "../lib/babble"
import template from "../widgets/templates/babble-composer"
import showModal from 'discourse/lib/show-modal'

export default createWidget('babble-composer', {
  tagName: 'div.babble-post-composer',

  defaultState(attrs) {
    return {
      editing:         attrs.isEditing,
      submitDisabled:  attrs.submitDisabled,
      post:            attrs.post,
      topic:           attrs.topic,
      raw:             attrs.raw,
      lastInteraction: new Date(0)
    }
  },

  composerElement() {
    if (this.state.editing) {
      return $('.babble-post-container > .babble-post-composer textarea')
    } else {
      return $('.babble-chat > .babble-post-composer textarea')
    }
  },

  selectEmoji() {
<<<<<<< HEAD
    const self = this,
          outsideClickEvent = self.eventToggleFor('html', 'click', 'close-menu-panel'),
          escKeyEvent = self.eventToggleFor('body', 'keydown', 'discourse-menu-panel');
    outsideClickEvent.off()
    escKeyEvent.off()
    /* mmf
=======
    let $composer = this.composerElement()
>>>>>>> gdpelican/beta
    showSelector({
      container: this.container,
      onSelect: function(emoji) {
        $composer.val(`${$composer.val().trimRight()} :${emoji}:`)
        $composer.focus()
        $('.emoji-modal, .emoji-modal-wrapper').remove()
        return false
      }
    })
    */
    var c = showModal('smileypicker')
    c.setProperties({ composerView: null })
    $('.smileypicker-box img').on('click', function() {
       var title = $(this).attr('title')

<<<<<<< HEAD
       // mmf
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

     $('.emoji-modal-wrapper').on('click', function(event) {
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
=======
    $('.emoji-modal-wrapper').on('click', (e) => { e.stopPropagation() })
    $('body').on('keydown.emoji',         (e) => { e.stopPropagation() })
>>>>>>> gdpelican/beta
  },

  cancel() {
    Babble.editPost(null)
  },

  submit() {
    let $composer = this.composerElement(),
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
    }).then((data) => {
      Babble.handleNewPost(data)
    }).finally(() => {
      this.state.submitDisabled = false
    })
  },

  update(text) {
    var post = this.state.post
    Babble.editPost(null)
    if (post.raw.trim() === text.trim()) { return }
    Babble.set('loadingEditId', post.id)
    this.state.submitDisabled = true
    Discourse.ajax(`/babble/topics/${post.topic_id}/post/${post.id}`, {
      type: 'POST',
      data: { raw: text }
    }).then((data) => {
      Babble.handleNewPost(data)
    }).finally(() => {
      Babble.set('loadingEditId', null)
      this.state.submitDisabled = false
    })
  },

  keyUp(event) {
    this.state.showError = false
    this.checkInteraction()
    if (event.keyCode == 38 &&                               // key pressed is up key
        !this.state.editing &&                               // post is not being edited
        !$(event.target).siblings('.autocomplete').length) { // autocomplete is not active
      let myLastPost = _.last(_.select(this.state.topic.postStream.posts, function(post) {
        return post.user_id == Discourse.User.current().id
      }))
      if (myLastPost) { Babble.editPost(myLastPost) }
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
    const topicId = this.state.topic.id
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

  html() { return template.render(this) }
})
