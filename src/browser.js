
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

        self.init = function() {
            // See if there's a user profile
            self.user_profile = go.utils.get_user_profile(self.im.msg);
        };

        self.states.add('states_nlp', function (name) {
            if (_.isEmpty(self.im.config.wit)) {
                return self.states.create('states_start_snappy');
            }

            // If we receive first input text that looks like something
            // we should parse then dive straight in
            // NOTE: appending the space after content to make the Regex pass
            //       because it's too early in the day to regex properly and
            //       I'm tired
            if (self.im.msg.content && (self.im.msg.content + ' ').match(/(\w+\s+){3}/)) {
                content = self.im.msg.content;
                return go.utils
                    .get_wit_converse(self.im, self.im.config.wit.token,
                                      content, {
                                          fallback: 'states_nlp_intro'
                                      })
                    .then(function (results) {
                        entities = results.data.entities;
                        dispatch = go.utils.dispatch_nlp(
                            content, entities);
                        return self.states.create(
                            dispatch.name, dispatch.creator_opts);
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

        self.states.add('states_helpdesk', function(name) {

            var out_of_hours_text =
                $("The helpdesk operates from 8am to 4pm Mon to Fri. " +
                  "Responses will be delayed outside of these hrs. In an " +
                  "emergency please go to your health provider immediately.");

            var weekend_public_holiday_text =
                $("The helpdesk is not currently available during weekends " +
                  "and public holidays. In an emergency please go to your " +
                  "health provider immediately.");

            var question =
                $("What is your question for the helpdesk?");

            if (go.utils.is_out_of_hours(self.im.config)) {
                text = out_of_hours_text + '\n\n' + question;
            } else if (go.utils.is_weekend(self.im.config) ||
              go.utils.is_public_holiday(self.im.config)) {
                text = weekend_public_holiday_text + '\n\n' + question;
            } else {
                text = question;
            }

            return new FreeText(name, {
                question: question,
                next: 'states_helpdesk_response',
            });
        });

        self.states.add('states_helpdesk_response', function(name, opts) {
            var out_of_hours_text =
                $("The helpdesk operates from 8am to 4pm Mon to Fri. " +
                  "Responses will be delayed outside of these hrs. In an " +
                  "emergency please go to your health provider immediately.");

            var weekend_public_holiday_text =
                $("The helpdesk is not currently available during weekends " +
                  "and public holidays. In an emergency please go to your " +
                  "health provider immediately.");

            var business_hours_text =
                $("Thank you for your message, it has been captured and you will receive a " +
                "response soon. Kind regards. MomConnect.");

            if (go.utils.is_out_of_hours(self.im.config)) {
                text = (opts.from_wit
                        ? out_of_hours_text + '\n\n' + business_hours_text
                        : business_hours_text);
            } else if (go.utils.is_weekend(self.im.config) ||
              go.utils.is_public_holiday(self.im.config)) {
                text = (opts.from_wit
                        ? weekend_public_holiday_text + '\n\n' + business_hours_text
                        : business_hours_text);
            } else {
                text = business_hours_text;
            }

            return new EndState(name, {
                text: text,
                next: 'states_start'
            });
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

        self.states.add('states_servicerating', function (name, opts) {
            return self.states.create('question_1_friendliness', opts);
        });

        self.states.add('question_1_friendliness', function(name) {
            return new MessengerChoiceState(name, {
                title: 'MomConnect',
                image_url: 'https://www.evernote.com/l/ATmWQI24r-RLoYnAL1eOgbMUFWyFqcPJVpsB/image.jpg',
                question: $('Welcome{{user_name}}. When you signed up, were staff at the facility friendly & helpful?').context({
                    'user_name': (_.isUndefined(self.user_profile.first_name)
                                  ? ''
                                  : ' ' + self.user_profile.first_name)
                }),

                choices: [
                    new Choice('very-satisfied', $('Very Satisfied')),
                    new Choice('satisfied', $('Satisfied')),
                    new Choice('not-satisfied', $('Not Satisfied')),
                    // new Choice('very-unsatisfied', $('Very unsatisfied'))
                ],

                next: 'question_2_waiting_times_feel'
            });
        });

        self.states.add('question_2_waiting_times_feel', function(name) {
            return new MessengerChoiceState(name, {
                title: 'MomConnect',
                question: $('How do you feel about the time you had to wait at the facility?'),

                choices: [
                    new Choice('very-satisfied', $('Very Satisfied')),
                    new Choice('satisfied', $('Satisfied')),
                    new Choice('not-satisfied', $('Not Satisfied')),
                    // new Choice('very-unsatisfied', $('Very unsatisfied'))
                ],

                next: 'question_3_waiting_times_length'
            });
        });

        self.states.add('question_3_waiting_times_length', function(name) {
            return new MessengerChoiceState(name, {
                title: 'MomConnect',
                question: $('How long did you wait to be helped at the clinic?'),

                choices: [
                    new Choice('less-than-an-hour', $('Less than an hour')),
                    new Choice('between-1-and-3-hours', $('Between 1 and 3 hours')),
                    new Choice('more-than-4-hours', $('More than 4 hours')),
                    // new Choice('all-day', $('All day'))
                ],

                next: 'question_4_cleanliness'
            });
        });

        self.states.add('question_4_cleanliness', function(name) {
            return new MessengerChoiceState(name, {
                title: 'MomConnect',
                question: $('Was the facility clean?'),

                choices: [
                    new Choice('very-satisfied', $('Very Satisfied')),
                    new Choice('satisfied', $('Satisfied')),
                    new Choice('not-satisfied', $('Not Satisfied')),
                    // new Choice('very-unsatisfied', $('Very unsatisfied'))
                ],

                next: 'question_5_privacy'
            });
        });

        self.states.add('question_5_privacy', function(name) {
            return new MessengerChoiceState(name, {
                title: 'MomConnect',
                question: $('Did you feel that your privacy was respected by the staff?'),

                choices: [
                    new Choice('very-satisfied', $('Very Satisfied')),
                    new Choice('satisfied', $('Satisfied')),
                    new Choice('not-satisfied', $('Not Satisfied')),
                    // new Choice('very-unsatisfied', $('Very unsatisfied'))
                ],

                next: 'log_servicerating'
            });
        });

        self.states.add('log_servicerating', function(name) {
            return self.im
                .log('Logged service rating: ' + JSON.stringify(self.im.user.answers))
                .then(function() {
                    return self.states.create('servicerating_end');
                });
        });

        self.states.add('servicerating_end', function(name) {
            return new EndState(name, {
                text: $('Thank you{{user_name}}! Rating our service helps us improve it.').context({
                    'user_name': (_.isUndefined(self.user_profile.first_name)
                                  ? ''
                                  : ' ' + self.user_profile.first_name)
                }),
                next: 'states_start'
            });
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
