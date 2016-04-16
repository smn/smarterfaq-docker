
go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;
    var MessengerPaginatedState = go.states.MessengerPaginatedState;
    var MessengerChoiceState = go.states.MessengerChoiceState;

    var GoFAQBrowser = App.extend(function(self) {
        App.call(self, 'states_nlp');
        var $ = self.$;

        self.states.add('states_nlp', function (name) {
            if (_.isEmpty(self.im.config.wit)) {
                return self.states.create('states_start_snappy');
            }

            // If we receive first input text that looks like something
            // we should parse then dive straight in
            if (self.im.msg.content && self.im.msg.content.match(/\w{5,}/i)) {
                content = self.im.msg.content;
                return go.utils
                    .get_wit_converse(self.im, self.im.config.wit.token,
                                      content, {
                                          fallback: 'states_nlp_intro'
                                      })
                    .then(function (results) {
                        entities = results.data.entities;
                        return go.utils.dispatch_nlp(
                            content, entities);
                    });
            }
            return self.states.create('states_nlp_intro');
        });

        self.states.add('states_nlp_intro', function (name) {
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
                    search_category: opts.entities.search_category,
                    search_topic: opts.entities.search_topic,
                    content: opts.question
                })
                .then(function (matches) {
                    return new FreeText(name, {
                        question: matches[0]._source.answer.substring(0, 320-1),
                        helper_metadata: function () {
                            return {
                                'messenger': {
                                    template_type: 'generic',
                                    elements: matches.map(function (match, index) {
                                        return {
                                            title: match._source.question.substring(0, 45-4) + '...',
                                            subtitle: match._source.answer.substring(0, 80-4) + '...',
                                            buttons: [{
                                                title: 'This looks correct',
                                                payload: {
                                                    content: (index + 1 + ''),
                                                }
                                            }]
                                        };
                                    })
                                }
                            };
                        },
                        next: function(content) {
                            return {
                                name: 'states_search_answer',
                                creator_opts: {
                                    match: matches[parseInt(content) - 1]._source
                                }
                            };
                        }
                    });
                });
        });

        self.states.add('states_search_answer', function (name, opts) {
            answer = opts.match.answer;
            if(answer.length > 320) {
                return new MessengerPaginatedState(name, {
                    text: $(opts.match.answer),
                    characters_per_page: 320,
                    next: function (choice) {
                        return {
                            name: 'states_end',
                        };
                    }

                });
            } else {
                return new EndState(name, {
                    text: opts.match.answer,
                    next :'states_nlp',
                });
            }
        });

        // fallback state for when NLP fails us
        self.states.add('states_fallback', function (name, opts) {
            return self.states.create('states_start_snappy', opts);
        });

        // Start - select topic
        self.states.add('states_start_snappy', function(name, opts) {
          if(self.im.config.snappy.default_faq) {
            return self.states.create('states_topics', {
                faq_id: self.im.config.snappy.default_faq,
                faq_label: self.im.config.snappy.default_label,
                from_wit: opts.from_wit,
                question: opts.question,
            });
          } else {
            return self.states.create('states_faqs', {
                from_wit: opts.from_wit,
                question: opts.question,
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
                                    question: opts.question,
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
                                    faq_id: opts.faq_id,
                                    category: opts.faq_label,
                                    topic: choice.value,
                                    question: opts.question,
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
                                        question: opts.question,
                                        answer: answer,
                                        category: opts.category,
                                        topic: opts.topic,
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
                exit: $('I\'ve read enough'),
                next: function() {
                    return {
                        name: 'states_end',
                        creator_opts: {
                            category: opts.category,
                            topic: opts.topic,
                            question: opts.question
                        }
                    };
                }
            });
        });

        // End
        self.states.add('states_end', function(name, opts) {
            return new EndState(name, {
                text: $('Thank you and visit again!'),
                next: 'states_nlp'
            });
        });

    });

    return {
        GoFAQBrowser: GoFAQBrowser
    };
}();
