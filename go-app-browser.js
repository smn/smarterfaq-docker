var go = {};
go;

var _ = require('lodash');
var vumigo = require('vumigo_v02');
var JsonApi = vumigo.http.api.JsonApi;

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
    var PaginatedState = vumigo.states.PaginatedState;
    var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;

    var GoFAQBrowser = App.extend(function(self) {
        App.call(self, 'states_start');
        var $ = self.$;

        // Start - select topic
        self.states.add('states_start', function(name) {
          if(self.im.config.snappy.default_faq) {
            return self.states.create('states_topics', {
                faq_id: self.im.config.snappy.default_faq
            });
          } else {
            return self.states.create('states_faqs');
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
                    return new PaginatedChoiceState(name, {
                        question: $('Welcome to FAQ Browser. Choose FAQ:'),
                        choices: choices,
                        options_per_page: 8,
                        next: function (choice) {
                            return {
                                name: 'states_topics',
                                creator_opts: {
                                    faq_id: choice.value
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
                    return new PaginatedChoiceState(name, {
                        question: $('Welcome to FAQ Browser. Choose topic:'),
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

                        return new PaginatedChoiceState(name, {
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
            return new PaginatedState(name, {
                text: opts.answer,
                characters_per_page: 800,
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
