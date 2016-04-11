var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var _ = require('lodash');
var Q = require('q');

describe("app", function() {

    var app;
    var tester;

    beforeEach(function() {
        app = new go.app.GoFAQBrowser();
        tester = new AppTester(app);
        go.utils.get_robby_results = function (im, opts) {
            fixture = {
                categories: [{
                    bucket: 'categories',
                    classification: 'class1',
                    score: 15,
                    metadata: {
                        description: 'This is Class 1',
                    }
                }, {
                    bucket: 'categories',
                    classification: 'class2',
                    score: 10,
                    metadata: {
                        description: 'This is Class 2',
                    }
                }, {
                    bucket: 'categories',
                    classification: 'class3',
                    score: 5,
                    metadata: {
                        description: 'This is Class 3',
                    }
                }, {
                    bucket: 'categories',
                    classification: 'class4',
                    score: 0,
                    metadata: {
                        description: 'This is Class 4',
                    }
                }],

                class1_topics: [{
                    bucket: 'class1_topics',
                    classification: 'class1-topics-1',
                    score: 15,
                    metadata: {
                        description: 'Topic for Knights who say Ni are 1',
                        content: 'Topic for Knights who say Ni are 1',
                    }
                }, {
                    bucket: 'class1_topics',
                    classification: 'class1-topics-2',
                    score: 10,
                    metadata: {
                        description: 'Topic for Knights who say Ni are 2',
                        content: 'Topic for Knights who say Ni are 2',
                    }
                }, {
                    bucket: 'class1_topics',
                    classification: 'class1-topics-3',
                    score: 5,
                    metadata: {
                        description: 'Topic for Knights who say Ni are 3',
                        content: 'Topic for Knights who say Ni are 3',
                    }
                }, {
                    bucket: 'class1_topics',
                    classification: 'class1-topics-4',
                    score: 0,
                    metadata: {
                        description: 'Topic for Knights who say Ni are 4',
                        content: 'Topic for Knights who say Ni are 4',
                    }
                }]
            }
            return Q(fixture[opts.bucket])
        }
    });

    describe("Smarter FAQ Browser", function () {
        beforeEach(function () {
            tester
                .setup.char_limit(800)
                .setup.config.app({
                    name: 'snappy_browser_test',
                    testing_today: 'April 4, 2014 07:07:07',
                    snappy: {
                        "endpoint": "https://app.besnappy.com/api/v1/",
                        "username": "980d2423-292b-4c34-be81-c74784b9e99a",
                        "account_id": "1"
                        // NOTE: default_faq is not set
                    }
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                });
        });

        describe('When the user starts a session', function () {
            it('it should ask them for the question they want to ask', function () {
                return tester
                    .start()
                    .check.interaction({
                        state: 'states_start',
                        reply: /Welcome to MomConnect/i
                    })
                    .run();
            });

            it('should come with suggestions for categories', function () {
                return tester
                    .setup.user.state('states_start')
                    .input('Who are the Knights who say Ni?')
                    .check.interaction({
                        state: 'states_analyse',
                        reply: [
                            'These categories may be relevant to your question:',
                            '1. This is Class 1',
                            '2. This is Class 2',
                            '3. This is Class 3',
                            '4. This is Class 4',
                            '5. No, looking for something else.',
                        ].join('\n')
                    })
                    .run()
            });
        });

        describe('When a suitable category is found', function () {
            it('should come with suggestions for topics for that category', function () {
                return tester
                    .setup.user.state('states_analyse')
                    .setup.user.answers({
                        states_analyse: 'Who are the Knights who say Ni?'
                    })
                    .input('1')
                    .check.interaction({
                        state: 'states_topics',
                        reply: [
                            'These topics may be relevant to your question:',
                            '1. Topic for Knights who say Ni are 1',
                            '2. Topic for Knights who say Ni are 2',
                            '3. Topic for Knights who say Ni are 3',
                            '4. Topic for Knights who say Ni are 4',
                            '5. No, looking for something else.',
                        ].join('\n')
                    })
                    .run()
            });

            it('should return the relevant content when selecting a topic', function () {
                return tester
                    .setup.user.state('states_topics', {
                        creator_opts: {
                            classification: 'class1',
                            bucket: 'class1_topics',
                            metadata: {
                                content: 'This is the content',
                            }
                        }
                    })
                    .setup.user.answers({
                        states_analyse: 'Who are the Knights who say Ni?'
                    })
                    .input('1')
                    .check.interaction({
                        state: 'states_content',
                        reply: [
                            'Topic for Knights who say Ni are 1',
                            '1. Exit',
                        ].join('\n')
                    })
                    .run()
            });
        });

        describe('When the content is found', function () {
            it.skip('should return it to the user in a paginated state', function () {
                return tester
                    .setup.user.state('states_content')
                    .setup.user.answers({
                        states_analyse: 'Who are the Knights who say Ni?'
                    })
                    .input('1')
                    .check.interaction({
                        state: 'states_delivery',
                        reply: [
                            'The Knights who say "Ni", also called the Knights of Ni, are a band of knights encountered by King Arthur and his',
                            ' followers in the film Monty Python and the Holy Grail. They demonstrate their power by shouting "Ni!" (pronounced',
                            ' "nee"), terrifying the party, whom they refuse to allow passage through their forest unless appeased through the',
                            ' gift of a shrubbery.',
                        ].join('\n')
                    })
                    .run();
            })
        })
    });
});
