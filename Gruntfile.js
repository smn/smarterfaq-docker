

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        paths: {
            src: {
                app: {
                    browser: 'src/browser.js'
                },
                browser: [
                    'src/index.js',
                    'src/utils.js',
                    '<%= paths.src.app.browser %>',
                    'src/init.js'
                ],
                all: [
                    'src/**/*.js'
                ]
            },
            dest: {
                browser: 'go-app-browser.js'
            },
            test: {
                browser: [
                    'test/setup.js',
                    'src/utils.js',
                    '<%= paths.src.app.browser %>',
                    'test/browser.test.js'
                ]
            }
        },

        jshint: {
            options: {jshintrc: '.jshintrc'},
            all: [
                'Gruntfile.js',
                '<%= paths.src.all %>'
            ]
        },

        watch: {
            src: {
                files: ['<%= paths.src.all %>'],
                tasks: ['build']
            }
        },

        concat: {
            browser: {
                src: ['<%= paths.src.browser %>'],
                dest: '<%= paths.dest.browser %>'
            }
        },

        mochaTest: {
            options: {
                reporter: 'spec'
            },
            test_browser: {
                src: ['<%= paths.test.browser %>']
            }
        }
    });

    grunt.registerTask('test', [
        'jshint',
        'build',
        'mochaTest'
    ]);

    grunt.registerTask('build', [
        'concat'
    ]);

    grunt.registerTask('default', [
        'build',
        'test'
    ]);
};