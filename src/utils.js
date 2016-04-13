var _ = require('lodash');
var vumigo = require('vumigo_v02');
var Q = require('q');
var JsonApi = vumigo.http.api.JsonApi;
var PaginatedState = vumigo.states.PaginatedState;
var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;

go.states = {
    MessengerChoiceState: PaginatedChoiceState.extend(function(self, name, opts) {

        opts = _.defaults(opts || {}, {
            helper_metadata: function () {
                // just disable for now
                if(true)
                    return {};

                if (opts.choices.length > 3) {
                    return {};
                }

                var i18n = self.im.user.i18n;
                subtitle = i18n(opts.question);
                buttons = opts.choices.map(function(choice, index) {
                    return {
                        title: i18n(choice.label),
                        payload: {
                            content: (index + 1) + '',
                            in_reply_to: self.im.msg.message_id || null,
                        }
                    };
                });

                return {
                    messenger: {
                        template_type: 'generic',
                        title: i18n(opts.title),
                        subtitle: subtitle,
                        image_url: opts.image_url || '',
                        buttons: buttons
                    }
                };
            }
        });

        PaginatedChoiceState.call(self, name, opts);

    }),

    MessengerPaginatedState: PaginatedState.extend(function (self, name, opts) {

        opts = _.defaults(opts || {}, {
            helper_metadata: function () {
                // just disable for now
                if(true)
                    return {};

                var i18n = self.im.user.i18n;
                var i = self.metadata.page;
                var text = i18n(self.text);
                var choices = _.mapValues(self.choices, i18n);
                var n = self._chars(choices);

                return Q
                    .all([
                        self.page(i, text, n),
                        self.page(i + 1, text, n)])
                    .spread(function(text, more) {
                        return self._determine_choices(i < 1, !more);
                    })
                    .then(function (choices) {
                        return {
                            messenger: {
                                template_type: 'generic',
                                title: i18n(opts.title),
                                subtitle: i18n(opts.text),
                                image_url: opts.image_url || '',
                                buttons: choices.map(function(choice_name, index) {
                                    return {
                                        title: i18n(self.choices[choice_name]),
                                        payload: {
                                            content: '' + (index + 1),
                                            in_reply_to: self.im.msg.message_id || null,
                                        }
                                    };
                                })
                            }
                        };
                    });
            }
        });
        PaginatedState.call(self, name, opts);
    }),

    "silly": "trailing commas"
};

go.utils = {


    // Shared utils lib

    get_today: function(config) {
        var today;
        if (config.testing_today) {
            today = new Date(config.testing_today);
        } else {
            today = new Date();
        }
        return today;
    },

    check_valid_number: function(input){
        // an attempt to solve the insanity of JavaScript numbers
        var numbers_only = new RegExp('^\\d+$');
        if (input !== '' && numbers_only.test(input) && !Number.isNaN(Number(input))){
            return true;
        } else {
            return false;
        }
    },

    check_number_in_range: function(input, start, end){
        return go.utils.check_valid_number(input) && (parseInt(input, 10) >= start) && (parseInt(input, 10) <= end);
    },

    is_true: function(bool) {
        //If is is not undefined and boolean is true
        return (!_.isUndefined(bool) && (bool==='true' || bool===true));
    },

    get_wit_intent: function (im, token, content) {
        var http = new JsonApi(im, {
            headers: {
                'Authorization': ['Bearer ' + token],
                'Content-Type': ['application/json'],
            }
        });
        return http.get('https://api.wit.ai/message?', {
            params: {
                v: '20141022',
                q: content
            }
        });
    },

    get_snappy_faqs: function (im) {
        var http = new JsonApi(im, {
            auth: {
                username: im.config.snappy.username,
                password: 'x'
            }
        });
        return http.get(im.config.snappy.endpoint + 'account/'+im.config.snappy.account_id+'/faqs', {
            data: JSON.stringify(),
            headers: {
                'Content-Type': ['application/json']
            }
        });
    },

    get_snappy_topics: function (im, faq_id) {
        var http = new JsonApi(im, {
          auth: {
            username: im.config.snappy.username,
            password: 'x'
          }
        });
        return http.get(im.config.snappy.endpoint + 'account/'+im.config.snappy.account_id+'/faqs/'+faq_id+'/topics', {
          data: JSON.stringify(),
          headers: {
            'Content-Type': ['application/json']
          }
        });
    },

    get_snappy_topic_content: function(im, faq_id, topic_id) {
        var http = new JsonApi(im, {
          auth: {
            username: im.config.snappy.username,
            password: 'x'
          }
        });
        return http.get(im.config.snappy.endpoint + 'account/'+im.config.snappy.account_id+'/faqs/'+faq_id+'/topics/'+topic_id+'/questions', {
          data: JSON.stringify(),
          headers: {
            'Content-Type': ['application/json']
          }
        });
    },

};
