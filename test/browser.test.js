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
                .setup.char_limit(160)
                .setup.config.app({
                    name: 'snappy_browser_test',
                    env: 'test',
                    metric_store: 'test_metric_store',
                    testing: 'true',
                    testing_today: 'April 4, 2014 07:07:07',
                    endpoints: {
                        "sms": {"delivery_class": "sms"}
                    },
                    snappy: {
                        "endpoint": "https://app.besnappy.com/api/v1/",
                        "username": "980d2423-292b-4c34-be81-c74784b9e99a",
                        "account_id": "1"
                        // NOTE: default_faq is not set
                    }
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                })
                .setup(function(api) {
                    api.metrics.stores = {'test_metric_store': {}};
                });
        });

        describe('When the user starts a session', function () {
            it('should list all available FAQs', function () {
                return tester
                    .start()
                    .check.interaction({
                        state: 'states_faqs',
                        reply: [
                            'Welcome to FAQ Browser. Choose FAQ:',
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
                            'Welcome to FAQ Browser. Choose FAQ:',
                            '1. English',
                            '2. French'
                        ].join('\n')
                    })
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        assert.equal(smses.length, 0, 'It should not send the SMS!');
                    })
                    .run();
            });

            it('should *not* fire another sms send metric', function () {
                return tester
                    .setup.user.state('states_end')
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.equal(metrics['test.faq_sent_via_sms'], undefined);
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
                    endpoints: {
                        "sms": {"delivery_class": "sms"}
                    },
                    snappy: {
                        "endpoint": "https://app.besnappy.com/api/v1/",
                        "username": "980d2423-292b-4c34-be81-c74784b9e99a",
                        "account_id": "1",
                        "default_faq": "1"
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
                    .start()
                    .check.interaction({
                        state: 'states_topics',
                        reply: [
                            'Welcome to FAQ Browser. Choose topic:',
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
                            'If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the',
                            '1. More',
                            '2. Send to me by SMS'
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
                    .check(function(api) {
                        var metrics = api.metrics.stores.test_metric_store;
                        assert.equal(metrics['test.faq_view_question'], undefined);
                    })
                    .run();
            });
        });

        // test long faq answer splitting
        describe("T4.a When the user chooses question 999", function() {
            it("should show the first part of the answer of 999", function() {
                return tester
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
                            'It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To',
                            '1. More',
                            '2. Send to me by SMS'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T4.b When the user chooses question 999 and then 1. More", function() {
            it("should show the second part of the answer to 999", function() {
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
                            'illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want',
                            '1. More',
                            '2. Back',
                            '3. Send to me by SMS'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T4.c When the user chooses question 999 and then 1. More twice", function() {
            it("should show the third part of the answer to 999", function() {
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
                        reply: ['to test properly. Let\'s see.',
                            '1. Back',
                            '2. Send to me by SMS'
                        ].join('\n')
                    })
                    .run();
            });
        });

        describe("T5. When the user chooses to Send by SMS", function() {
            it("should thank the user, send sms, and exit", function() {
                return tester
                    .setup.user.state('states_questions', {
                        creator_opts: {
                            faq_id: 1
                        }
                    })
                    .setup.user.answers({'states_topics': '52'})
                    .inputs('3', '1', '2')
                    .check.interaction({
                        state: 'states_end',
                        reply: ('Thank you. Your SMS will be delivered shortly.')
                    })
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        var sms = smses[0];
                        assert.equal(smses.length, 1);
                        assert.equal(sms.content,
                            "It will be split into multiple pages on a bookletstate, showing " +
                            "content on different screens as the text gets too long. To " +
                            "illustrate this, this super long response has been faked. This " +
                            "should be split over at least 2 screens just because we want to " +
                            "test properly. Let\'s see."
                        );
                    })
                    .check.reply.ends_session()
                    .run();
            });

            it('should use a delegator state for sending the SMS', function () {
                return tester
                    .setup.user.state('states_send_sms', {
                        creator_opts: {
                            answer: 'foo'
                        }
                    })
                    .input('hi')
                    .check.interaction({
                        state: 'states_end',
                        reply: ('Thank you. Your SMS will be delivered shortly.')
                    })
                    .check(function(api) {
                        var smses = _.where(api.outbound.store, {
                            endpoint: 'sms'
                        });
                        var sms = smses[0];
                        assert.equal(smses.length, 1);
                        assert.equal(sms.content, 'foo');
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });
    });
});
