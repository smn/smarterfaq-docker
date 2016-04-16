var go = {};
go;

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
        });
    },

    dispatch_nlp: function (content, entities) {
        if (!_.isEmpty(entities.search_category)) {
            return {
                name: 'states_search',
                creator_opts: {
                    entity: entities.search_category[0].value,
                    content: content
                }
            };
        }
        return {
            name: 'states_fallback',
            creator_opts: {
                from_wit: true
            }
        };
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
                                    "query": opts.topic,
                                    "boost": 1.2
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
            return im
                .log(results)
                .then(function () {
                    return results;
                });
        })
        .then(function (results) {
            return results.data.hits.hits;
        });
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


go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;
    var PaginatedState = vumigo.states.PaginatedState;
    var MessengerPaginatedState = go.states.MessengerPaginatedState;
    var MessengerChoiceState = go.states.MessengerChoiceState;

    var GoFAQBrowser = App.extend(function(self) {
        App.call(self, 'states_nlp');
        var $ = self.$;

        self.states.add('states_nlp', function (name) {
            if (_.isEmpty(self.im.config.wit)) {
                return self.states.create('states_start');
            }

            return new FreeText(name, {
                question: $('Hello! What question can I help you with?'),
                next: function (content) {
                    return go.utils
                        .get_wit_converse(self.im, self.im.config.wit.token, content)
                        .then(function (results) {
                            entities = results.data.entities;
                            return go.utils.dispatch_nlp(
                                content, entities);
                        });
                }
            });
        });

        self.states.add('states_search', function (name, opts) {
            return go.utils
                .search_topics(self.im, self.im.config.es, {
                    topic: opts.entity,
                    content: opts.content
                })
                .then(function (matches) {
                    return new PaginatedState(name, {
                        text: matches[0]._source.answer,
                        characters_per_page: 320,
                        more: $('More'),
                        back: $('Back'),
                        exit: $('Exit'),
                        next: function() {
                            return {
                                name: 'states_end',
                            };
                        }
                    });
                });
        });

        self.states.add('states_nlp_answer', function (name, opts) {
            return new EndState(name, {
                text: opts.wit_metadata,
                next :'states_nlp',
            });
        });

        // fallback state for when NLP fails us
        self.states.add('states_fallback', function (name, opts) {
            return self.states.create('states_start', opts);
        });

        // Start - select topic
        self.states.add('states_start', function(name, opts) {
          if(self.im.config.snappy.default_faq) {
            return self.states.create('states_topics', {
                faq_id: self.im.config.snappy.default_faq,
                faq_label: self.im.config.snappy.default_label,
                from_wit: opts.from_wit,
            });
          } else {
            return self.states.create('states_faqs', {
                from_wit: opts.from_wit,
            });
          }
        });

        self.states.add('states_faqs', function (name, opts) {
            return go.utils.get_snappy_faqs(self.im)
                .then(function (response) {
                    if(typeof response.data.error !== 'undefined') {
                        return error;
                    } else {
                        return _.sortBy(response.data, function (d) {
                                return parseInt(d.order, 10);
                            })
                            .map(function (d) {
                                return new Choice(d.id, d.title);
                            });
                    }
                })
                .then(function (choices) {
                    return new MessengerChoiceState(name, {
                        title: $('Welcome to the FAQ Browser!'),
                        question: $(opts.from_wit
                                    ? 'Sorry, could not find a suitable match. Please choose a category:'
                                    : 'Please choose a category:'),
                        image_url: 'https://www.evernote.com/l/ATmWQI24r-RLoYnAL1eOgbMUFWyFqcPJVpsB/image.jpg',
                        choices: choices,
                        options_per_page: 8,
                        next: function (choice) {
                            return {
                                name: 'states_topics',
                                creator_opts: {
                                    faq_id: choice.value,
                                    faq_label: choice.label,
                                }
                            };
                        }
                    });
                });
        });

        self.states.add('states_topics', function (name, opts) {
            return go.utils.get_snappy_topics(self.im, opts.faq_id)
                .then(function(response) {
                    if (typeof response.data.error  !== 'undefined') {
                        // TODO Throw proper error
                        return error;
                    } else {
                        return _.sortBy(response.data, function (d) {
                                return parseInt(d.order, 10);
                            })
                            .map(function(d) {
                                return new Choice(d.id, d.topic);
                            });
                    }
                })
                .then(function(choices) {
                    return new MessengerChoiceState(name, {
                        title: $('Welcome to the FAQ Browser!'),
                        question: $(opts.from_wit
                                    ? 'Sorry, could not find a suitable match. Please choose a topic:'
                                    : 'Please choose a topic:'),
                        choices: choices,
                        options_per_page: 8,
                        next: function(choice) {
                            return {
                                name: 'states_questions',
                                creator_opts: {
                                    faq_id: opts.faq_id
                                }
                            };
                        }
                    });
                });
        });

        // Show questions in selected topic
        self.states.add('states_questions', function(name, opts) {
            return go.utils.get_snappy_topic_content(self.im,
                        opts.faq_id, self.im.user.answers.states_topics)
                .then(function(response) {
                    if (typeof response.data.error  !== 'undefined') {
                        // TODO Throw proper error
                        return error;
                    } else {
                        var choices = _.sortBy(response.data, function (d) {
                                return parseInt(d.pivot.order, 10);
                            })
                            .map(function(d) {
                                return new Choice(d.id, d.question);
                            });

                        return new MessengerChoiceState(name, {
                            title: $('Welcome to the FAQ Browser!'),
                            question: $('Please choose a question:'),
                            choices: choices,
                            options_per_page: null,
                            next: function(choice) {
                                var question_id = choice.value;
                                var index = _.findIndex(response.data, { 'id': question_id});
                                var answer = response.data[index].answer.trim();
                                return {
                                    name: 'states_answers',
                                    creator_opts: {
                                        answer: answer
                                    }
                                };
                            }
                        });
                    }
                });
        });

        // Show answer to selected question
        self.states.add('states_answers', function(name, opts) {
            return new MessengerPaginatedState(name, {
                title: $('Welcome to the FAQ Browser!'),
                text: opts.answer,
                characters_per_page: 320,
                more: $('More'),
                back: $('Back'),
                exit: $('Exit'),
                next: function() {
                    return {
                        name: 'states_end',
                        creator_opts: {
                            answer: opts.answer
                        }
                    };
                }
            });
        });

        // End
        self.states.add('states_end', function(name, opts) {
            return new EndState(name, {
                text: $('Thank you and visit again!'),
                next: 'states_start'
            });
        });

    });

    return {
        GoFAQBrowser: GoFAQBrowser
    };
}();

go.init = function() {
    var vumigo = require('vumigo_v02');
    var InteractionMachine = vumigo.InteractionMachine;
    var GoFAQBrowser = go.app.GoFAQBrowser;


    return {
        im: new InteractionMachine(api, new GoFAQBrowser())
    };
}();
