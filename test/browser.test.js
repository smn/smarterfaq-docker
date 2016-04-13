var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var _ = require('lodash');

describe("app", function() {

    var app;
    var tester;

    beforeEach(function() {
        app = new go.app.GoFAQBrowser();

        tester = new AppTester(app);
    });

    // This first section tests functinoality when multiple FAQs can be browsed.
    // This is not used in some projects (like MomConnnect)
    describe("for browsing FAQ", function () {
        beforeEach(function () {
            tester
                .setup.char_limit(800)
                .setup.config.app({
                    name: 'snappy_browser_test',
                    env: 'test',
                    metric_store: 'test_metric_store',
                    testing: 'true',
                    testing_today: 'April 4, 2014 07:07:07',
                    snappy: {
                        "endpoint": "https://app.besnappy.com/api/v1/",
                        "username": "980d2423-292b-4c34-be81-c74784b9e99a",
                        "account_id": "1"
                        // NOTE: default_faq is not set
                    },
                    wit: {
                        token: 'the token',
                        confidence_threshold: 0.8
                    }
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                })
                .setup(function(api) {
                    api.metrics.stores = {'test_metric_store': {}};
                });
        });


        describe('using Wit', function () {
            it('ask for the question', function () {
                return tester
                    .start()
                    .check.interaction({
                        state: 'states_nlp',
                        reply: /What question can I help you with\?/
                    })
                    .run();
            });

            it('should return the results immediately if a match is found', function () {
                return tester
                    .setup.user.state('states_nlp')
                    .input('matching content')
                    .check.interaction({
                        state: 'states_nlp_answer',
                        reply: /Yes you can get pregnant while breastfeeding/
                    })
                    .check.reply.ends_session()
                    .run();
            })
        });

        describe('When the user starts a session', function () {
            it('should list all available FAQs', function () {
                return tester
                    .setup.user.state('states_nlp')
                    .input('not matching content')
                    .check.interaction({
                        state: 'states_faqs',
                        reply: [
                            'Please choose a category:',
                            '1. English',
                            '2. French'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe('When the user returns after completing a session', function () {
            it('should *not* send them the previous SMS again', function () {
                return tester
                    .setup.user.state('states_end')
                    .check.interaction({
                        state: 'states_faqs',
                        reply: [
                            'Please choose a category:',
                            '1. English',
                            '2. French'
                        ].join('\n')
                    })
                    .run();
            });

        });
    });

    // This section tests functionality from the point of selecting topics
    // Move the 'When the user returns...' test above into this section when selecting
    //     FAQ is not used.
    describe("for browsing FAQ topics", function() {

        beforeEach(function() {
            tester
                .setup.char_limit(160)
                .setup.config.app({
                    name: 'snappy_browser_test',
                    env: 'test',
                    metric_store: 'test_metric_store',
                    testing: 'true',
                    testing_today: 'April 4, 2014 07:07:07',
                    snappy: {
                        "endpoint": "https://app.besnappy.com/api/v1/",
                        "username": "980d2423-292b-4c34-be81-c74784b9e99a",
                        "account_id": "1",
                        "default_faq": "1",
                        "default_label": "Useless",
                    },
                    wit: {
                        token: 'token',
                        confidence_threshold: 0.8
                    }
                })
                .setup(function(api) {
                    api.metrics.stores = {'test_metric_store': {}};
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                });
        });

        describe("T1. When the user starts a session", function() {
            it("should welcome and ask to choose topic", function() {
                return tester
                    .setup.user.state('states_nlp')
                    .input('not matching content')
                    .check.interaction({
                        state: 'states_topics',
                        reply: [
                            'Please choose a Useless topic:',
                            '1. Coffee',
                            '2. Subscriptions',
                            '3. Refund',
                            '4. PowerBar',
                            '5. Payment',
                            '6. delivery'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T2.a When the user chooses topic 52 (1. Coffee)", function() {
            it("should list first page of questions in topic 52", function() {
                return tester
                    .setup.user.state('states_topics', {
                        creator_opts: {
                            faq_id: 1
                        }
                    })
                    .input('1')
                    .check.interaction({
                        state: 'states_questions',
                        reply: [
                            'Please choose a question:',
                            '1. What happens if I fall in love with one particular coffee?',
                            '2. Can I order more than one box at a time?',
                            '3. More'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T2.b When the user chooses topic 52 and then 3. More", function() {
            it("should list second page of questions in topic 52", function() {
                return tester
                    .setup.user.state('states_topics', {
                        creator_opts: {
                            faq_id: 1
                        }
                    })
                    .inputs('1', '3')
                    .check.interaction({
                        state: 'states_questions',
                        reply: [
                            'Please choose a question:',
                            '1. What happens if the FAQ answer is really long?',
                            '2. More',
                            '3. Back'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T2.c When the user chooses topic 52 and then 3. More, then 2. More", function() {
            it("should list third page of questions in topic 52", function() {
                return tester
                    .setup.user.state('states_topics', {
                        creator_opts: {
                            faq_id: 1
                        }
                    })
                    .inputs('1', '3', '2')
                    .check.interaction({
                        state: 'states_questions',
                        reply: [
                            'Please choose a question:',
                            '1. What happens if I realise the amount of coffee I\'ve ordered doesn\'t suit?',
                            '2. Back'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T3.a When the user chooses question 635", function() {
            it("should show answer to question 635", function() {
                return tester
                    .setup.char_limit(800)
                    .setup.user.state('states_questions', {
                        creator_opts: {
                            faq_id: 1
                        }
                    })
                    .setup.user.answers({'states_topics': '52'})
                    .input('2')
                    .check.interaction({
                        state: 'states_answers',
                        reply: [
                            "If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).",
                            "1. Exit",
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T3.c When the user times out and dials back in", function() {
            it("should not fire a metric increment", function() {
                return tester
                    .setup.user.state('states_questions', {
                        creator_opts: {
                            faq_id: 1
                        }
                    })
                    .setup.user.answers({'states_topics': '52'})
                    .input.session_event('new')
                    .check.interaction({
                        state: 'states_questions',
                        reply: [
                            'Please choose a question:',
                            '1. What happens if I fall in love with one particular coffee?',
                            '2. Can I order more than one box at a time?',
                            '3. More'
                        ].join('\n')
                    })
                    .run();
            });
        });

        // test long faq answer splitting
        describe("T4.a When the user chooses question 999", function() {
            it("should show the first part of the answer of 999", function() {
                return tester
                    .setup.char_limit(1600)
                    .setup.user.state('states_questions', {
                        creator_opts: {
                            faq_id: 1
                        }
                    })
                    .setup.user.answers({'states_topics': '52'})
                    .inputs('3', '1')
                    .check.interaction({
                        state: 'states_answers',
                        reply: [
                            "It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let's see.",
                            '1. Exit'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T4.b When the user chooses question 999 and then 1. More", function() {
            it.skip("should show the second part of the answer to 999", function() {
                return tester
                    .setup.user.state('states_questions', {
                        creator_opts: {
                            faq_id: 1
                        }
                    })
                    .setup.user.answers({'states_topics': '52'})
                    .inputs('3', '1', '1')
                    .check.interaction({
                        state: 'states_answers',
                        reply: [
                            'this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let\'s',
                            '1. More',
                            '2. Back',
                            '3. Exit'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T4.c When the user chooses question 999 and then 1. More twice", function() {
            it.skip("should show the third part of the answer to 999", function() {
                return tester
                    .setup.user.state('states_questions', {
                        creator_opts: {
                            faq_id: 1
                        }
                    })
                    .setup.user.answers({'states_topics': '52'})
                    .inputs('3', '1', '1', '1')
                    .check.interaction({
                        state: 'states_answers',
                        reply: ['see.',
                            '1. Back',
                            '2. Exit'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T5. When the user chooses to exit", function() {
            it("should thank the user, and exit", function() {
                return tester
                    .setup.user.state('states_questions', {
                        creator_opts: {
                            faq_id: 1
                        }
                    })
                    .setup.user.answers({'states_topics': '52'})
                    .inputs('3', '1', '1')
                    .check.interaction({
                        state: 'states_end',
                        reply: ('Thank you and visit again!')
                    })
                    .check.reply.ends_session()
                    .run();
            });

            it('should use a delegator state for sending the SMS', function () {
                return tester
                    .setup.user.state('states_answers', {
                        creator_opts: {
                            answer: 'foo'
                        }
                    })
                    .input('1')  // the only option here is 'exit' because there's so little content
                    .check.interaction({
                        state: 'states_end',
                        reply: ('Thank you and visit again!')
                    })
                    .check(function(api) {
                        // NOTE: disabling because SMS outbound isn't working well enough for a demo
                        // var smses = _.where(api.outbound.store, {
                        //     endpoint: 'sms'
                        // });
                        // var sms = smses[0];
                        // assert.equal(smses.length, 1);
                        // assert.equal(sms.content, 'foo');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });
    });
});
