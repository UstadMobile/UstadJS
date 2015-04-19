/*

UstadJS

Copyright 2014 UstadMobile, Inc
  www.ustadmobile.com

Ustad Mobile is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version with the following additional terms:
 
All names, links, and logos of Ustad Mobile and Toughra Technologies FZ
LLC must be kept as they are in the original distribution.  If any new
screens are added you must include the Ustad Mobile logo as it has been
used in the original distribution.  You may not create any new
functionality whose purpose is to diminish or remove the Ustad Mobile
Logo.  You must leave the Ustad Mobile logo as the logo for the
application to be used with any launcher (e.g. the mobile app launcher).
 
If you want a commercial license to remove the above restriction you must
contact us and purchase a license without these restrictions.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
 
Ustad Mobile is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

 */
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                seperator : ";"
            },
            dist : {
                src: ['src/**/*.js'],
                dest: 'dist/<%= pkg.name %>.js'
            },
            css: {
                src: ['src/**/*.css'],
                dest: 'dist/<%= pkg.name %>.css'
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        
        blanket_qunit: {
            all : {
                options: {
                    urls: [
                        'test/test-opubframe.html?coverage=true&gruntReport',
                        'test/test-core.html?coverage=true&gruntReport',
                        //Temporarily disabled whilst being reworked to cooperate with JQueryMobile
                        'test/test-opdsbrowser.html?coverage=true&gruntReport',
                        'test/test-microemu.html?coverage=true&gruntReport'
                    ],
                    threshold: 80
                }
            }
            
        }        
    });
    
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-blanket-qunit');
    
    grunt.registerTask("default", ["jshint", "blanket_qunit", "concat"]);
};
