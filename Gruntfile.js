module.exports = function (grunt) {
    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    var buildProperties = {
        appName: 'routeInjector',
        rootPath: 'lib/engine/backoffice/',
        frontSrcBasePath: '<%= config.rootPath %>public/',
        adminFolder: '<%= config.frontSrcBasePath %>admin/',
        bowerFolder: '<%= config.adminFolder %>bower_components/',
        injectorFolder: '<%= config.adminFolder %>injector-assets/',
        distFolder: '<%= config.adminFolder %>dist/',
        sassFolder: '<%= config.injectorFolder %>styles/sass',
        cssFolder: '<%= config.injectorFolder %>styles/css'
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON('./package.json'),
        config: buildProperties,
        jshint: {
            options: {

                force: true,
                curly: true, // Require {} for every new block or scope.
                eqeqeq: false, // Require triple equals i.e. `===`.
                eqnull: true,
                latedef: false, // Prohibit variable use before definition.
                unused: false, // Warn unused variables.
                undef: true, // Require all non-global variables be declared before they are used.
                maxparams: 15,
                browser: true, // Standard browser globals e.g. `window`, `document`.
                validthis: true,
                globals: {
                    jQuery: true,
                    $: true,
                    angular: true,
                    alert: true,
                    console: true,
                    _: true,
                    NotificationFx: true,
                    Modernizr: true,
                    popup: true,
                    showNotAddedCartNotification: true,
                    showNotification: true,
                    self: true,
                    FB: true,
                    IosSlider: true,
                    sliderProductos: true,
                    backoffice: true,
                    safeAccess: true
                }
            },
            uses_defaults: ['!<%= config.injectorFolder %>js/livereload.js', '<%= config.injectorFolder %>js/**/*.js', '<%= config.injectorFolder %>js/**/**/*.js']
        },
        sass: {
            dev: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= config.sassFolder %>',
                        src: ['main.scss'],
                        dest: '<%= config.cssFolder %>',
                        ext: '.css'
                    }
                ]
            },
            options: {
                sourceMap: false,
                outputStyle: 'compressed'
            }
        },
        watch: {
            css: {
                files: ['<%= config.sassFolder %>/{,*/}*.{scss,sass}', '!<%= config.distFolder %>/**'],
                tasks: ['sass'],
                options: {
                    livereload: true
                }
            },
            js: {
                files: ['<%= config.adminFolder %>**/*.js', '!<%= config.distFolder %>/**'],
                //files: ['<%= config.injectorFolder %>**/*.js'],
                tasks: ['default'],
                options: {
                    livereload: true
                }
            },
            html: {
                files: ['<%= config.injectorFolder %>**/*.html', '!<%= config.distFolder %>/**'],
                tasks: ['default'],
                options: {
                    livereload: true
                }
            }
        },
        notify_hooks: {
            options: {
                enabled: true,
                max_jshint_notifications: 5, // maximum number of notifications from jshint output
                title: "<%= config.appName %> Project msg:"
            }
        },
        clean: {
            initclean: {
                src: ['<%= config.distFolder %>*.*']
            },
            postclean: {
                src: ['<%= config.distFolder %>*-libs.js']
            },
            postmin: {
                src: ['<%= config.distFolder %>*-libs.js', '<%= config.distFolder %>*.min.temp.js']
            }
        },
        ngAnnotate: {
            options: {
                ngAnnotateOptions: {},
                singleQuotes: true
            },
            addRemove: {
                options: {
                    add: true,
                    remove: true
                },
                files: [
                    {
                        src: [
                            '<%= config.injectorFolder %>js/bootstrap.js',
                            '<%= config.injectorFolder %>js/backoffice.js',
                            '<%= config.injectorFolder %>js/configs/routes.js',
                            '<%= config.injectorFolder %>js/configs/translation.js',
                            '<%= config.injectorFolder %>js/provider/customMenuProvider.js',
                            '<%= config.injectorFolder %>js/provider/loginProvider.js',
                            '<%= config.injectorFolder %>js/provider/modelsProvider.js',
                            //'<%= config.injectorFolder %>js/provider/configsProvider.js',
                            '<%= config.injectorFolder %>js/provider/selectCacheProvider.js',
                            '<%= config.injectorFolder %>js/services/httpResponseInterceptor.js',
                            '<%= config.injectorFolder %>js/services/flash.js',
                            '<%= config.injectorFolder %>js/services/dependsOn.js',
                            '<%= config.injectorFolder %>js/services/common.js',
                            '<%= config.injectorFolder %>js/services/search.js',
                            '<%= config.injectorFolder %>js/directives/sideMenuDirective.js',
                            '<%= config.injectorFolder %>js/directives/scrollToItem.js',
                            '<%= config.injectorFolder %>js/directives/compileDirective.js',
                            '<%= config.injectorFolder %>js/directives/injector-punchcard/injector-punchcard.js',
                            '<%= config.injectorFolder %>js/directives/injector-bargraph/injector-bargraph.js',
                            '<%= config.injectorFolder %>js/directives/model-buttons/model-buttons.js',
                            '<%= config.injectorFolder %>js/directives/search-model/search-model.js',
                            '<%= config.injectorFolder %>js/directives/group-buttons/group-buttons.js',
                            '<%= config.injectorFolder %>js/directives/ellipsis/ellipsis.js',
                            '<%= config.injectorFolder %>js/directives/loading.directive.js',
                            //'<%= config.injectorFolder %>js/directives/asset-loader/asset-loader.js',
                            '<%= config.injectorFolder %>js/controllers/createController.js',
                            '<%= config.injectorFolder %>js/controllers/graphsController.js',
                            '<%= config.injectorFolder %>js/controllers/updateController.js',
                            '<%= config.injectorFolder %>js/controllers/formController.js',
                            '<%= config.injectorFolder %>js/controllers/loginController.js',
                            '<%= config.injectorFolder %>js/controllers/mainController.js',
                            '<%= config.injectorFolder %>js/controllers/modelController.js',
                            '<%= config.injectorFolder %>js/controllers/navbarController.js',
                            '<%= config.injectorFolder %>js/controllers/shardingController.js',
                            '<%= config.injectorFolder %>js/controllers/translateController.js',
                            '<%= config.injectorFolder %>js/global/metronic.js',
                            '<%= config.injectorFolder %>js/global/layout.js',
                            '<%= config.injectorFolder %>js/global/custom.js'
                        ],
                        dest: '<%= config.distFolder %><%= config.appName %>.js'
                    }
                ]
            },
            addRemoveLibs: {
                options: {
                    add: true,
                    remove: true
                },
                files: [
                    {
                        src: [
                            '<%= config.bowerFolder %>safe-access/safe-access.js',
                            '<%= config.bowerFolder %>codemirror/lib/codemirror.js',
                            '<%= config.bowerFolder %>codemirror/addon/edit/matchbrackets.js',
                            '<%= config.bowerFolder %>codemirror/addon/fold/foldcode.js',
                            '<%= config.bowerFolder %>codemirror/addon/fold/foldgutter.js',
                            '<%= config.bowerFolder %>codemirror/addon/fold/brace-fold.js',
                            '<%= config.bowerFolder %>spectrum/spectrum.js',
                            '<%= config.bowerFolder %>spectrum/i18n/jquery.spectrum-sv.js',
                            '<%= config.adminFolder %>angular-schema-form-select2/dist/bootstrap-select2.js',
                            '<%= config.adminFolder %>angular-schema-form-simple-select2/dist/bootstrap-simple-select2.js',
                            '<%= config.adminFolder %>angular-schema-form-datetimepicker/dist/bootstrap-datetimepicker.js',
                            '<%= config.adminFolder %>angular-schema-form-new-image/dist/bootstrap-new-imageinjector.js',
                            '<%= config.adminFolder %>angular-schema-form-image/dist/bootstrap-imageinjector.js',
                            '<%= config.adminFolder %>angular-schema-form-file/dist/bootstrap-fileinjector.js',
                            '<%= config.adminFolder %>angular-schema-form-mixed/dist/bootstrap-mixed.js',
                            '<%= config.adminFolder %>angular-schema-form-button/dist/bootstrap-button.js',
                            '<%= config.adminFolder %>angular-schema-form-textarea/dist/bootstrap-textarea.js',
                            '<%= config.adminFolder %>angular-schema-form-password/dist/bootstrap-password.js',
                            '<%= config.adminFolder %>angular-schema-form-seconds/dist/bootstrap-seconds.js',
                            '<%= config.adminFolder %>angular-schema-form-multiselect/dist/bootstrap-multiselect.js',
                            '<%= config.adminFolder %>angular-schema-form-rating/dist/bootstrap-rating.js',
                            '<%= config.adminFolder %>angular-schema-form-ritinymce/bootstrap-ritinymce.js',
                            '<%= config.bowerFolder %>angular-punch-card/dist/punch-card.js',
                            '<%= config.bowerFolder %>json-human/src/json.human.js',
                            '<%= config.adminFolder %>angular-flash/angular-flash.js',
                            '<%= config.adminFolder %>ngf-upload-patched/ng-file-upload-all.js'
                        ],
                        dest: '<%= config.distFolder %><%= config.appName %>-angular-libs.js'
                    }
                ]
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= config.appName %> <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                mangle: true,
                preserveComments: false,
            },
            lib_build: {
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true
                },
                files: [
                    {
                        src: '<%= config.distFolder %><%= config.appName %>-angular-libs.js',
                        dest: '<%= config.distFolder %><%= config.appName %>-angular-libs.min.temp.js'
                    }
                ]
            },
            build: {
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true
                },
                files: [
                    {
                        src: '<%= config.distFolder %><%= config.appName %>.js',
                        dest: '<%= config.distFolder %><%= config.appName %>.min.js',
                    }
                ]
            }
        },
        concat: {
            options: {
                separator: '\n/* concat */',
                //sourceMap: true,
                //sourceMapIncludeSources: true
            },
            dist: {
                src: [
                    '<%= config.bowerFolder %>jquery-ui/ui/minified/jquery-ui.min.js',
                    //'<%= config.bowerFolder %>ng-file-upload/ng-file-upload-shim.min.js',
                    '<%= config.bowerFolder %>angular/angular.min.js',
                    '<%= config.bowerFolder %>angular-route/angular-route.min.js',
                    '<%= config.bowerFolder %>angular-translate/angular-translate.min.js',
                    '<%= config.bowerFolder %>angular-translate-storage-local/angular-translate-storage-local.min.js',
                    '<%= config.bowerFolder %>angular-translate-storage-cookie/angular-translate-storage-cookie.min.js',
                    '<%= config.bowerFolder %>angular-translate-loader-partial/angular-translate-loader-partial.min.js',
                    '<%= config.bowerFolder %>ngDialog/js/ngDialog.min.js',
                    '<%= config.bowerFolder %>ng-biscuit/dist/ng-biscuit.min.js',
                    '<%= config.bowerFolder %>angular-cookies/angular-cookies.min.js',
                    '<%= config.bowerFolder %>angular-animate/angular-animate.min.js',
                    '<%= config.bowerFolder %>ace-builds/src-min-noconflict/ace.js',
                    '<%= config.bowerFolder %>angular-sanitize/angular-sanitize.min.js',
                    '<%= config.bowerFolder %>angular-ui-sortable/sortable.min.js',
                    '<%= config.bowerFolder %>angular-ui-bootstrap/ui-bootstrap-tpls-0.11.2.min.js',
                    '<%= config.bowerFolder %>angular-ui-select/dist/select.min.js',
                    '<%= config.bowerFolder %>tinymce/tinymce.min.js',
                    '<%= config.bowerFolder %>tinymce/plugins/**/plugin.min.js',
                    '<%= config.bowerFolder %>tinymce/themes/**/theme.min.js',
                    '<%= config.bowerFolder %>angular-ui-ace/ui-ace.min.js',
                    '<%= config.bowerFolder %>angular-spectrum-colorpicker/dist/angular-spectrum-colorpicker.min.js',
                    '<%= config.bowerFolder %>d3/d3.min.js',
                    '<%= config.bowerFolder %>nvd3/nv.d3.min.js',
                    '<%= config.bowerFolder %>objectpath/lib/ObjectPath.js', //TODO: MINIFY  !!!!
                    '<%= config.bowerFolder %>tv4/tv4.js', //TODO: MINIFY !!!!
                    '<%= config.bowerFolder %>angularjs-nvd3-directives/dist/angularjs-nvd3-directives.min.js',
                    '<%= config.bowerFolder %>angular-schema-form/dist/schema-form.min.js',
                    '<%= config.bowerFolder %>angular-schema-form/dist/bootstrap-decorator.min.js',
                    '<%= config.bowerFolder %>cinimex-angular-datepicker/dist/index.min.js',
                    '<%= config.bowerFolder %>angular-schema-form-colorpicker/bootstrap-colorpicker.min.js',
                    '<%= config.bowerFolder %>ng-droplet/dist/ng-droplet.min.js',
                    '<%= config.bowerFolder %>html2canvas/build/html2canvas.min.js',

                    '<%= config.distFolder %><%= config.appName %>-angular-libs.min.temp.js',
                ],
                dest: '<%= config.distFolder %><%= config.appName %>-angular-libs.min.js'
            },
            dev: {
                src: [
                    '<%= config.bowerFolder %>jquery-ui/ui/jquery-ui.js',
                    //'<%= config.bowerFolder %>ng-file-upload/ng-file-upload-shim.js',
                    '<%= config.bowerFolder %>angular/angular.js',
                    '<%= config.bowerFolder %>angular-route/angular-route.js',
                    '<%= config.bowerFolder %>angular-translate/angular-translate.js',
                    '<%= config.bowerFolder %>angular-translate-storage-local/angular-translate-storage-local.js',
                    '<%= config.bowerFolder %>angular-translate-storage-cookie/angular-translate-storage-cookie.js',
                    '<%= config.bowerFolder %>angular-translate-loader-partial/angular-translate-loader-partial.js',
                    '<%= config.bowerFolder %>ngDialog/js/ngDialog.js',
                    '<%= config.bowerFolder %>ng-biscuit/dist/ng-biscuit.js',
                    '<%= config.bowerFolder %>angular-cookies/angular-cookies.js',
                    '<%= config.bowerFolder %>angular-animate/angular-animate.js',
                    '<%= config.bowerFolder %>ace-builds/min-noconflict/ace.js',
                    '<%= config.bowerFolder %>angular-sanitize/angular-sanitize.js',
                    '<%= config.bowerFolder %>angular-ui-sortable/sortable.js',
                    '<%= config.bowerFolder %>angular-ui-bootstrap/ui-bootstrap-tpls-0.11.2.js',
                    '<%= config.bowerFolder %>angular-ui-select/dist/select.js',
                    '<%= config.bowerFolder %>tinymce/tinymce.js',
                    '<%= config.bowerFolder %>tinymce/plugins/**/plugin.js',
                    '<%= config.bowerFolder %>tinymce/themes/**/theme.js',
                    '<%= config.bowerFolder %>angular-ui-ace/ui-ace.js',
                    '<%= config.bowerFolder %>angular-spectrum-colorpicker/dist/angular-spectrum-colorpicker.js',
                    '<%= config.bowerFolder %>d3/d3.js',
                    '<%= config.bowerFolder %>nvd3/nv.d3.js',
                    '<%= config.bowerFolder %>objectpath/lib/ObjectPath.js',
                    '<%= config.bowerFolder %>tv4/tv4.js',
                    '<%= config.bowerFolder %>angularjs-nvd3-directives/dist/angularjs-nvd3-directives.js',
                    '<%= config.bowerFolder %>angular-schema-form/dist/schema-form.js',
                    '<%= config.bowerFolder %>angular-schema-form/dist/bootstrap-decorator.js',
                    '<%= config.bowerFolder %>cinimex-angular-datepicker/dist/index.js',
                    '<%= config.bowerFolder %>angular-schema-form-colorpicker/bootstrap-colorpicker.js',
                    '<%= config.bowerFolder %>ng-droplet/dist/ng-droplet.js',
                    '<%= config.bowerFolder %>html2canvas/build/html2canvas.js',

                    '<%= config.distFolder %><%= config.appName %>-angular-libs.js',
                ],
                dest: '<%= config.distFolder %><%= config.appName %>-angular-libs.min.js'
            }
        },
        //preprocess: {
        //    options: {
        //        inline: true,
        //        context: {
        //            DEBUG: false
        //        }
        //    },
        //    html: {
        //        src: [
        //            '<%= config.rootPath %>backoffice/dist/backoffice.html'
        //        ]
        //    }
        //},
        copy: {
            dist: {
                expand: true,
                src: ['<%= config.bowerFolder %>angular-sanitize/angular-sanitize.min.js.map'],           // copy all files and subfolders
                dest: '<%= config.distFolder %>',
                flatten: true,
                filter: 'isFile'// destination folder
            },
            tinymceskin: {
                cwd: '<%= config.bowerFolder %>',
                src: ['tinymce/skins/**/*', 'tinyvision/build/**/*'],          // copy all files and subfolders
                dest: '<%= config.distFolder %>extra',
                expand: true
            },
            cssinjector: {
                cwd: '<%= config.injectorFolder %>styles/css/',
                src: '*.*',           // copy all files and subfolders
                dest: '<%= config.distFolder %>css',
                expand: true
            },
            stylesbower: {
                cwd: '<%= config.bowerFolder %>',
                src: ['**/*.css', '**/*.woff2', '**/*.woff', '**/*.ttf'],           // copy all files and subfolders
                dest: '<%= config.distFolder %>css',
                expand: true
            },
            html: {
                cwd: '<%= config.injectorFolder %>',
                src: ['**/*.html'],           // copy all files and subfolders
                dest: '<%= config.distFolder %>',
                expand: true
            },
            codemirror: {
                cwd: '<%= config.bowerFolder %>codemirror/mode/javascript',
                src: ['javascript.js'],           // copy all files and subfolders
                dest: '<%= config.distFolder %>extra/codemirror',
                expand: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // This is required if you use any options.
    grunt.task.run('notify_hooks');

    grunt.registerTask('default', ['ngAnnotate:addRemoveLibs', 'ngAnnotate:addRemove', /*'jshint:uses_defaults',*/ 'concat:dev', 'sass:dev', 'clean:postclean', 'copy:tinymceskin', 'copy:html', 'copy:cssinjector', 'copy:stylesbower', 'copy:codemirror']); //, 'sass:dev']);
    grunt.registerTask('dist', ['clean:initclean', 'ngAnnotate:addRemoveLibs', 'ngAnnotate:addRemove', /*'jshint:uses_defaults',*/ 'uglify:build', 'uglify:lib_build', 'concat:dist', 'sass:dev', 'clean:postmin', 'copy:dist', 'copy:tinymceskin', 'copy:html', 'copy:cssinjector', 'copy:stylesbower', 'copy:codemirror']);//, 'preprocess:html']);

};
