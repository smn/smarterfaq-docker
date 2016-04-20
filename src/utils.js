var _ = require('lodash');
var vumigo = require('vumigo_v02');
var Q = require('q');
var JsonApi = vumigo.http.api.JsonApi;
var PaginatedState = vumigo.states.PaginatedState;
var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;
var moment = require('moment');

go.states = {
    MessengerChoiceState: PaginatedChoiceState.extend(function(self, name, opts) {

        opts = _.defaults(opts || {}, {
            helper_metadata: function () {
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
                        elements: [{
                            title: i18n(opts.title),
                            subtitle: subtitle,
                            image_url: opts.image_url || '',
                            buttons: buttons
                        }]
                    }
                };
            }
        });

        PaginatedChoiceState.call(self, name, opts);

    }),

    MessengerPaginatedState: PaginatedState.extend(function (self, name, opts) {

        opts = _.defaults(opts || {}, {
            helper_metadata: function () {

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
                                template_type: 'button',
                                text: i18n(self.page(i, text, n)),
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

    is_questionish: function (content) {
        return content && (content + ' ').match(/(\w+\s+){3}/);
    },

    // Shared utils lib
    is_out_of_hours: function(config) {
        var today = go.utils.get_today(config);
        var moment_today = moment.utc(today);
        // get business hours from config, -2 for utc to local time conversion
        var opening_time = Math.min.apply(null, config.helpdesk_hours) - 2;
        var closing_time = Math.max.apply(null, config.helpdesk_hours) - 2;
        return (moment_today.hour() < opening_time || moment_today.hour() >= closing_time);
    },

    is_weekend: function(config) {
        var today = go.utils.get_today(config);
        var moment_today = moment.utc(today);
        return moment_today.format('dddd') === 'Saturday' ||
          moment_today.format('dddd') === 'Sunday';
    },

    is_public_holiday: function(config) {
        var today = go.utils.get_today(config);
        var moment_today = moment.utc(today);
        var date_as_string = moment_today.format('YYYY-MM-DD');
        return _.contains(config.public_holidays, date_as_string);
    },

    get_today: function(config) {
        var today;
        if (config.testing_today) {
            today = moment(config.testing_today);
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

    get_wit_converse: function (im, token, content) {
        var http = new JsonApi(im, {
            headers: {
                'Authorization': ['Bearer ' + token],
                'Content-Type': ['application/json'],
            }
        });
        return http.post('https://api.wit.ai/converse', {
            params: {
                v: '20160330',
                session_id: im.user.addr,
                q: content
            }
        }).then(function (response) {
            return im
                .log('WIT q: ' + content)
                .then(function () {
                    return im.log('WIT response: ' + JSON.stringify(response.data));
                })
                .then(function () {
                    return response;
                });
        });
    },

    get_user_profile: function(msg) {
        return msg.helper_metadata.messenger || {};
    },

    dispatch_nlp: function (im, content, entities, opts) {
        return im
            .log('WIT entities: ' + JSON.stringify(entities))
            .then(function () {
                opts = _.defaults(opts || {}, {
                    fallback: 'states_fallback'
                });

                if (!_.isEmpty(entities.action) && entities.action[0].value == 'helpdesk') {
                    return {
                        name: 'states_helpdesk',
                        creator_opts: {
                            question: content
                        }
                    };
                }

                if (!_.isEmpty(entities.action) && entities.action[0].value == 'servicerating') {
                    return {
                        name: 'states_servicerating',
                        creator_opts: {
                            question: content
                        }
                    };
                }

                if (!_.isEmpty(entities.search_category)) {
                    return {
                        name: 'states_search',
                        creator_opts: {
                            entities: {
                                search_category: entities.search_category[0].value,
                                search_topic: entities.search_topic[0].value,
                            },
                            question: content
                        }
                    };
                }

                return {
                    name: opts.fallback,
                    creator_opts: {
                        from_wit: true,
                        question: content,
                    }
                };
            })
            .then(function (data) {
                return im
                    .log('NLP dispatch:' + JSON.stringify(data))
                    .then(function() {
                        return data;
                    });
            });
    },

    search_topics: function (im, es, opts) {
        var http = new JsonApi(im, {
            headers: {
                'Content-Type': ['application/json'],
            }
        });
        return http.get(es.endpoint, {
            data: {
                "query": {
                    "bool": {
                        "should": [{
                            "match": {
                                "topic": {
                                    "query": opts.search_category,
                                    "boost": 1.2
                                }
                            }
                        }, {
                            "match": {
                                "answer": {
                                    "query": opts.search_topic,
                                    "boost": 2,
                                }
                            }
                        }, {
                            "match": {
                                "answer": {
                                    "query": opts.content,
                                    "boost": 1
                                }
                            }
                        }]
                    }
                }
            }
        })
        .then(function (results) {
            return results.data.hits.hits;
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
