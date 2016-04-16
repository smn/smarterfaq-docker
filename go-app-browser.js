var go = {};
go;

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
        });
    },

    get_user_profile: function(msg) {
        return msg.helper_metadata.messenger || {};
    },

    dispatch_nlp: function (content, entities, opts) {
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
    },

    train_wit: function () {
        return Q();
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
    var MessengerPaginatedState = go.states.MessengerPaginatedState;
    var MessengerChoiceState = go.states.MessengerChoiceState;
    var ChoiceState = vumigo.states.ChoiceState;

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
                question: $('Hello! Feel free to ask me a question. ' +
                            'If you get stuck just type "!reset" and ' +
                            'we\'ll start over'),
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
                                                title: 'Expand this please',
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
                    title: $(opts.match.question),
                    text: $(opts.match.answer),
                    characters_per_page: 300,
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
                title: 'Service Rating',
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
                title: 'Service Rating',
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
                title: 'Service Rating',
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
                title: 'Service Rating',
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
                title: 'Service Rating',
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
                    return new ChoiceState(name, {
                        question: $(opts.from_wit
                                    ? 'Sorry, could not find a suitable match. Please choose a category:'
                                    : 'Please choose a category:'),
                        choices: choices,
                        characters_per_page: 320,
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
                    return new ChoiceState(name, {
                        question: $(opts.from_wit
                                    ? 'Sorry, could not find a suitable match. Please choose a topic:'
                                    : 'Please choose a topic:'),
                        choices: choices,
                        characters_per_page: 320,
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

                        return new ChoiceState(name, {
                            question: $('Please choose a question:'),
                            choices: choices,
                            characters_per_page: 320,
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

go.init = function() {
    var vumigo = require('vumigo_v02');
    var InteractionMachine = vumigo.InteractionMachine;
    var GoFAQBrowser = go.app.GoFAQBrowser;


    return {
        im: new InteractionMachine(api, new GoFAQBrowser())
    };
}();
