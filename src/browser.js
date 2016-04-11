
go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;
    var MessengerPaginatedState = go.states.MessengerPaginatedState;
    // var MessengerChoiceState = go.states.MessengerChoiceState;
    var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;

    var GoFAQBrowser = App.extend(function(self) {
        App.call(self, 'states_start');
        var $ = self.$;

        // Start - select topic
        self.states.add('states_start', function(name) {
            return new FreeText(name, {
                question: $([
                    'Hi there and welcome to MomConnect. ',
                    'Please ask your question and we will try and find the most relevant answer. ',
                ].join('\n')),
                next: 'states_analyse'
            });
        });

        self.states.add('states_analyse', function (name) {
            answers = self.im.user.answers;
            return go.utils
                .get_robby_results(self.im, {
                    bucket: 'categories',
                    content: answers.states_analyse,
                })
                .then(function (results) {
                    return _.sortBy(results, 'score').reverse();
                })
                .then(function (options) {

                    var choices = options.map(function (option) {
                        return new Choice(option,
                                          option.metadata.description);
                    });
                    choices.push(new Choice("__manual", "No, looking for something else."));

                    return new PaginatedChoiceState(name, {
                        question: $('These categories may be relevant to your question:'),
                        choices: choices,
                        options_per_page: 8,
                        next: function (choice) {
                            if (choice.value === '__manual') {
                                return {
                                    name: 'states_train',
                                    creator_opts: {}
                                };
                            } else {
                                return {
                                    name: 'states_topics',
                                    creator_opts: choice.value,
                                };
                            }
                        }
                    });
                });
        });

        self.states.add('states_topics', function (name, opts) {
            answers = self.im.user.answers;
            return go.utils.get_robby_results(self.im, {
                    bucket: opts.classification + '_topics',
                    content: answers.states_start
                })
                .then(function (results) {
                    return _.sortBy(results, 'score').reverse();
                })
                .then(function (options) {
                    var choices = options.map(function (option) {
                        return new Choice(option, option.metadata.description);
                    });
                    choices.push(new Choice("__manual", "No, looking for something else."));

                    return new PaginatedChoiceState(name, {
                        question: $('These topics may be relevant to your question:'),
                        choices: choices,
                        options_per_page: 8,
                        next: function (choice) {
                            if (choice.value === '__manual') {
                                return {
                                    name: 'states_train',
                                    creator_opts: {}
                                };
                            } else {
                                return {
                                    name: 'states_content',
                                    creator_opts: choice.value,
                                };
                            }
                        }
                    });
                });
        });

        // Show answer to selected question
        self.states.add('states_content', function(name, opts) {
            return new MessengerPaginatedState(name, {
                title: $('Welcome to the FAQ Browser!'),
                text: opts.metadata.content,
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
