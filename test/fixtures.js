module.exports = function () {
    return [
        // FAQ RESPONSE
        {
            'request': {
                'method': 'GET',
                'headers': {
                    'Authorization': ['Basic ' + new Buffer('test:test'.toString('base64'))],
                    'Content-Type': ['application/json']
                },
                'url': 'https://app.besnappy.com/api/v1/account/1/faqs'
            },
            'response': {
                'code': '200',
                'data': [{
                    "id": 2,
                    "account_id": 1,
                    "title": "French",
                    "url": "french",
                    "custom_theme": null,
                    "culture": "en",
                    "navigation": null,
                    "created_at": "2014-08-29 12:23:05",
                    "updated_at": "2014-08-29 12:23:05",
                    "order": 1
                }, {
                    "id": 1,
                    "account_id": 1,
                    "title": "English",
                    "url": "english",
                    "custom_theme": null,
                    "culture": "en",
                    "navigation": null,
                    "created_at": "2014-08-29 12:23:05",
                    "updated_at": "2014-08-29 12:23:05",
                    "order": 0
                }]
            }
        },
        // TOPIC RESPONSE
        {
            'request': {
                'method': 'GET',
                'headers': {
                    'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                    'Content-Type': ['application/json']
                },
                'url': 'https://app.besnappy.com/api/v1/account/1/faqs/1/topics'
            },
            'response': {
                "code": "200",
                "data": [{
                    "id": "52",
                    "faq_id": "2752",
                    "topic": "Coffee",
                    "order": "0",
                    "created_at": "2014-01-08 02:15:05",
                    "updated_at": "2014-01-08 02:15:05",
                    "slug": "coffee"
                }, {
                    "id": "240",
                    "faq_id": "2752",
                    "topic": "delivery",
                    "order": "5",
                    "created_at": "2014-01-08 02:15:09",
                    "updated_at": "2014-01-08 02:15:09",
                    "slug": "delivery"
                }, {
                    "id": "110",
                    "faq_id": "2752",
                    "topic": "Payment",
                    "order": "4",
                    "created_at": "2014-01-08 02:15:07",
                    "updated_at": "2014-01-08 02:15:07",
                    "slug": "payment"
                }, {
                    "id": "319",
                    "faq_id": "2752",
                    "topic": "PowerBar",
                    "order": "3",
                    "created_at": "2014-02-24 09:37:24",
                    "updated_at": "2014-02-24 09:37:24",
                    "slug": "powerbar"
                }, {
                    "id": "92",
                    "faq_id": "2752",
                    "topic": "Refund",
                    "order": "2",
                    "created_at": "2014-01-08 02:15:06",
                    "updated_at": "2014-01-08 02:15:06",
                    "slug": "refund"
                }, {
                    "id": "23",
                    "faq_id": "2752",
                    "topic": "Subscriptions",
                    "order": "1",
                    "created_at": "2014-01-08 02:15:05",
                    "updated_at": "2014-01-08 02:15:05",
                    "slug": "subscriptions"
                }]
            }
        },
        // QA RESPONSE
        {
            'repeatable': true,
            'request': {
                'method': 'GET',
                'headers': {
                    'Authorization': ['Basic ' + new Buffer('test:test').toString('base64')],
                    'Content-Type': ['application/json']
                },
                'url': 'https://app.besnappy.com/api/v1/account/1/faqs/1/topics/52/questions'
            },
            'responses': [{
                "code": 200,
                "data": [{
                    "id": "635",
                    "account_id": "50",
                    "question": "Can I order more than one box at a time?",
                    "answer": "If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).",
                    "created_at": "2013-11-19 09:17:34",
                    "updated_at": "2014-02-24 09:36:54",
                    "active": "1",
                    "parsed_answer": "<p>If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "635",
                        "featured": "0",
                        "order": "1"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                }, {
                    "id": "634",
                    "account_id": "50",
                    "question": "What happens if I fall in love with one particular coffee?",
                    "answer": "At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!",
                    "created_at": "2013-11-19 09:16:36",
                    "updated_at": "2013-11-19 14:34:50",
                    "active": "1",
                    "parsed_answer": "<p>At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "634",
                        "featured": "0",
                        "order": "0"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                },
                {
                    "id": "999",
                    "account_id": "50",
                    "question": "What happens if the FAQ answer is really long?",
                    "answer": "It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let's see.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                },
                {
                    "id": "633",
                    "account_id": "50",
                    "question": "What happens if I realise the amount of coffee I've ordered doesn't suit?",
                    "answer": "If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                }]
            },
            {
                "code": 200,
                "data": [{
                    "id": "635",
                    "account_id": "50",
                    "question": "Can I order more than one box at a time?",
                    "answer": "If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).",
                    "created_at": "2013-11-19 09:17:34",
                    "updated_at": "2014-02-24 09:36:54",
                    "active": "1",
                    "parsed_answer": "<p>If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "635",
                        "featured": "0",
                        "order": "0"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                }, {
                    "id": "634",
                    "account_id": "50",
                    "question": "What happens if I fall in love with one particular coffee?",
                    "answer": "At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!",
                    "created_at": "2013-11-19 09:16:36",
                    "updated_at": "2013-11-19 14:34:50",
                    "active": "1",
                    "parsed_answer": "<p>At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "634",
                        "featured": "0",
                        "order": "1"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                },
                {
                    "id": "999",
                    "account_id": "50",
                    "question": "What happens if the FAQ answer is really long?",
                    "answer": "It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let's see.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                },
                {
                    "id": "633",
                    "account_id": "50",
                    "question": "What happens if I realise the amount of coffee I've ordered doesn't suit?",
                    "answer": "If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                }]
            },
            {
                "code": 200,
                "data": [{
                    "id": "635",
                    "account_id": "50",
                    "question": "Can I order more than one box at a time?",
                    "answer": "If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).",
                    "created_at": "2013-11-19 09:17:34",
                    "updated_at": "2014-02-24 09:36:54",
                    "active": "1",
                    "parsed_answer": "<p>If the default box of 2 x 250g is not enough for your needs, you can increase the quantity up to 7 bags (or consider the Bulk subscription, starting at 2kgs).</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "635",
                        "featured": "0",
                        "order": "0"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                }, {
                    "id": "634",
                    "account_id": "50",
                    "question": "What happens if I fall in love with one particular coffee?",
                    "answer": "At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!",
                    "created_at": "2013-11-19 09:16:36",
                    "updated_at": "2013-11-19 14:34:50",
                    "active": "1",
                    "parsed_answer": "<p>At this point, we are offering the mixed box of different local coffee brands, but plan to offer a customised service for you in the near future where you will be able to choose exactly which brand you would like to receive. Watch this space!</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "634",
                        "featured": "0",
                        "order": "1"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": null,
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": null,
                        "forward_shown": "1",
                        "badge_url": null,
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": true,
                        "is_trial": false
                    }
                },
                {
                    "id": "999",
                    "account_id": "50",
                    "question": "What happens if the FAQ answer is really long?",
                    "answer": "It will be split into multiple pages on a bookletstate, showing content on different screens as the text gets too long. To illustrate this, this super long response has been faked. This should be split over at least 2 screens just because we want to test properly. Let's see.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                },
                {
                    "id": "633",
                    "account_id": "50",
                    "question": "What happens if I realise the amount of coffee I've ordered doesn't suit?",
                    "answer": "If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.",
                    "created_at": "2013-11-19 09:15:46",
                    "updated_at": "2014-02-21 12:04:14",
                    "active": "1",
                    "parsed_answer": "<p>If you realise that you either over or underestimated your coffee needs, you can easily upgrade your subscription quantity.</p> ",
                    "pivot": {
                        "topic_id": "52",
                        "question_id": "633",
                        "featured": "0",
                        "order": "2"
                    },
                    "account": {
                        "id": "50",
                        "organization": "One Less Thing",
                        "domain": "wcl.besnappy.com",
                        "plan_id": "4",
                        "active": "1",
                        "created_at": "2012-12-10 14:25:16",
                        "updated_at": "2014-06-19 15:26:05",
                        "custom_domain": "null",
                        "trial_ends_at": "2013-06-28 23:59:00",
                        "cancel_message": "null",
                        "forward_shown": "1",
                        "badge_url": "null",
                        "last_paid_at": "2014-06-19 15:26:05",
                        "is_paid": "true",
                        "is_trial": "false"
                    }
                }]
            }]
        },
    ];
};
